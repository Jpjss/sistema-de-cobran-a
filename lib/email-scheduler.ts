import { getDb } from "@/lib/mongodb"
import { emailQueue } from "@/lib/email-queue"

export class EmailScheduler {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null
  private ultimoEnvioDiario: string | null = null

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
    
    // Agendar para rodar a cada 2 minutos (120000 ms)
    this.intervalId = setInterval(() => {
      this.checkAndSendEmails()
    }, 120000) // 2 minutos
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
      console.log("🔍 Verificando todas as cobranças não pagas...")
      console.log("📅 Data/hora atual:", new Date().toISOString())
      
      // Verifica se já enviamos lembretes hoje
      const dataAtual = new Date()
      const diaAtual = dataAtual.getDate()
      const ultimoEnvio = this.ultimoEnvioDiario ? new Date(this.ultimoEnvioDiario) : null
      const deveEnviarLembretesDiarios = !ultimoEnvio || ultimoEnvio.getDate() !== diaAtual
      
      const db = await getDb()
      
      // Data atual e amanhã
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

      // Buscar todas as cobranças não pagas
      const cobrancasNaoPagas = await db.collection("cobrancas").find({
        status: { $in: ["pending", "pendente", "overdue"] }
      }).toArray()

      console.log(`📋 Encontradas ${cobrancasNaoPagas.length} cobranças não pagas`)

      // Se for um novo dia, enviar lembretes diários
      if (deveEnviarLembretesDiarios) {
        console.log("📬 Enviando lembretes diários para todas as cobranças não pagas...")
        
        for (const cobranca of cobrancasNaoPagas) {
          try {
            await emailQueue.addDailyReminderJob(
              cobranca.clienteId,
              cobranca.clienteId,
              {
                description: cobranca.descricao,
                amount: cobranca.valor,
                dueDate: cobranca.vencimento,
                status: cobranca.status
              }
            )
            console.log(`✅ Lembrete diário adicionado à fila para: ${cobranca.clienteId}`)
          } catch (error) {
            console.error(`❌ Erro ao adicionar lembrete diário para ${cobranca.clienteId}:`, error)
          }
        }

        // Atualizar data do último envio
        this.ultimoEnvioDiario = new Date().toISOString()
        console.log("✅ Lembretes diários enviados com sucesso")
      }

      // Buscar cobranças que precisam de alerta de atraso (primeira notificação)
      const cobrancasAtrasadas = await db.collection("cobrancas").find({
        $or: [
          // Cobranças pendentes que estão atrasadas
          {
            status: { $in: ["pending", "pendente"] },
            vencimento: { $lt: hojeStr }
          },
          // Cobranças já marcadas como atrasadas mas que não receberam alerta
          {
            status: "overdue",
            alertaAtrasadoEnviado: { $ne: true }
          }
        ]
      }).toArray()

      // Log da query de cobranças atrasadas para debug
      console.log("🔍 Query de cobranças atrasadas:", {
        status: { $in: ["pending", "pendente"] },
        vencimento: { $lt: hojeStr },
        alertaAtrasadoEnviado: { $ne: true }
      })

      console.log(`🚨 Encontradas ${cobrancasAtrasadas.length} cobranças em atraso`)
      
      // Verificar todas as cobranças para debug
      const todasCobrancas = await db.collection("cobrancas").find({}).toArray()
      console.log("📊 Resumo de todas as cobranças:", todasCobrancas.map(c => ({
        id: c._id,
        status: c.status,
        vencimento: c.vencimento,
        alertaEnviado: c.alertaAtrasadoEnviado || false
      })))

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
            { 
              $set: { 
                status: "overdue", 
                alertaAtrasadoEnviado: true,
                atualizadoEm: new Date()
              } 
            }
          )
          
          console.log(`📢 Cobrança ${cobranca._id} marcada como atrasada e alerta enviado`)
          
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
