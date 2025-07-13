import { getDb } from "@/lib/mongodb"
import { emailQueue } from "@/lib/email-queue"

export class EmailScheduler {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {}

  // Iniciar o agendador (roda a cada hora)
  start() {
    if (this.isRunning) {
      console.log("📅 Agendador já está rodando")
      return
    }

    console.log("🚀 Iniciando agendador de e-mails...")
    this.isRunning = true
    
    // Rodar imediatamente na inicialização
    this.checkAndSendEmails()
    
    // Agendar para rodar a cada hora (3600000 ms)
    this.intervalId = setInterval(() => {
      this.checkAndSendEmails()
    }, 3600000) // 1 hora
  }

  // Parar o agendador
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log("⏹️ Agendador de e-mails parado")
  }

  // Verificar e adicionar e-mails à fila
  private async checkAndSendEmails() {
    try {
      console.log("🔍 Verificando cobranças a vencer...")
      console.log("📅 Data/hora atual:", new Date().toISOString())
      
      const db = await getDb()
      
      // Data atual
      const hoje = new Date()
      const amanha = new Date(hoje)
      amanha.setDate(hoje.getDate() + 1)
      
      const hojeStr = hoje.toISOString().split('T')[0]
      const amanhaStr = amanha.toISOString().split('T')[0]
      
      console.log("📅 Hoje:", hojeStr)
      console.log("📅 Amanhã:", amanhaStr)
      
      // Buscar cobranças que vencem em 1 dia (sem lembrete enviado)
      const cobrancasAVencer = await db.collection("cobrancas").find({
        status: "pending", // Corrigido: era "pendente"
        vencimento: {
          $gte: hojeStr,
          $lte: amanhaStr
        },
        lembreteEnviado: { $ne: true }
      }).toArray()

      console.log(`📋 Encontradas ${cobrancasAVencer.length} cobranças a vencer`)

      // Buscar cobranças em atraso (sem alerta enviado)
      const cobrancasAtrasadas = await db.collection("cobrancas").find({
        status: "pending", // Corrigido: era "pendente"
        vencimento: { $lt: hojeStr },
        alertaAtrasadoEnviado: { $ne: true }
      }).toArray()

      console.log(`🚨 Encontradas ${cobrancasAtrasadas.length} cobranças em atraso`)

      // Log detalhado das cobranças atrasadas
      if (cobrancasAtrasadas.length > 0) {
        console.log("🔍 Detalhes das cobranças atrasadas:")
        cobrancasAtrasadas.forEach(c => {
          const diasAtraso = Math.floor((new Date(hojeStr).getTime() - new Date(c.vencimento).getTime()) / (1000 * 60 * 60 * 24))
          console.log(`   - ID: ${c._id}`)
          console.log(`   - Cliente: ${c.clienteId}`)
          console.log(`   - Vencimento: ${c.vencimento}`)
          console.log(`   - Dias de atraso: ${diasAtraso}`)
          console.log(`   - Status: ${c.status}`)
          console.log(`   - Já enviado?: ${c.alertaAtrasadoEnviado || false}`)
        })
      }

      // Adicionar lembretes à fila
      for (const cobranca of cobrancasAVencer) {
        try {
          console.log(`� Adicionando lembrete à fila para: ${cobranca.clienteId}`)
          
          await emailQueue.addReminderJob(
            cobranca.clienteId, // email
            cobranca.clienteId, // nome temporário
            {
              description: cobranca.descricao,
              amount: cobranca.valor,
              dueDate: cobranca.vencimento
            }
          )

          // Marcar como lembrete enviado
          await db.collection("cobrancas").updateOne(
            { _id: cobranca._id },
            { $set: { lembreteEnviado: true, ultimoLembrete: new Date() } }
          )
          
          console.log(`✅ Lembrete adicionado à fila para: ${cobranca.clienteId}`)
        } catch (error) {
          console.error(`❌ Erro ao processar cobrança ${cobranca._id}:`, error)
        }
      }

      // Adicionar alertas de atraso à fila
      for (const cobranca of cobrancasAtrasadas) {
        try {
          console.log(`🚨 Adicionando alerta à fila para: ${cobranca.clienteId}`)
          
          await emailQueue.addOverdueJob(
            cobranca.clienteId,
            cobranca.clienteId,
            {
              description: cobranca.descricao,
              amount: cobranca.valor,
              dueDate: cobranca.vencimento
            }
          )

          // Atualizar status e marcar alerta enviado
          await db.collection("cobrancas").updateOne(
            { _id: cobranca._id },
            { $set: { status: "overdue", alertaAtrasadoEnviado: true } }
          )
          
          console.log(`✅ Alerta adicionado à fila para: ${cobranca.clienteId}`)
        } catch (error) {
          console.error(`❌ Erro ao processar cobrança atrasada ${cobranca._id}:`, error)
        }
      }

    } catch (error) {
      console.error("❌ Erro no agendador de e-mails:", error)
    }
  }

  // Método para execução manual (para testes)
  async runNow() {
    console.log("🔧 Executando verificação manual...")
    await this.checkAndSendEmails()
  }
}

// Instância global do agendador
export const emailScheduler = new EmailScheduler()
