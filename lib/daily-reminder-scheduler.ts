import { emailQueue } from './email-queue'
import { prisma } from './prisma'

class DailyReminderScheduler {
  private isRunning: boolean
  private checkInterval: number
  private checkIntervalId: NodeJS.Timeout | null
  private lastRunDate: Date | null

  constructor() {
    this.isRunning = false
    this.checkInterval = 4 * 60 * 60 * 1000 // 4 horas
    this.checkIntervalId = null
    this.lastRunDate = null
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️ Agendador de lembretes diários já está em execução")
      return
    }

    console.log("🚀 Iniciando agendador de lembretes diários...")
    this.isRunning = true
    this.checkPendingBillings()
    
    this.checkIntervalId = setInterval(() => {
      this.checkPendingBillings()
    }, this.checkInterval)
  }

  stop() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
    this.isRunning = false
    console.log("⏹️ Agendador de lembretes diários parado")
  }

  private shouldRunToday(): boolean {
    if (!this.lastRunDate) return true

    const now = new Date()
    const last = new Date(this.lastRunDate)
    
    // Verificar se já rodou hoje
    return (
      now.getDate() !== last.getDate() ||
      now.getMonth() !== last.getMonth() ||
      now.getFullYear() !== last.getFullYear()
    )
  }

  private async checkPendingBillings() {
    // Verificar se já rodou hoje
    if (!this.shouldRunToday()) {
      console.log("⏳ Verificação já realizada hoje, aguardando próximo dia...")
      return
    }

    try {
      console.log("🔍 Verificando cobranças pendentes para lembretes diários...")
      
      // Buscar todas as cobranças pendentes que não receberam lembrete hoje
      const pendingBillings = await prisma.billing.findMany({
        where: {
          status: "pending",
          OR: [
            { lastReminderDate: null },
            {
              lastReminderDate: {
                lt: new Date(new Date().setHours(0, 0, 0, 0)) // Início do dia atual
              }
            }
          ]
        },
        include: {
          customer: true
        }
      })

      console.log(`📊 Encontradas ${pendingBillings.length} cobranças pendentes para envio de lembrete`)

      // Enviar lembretes diários
      for (const billing of pendingBillings) {
        try {
          console.log(`📧 Enviando lembrete para cobrança ${billing.id} - Cliente: ${billing.customer.name}`)
          
          // Adiciona o job na fila de e-mails
          await emailQueue.addDailyReminderJob(
            billing.customer.email,
            billing.customer.name,
            {
              description: billing.description,
              amount: billing.amount,
              dueDate: billing.dueDate,
            }
          )

          // Atualiza a data do último lembrete
          await prisma.billing.update({
            where: { id: billing.id },
            data: {
              lastReminderDate: new Date(),
              reminderSent: true
            }
          })

          console.log(`✅ Lembrete enviado com sucesso para cobrança ${billing.id}`)
        } catch (error) {
          console.error(`❌ Erro ao enviar lembrete para cobrança ${billing.id}:`, error)
        }
      }

      // Atualizar data da última execução
      this.lastRunDate = new Date()
      console.log("✅ Verificação de lembretes diários concluída")

    } catch (error) {
      console.error("❌ Erro ao verificar cobranças pendentes:", error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastRunDate: this.lastRunDate
    }
  }
}

// Instância global do agendador
export const dailyReminderScheduler = new DailyReminderScheduler()
