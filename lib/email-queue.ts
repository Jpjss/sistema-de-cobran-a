interface EmailJob {
  id: string
  type: 'reminder' | 'overdue' | 'payment_confirmation' | 'test' | 'daily_reminder'
  email: string
  customerName: string
  data: any
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor?: Date
}

export class EmailQueue {
  private queue: EmailJob[] = []
  private processing = false
  private processingInterval: NodeJS.Timeout | null = null
  private lastProcessingDates: Map<string, Date> = new Map()

  constructor() {}

  // Iniciar o processamento da fila
  start() {
    if (this.processing) {
      console.log("📬 Fila de e-mails já está processando")
      return
    }

    console.log("🚀 Iniciando processamento da fila de e-mails...")
    this.processing = true
    
    // Processar a cada 1 hora
    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 60 * 60 * 1000) // 1 hora
    
    // Processar imediatamente
    this.processQueue()
  }

  // Parar o processamento
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.processing = false
    console.log("⏹️ Processamento da fila parado")
  }

  // Adicionar job à fila
  async addJob(job: Omit<EmailJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const emailJob: EmailJob = {
      ...job,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: new Date()
    }

    this.queue.push(emailJob)
    console.log(`📝 Job adicionado à fila: ${emailJob.id} (${emailJob.type})`)
    
    return emailJob.id
  }

  // Adicionar lembrete de vencimento à fila
  async addReminderJob(email: string, customerName: string, billing: any, scheduledFor?: Date) {
    return this.addJob({
      type: 'reminder',
      email,
      customerName,
      data: billing,
      maxAttempts: 3,
      scheduledFor
    })
  }

  // Adicionar alerta de atraso à fila
  async addOverdueJob(email: string, customerName: string, billing: any) {
    return this.addJob({
      type: 'overdue',
      email,
      customerName,
      data: billing,
      maxAttempts: 3
    })
  }

  // Adicionar confirmação de pagamento à fila
  async addPaymentConfirmationJob(email: string, customerName: string, billing: any) {
    return this.addJob({
      type: 'payment_confirmation',
      email,
      customerName,
      data: billing,
      maxAttempts: 2
    })
  }

  // Adicionar lembrete diário à fila
  async addDailyReminderJob(email: string, customerName: string, billing: any) {
    // Verificar se já foi enviado hoje
    if (!this.canSendEmail(email, 'daily_reminder')) {
      console.log(`⏳ Lembrete diário já foi enviado hoje para ${email}`)
      return null
    }

    const jobId = await this.addJob({
      type: 'daily_reminder',
      email,
      customerName, 
      data: billing,
      maxAttempts: 3
    })

    return jobId
  }

  // Processar a fila
  private async processQueue() {
    if (this.queue.length === 0) {
      return
    }

    console.log(`📋 Processando fila: ${this.queue.length} jobs pendentes`)

    const now = new Date()
    const jobsToProcess = this.queue.filter(job => 
      !job.scheduledFor || job.scheduledFor <= now
    )

    for (const job of jobsToProcess) {
      try {
        console.log(`⚡ Processando job: ${job.id} (${job.type})`)
        
        const success = await this.processEmailJob(job)
        
        if (success) {
          console.log(`✅ Job processado com sucesso: ${job.id}`)
          this.removeJobFromQueue(job.id)
        } else {
          job.attempts++
          console.log(`❌ Falha no job ${job.id}. Tentativa ${job.attempts}/${job.maxAttempts}`)
          
          if (job.attempts >= job.maxAttempts) {
            console.log(`💀 Job ${job.id} removido após ${job.maxAttempts} tentativas`)
            this.removeJobFromQueue(job.id)
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar job ${job.id}:`, error)
        job.attempts++
        
        if (job.attempts >= job.maxAttempts) {
          this.removeJobFromQueue(job.id)
        }
      }
    }
  }

  private getEmailKey(email: string, type: string): string {
    return `${email}-${type}`
  }

  private canSendEmail(email: string, type: string): boolean {
    const key = this.getEmailKey(email, type)
    const lastDate = this.lastProcessingDates.get(key)
    
    if (!lastDate) return true

    const now = new Date()
    const hoursSinceLastEmail = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
    
    // Se for um lembrete diário, verificar se já passou 24 horas
    if (type === 'daily_reminder') {
      return hoursSinceLastEmail >= 24
    }
    
    // Para outros tipos de e-mail, permitir envio após 1 hora
    return hoursSinceLastEmail >= 1
  }

  // Processar um job específico
  private async processEmailJob(job: EmailJob): Promise<boolean> {
    // Verificar se pode enviar o e-mail
    if (!this.canSendEmail(job.email, job.type)) {
      console.log(`⏳ Aguardando intervalo mínimo para enviar e-mail para ${job.email}`)
      return false
    }

    const { EmailService, getEmailConfig } = await import("@/lib/email-service")
    const emailService = new EmailService(getEmailConfig("gmail"))

    try {
      let success = false;
      
      switch (job.type) {
        case 'reminder':
          success = await emailService.sendDueReminder(
            job.email,
            job.customerName,
            job.data
          )
          break;
        
        case 'overdue':
          success = await emailService.sendOverdueAlert(
            job.email,
            job.customerName,
            job.data
          )
          break;
        
        case 'payment_confirmation':
          success = await emailService.sendPaymentConfirmation(
            job.email,
            job.customerName,
            job.data
          )
          break;

        case 'daily_reminder':
          success = await emailService.sendDailyReminder(
            job.email,
            job.customerName,
            job.data
          )
          break;
        
        case 'test':
          success = await emailService.sendTestEmail(job.email)
          break;
        
        default:
          console.error(`❌ Tipo de job desconhecido: ${job.type}`)
          return false
      }

      if (success) {
        // Registrar hora do envio
        const key = this.getEmailKey(job.email, job.type)
        this.lastProcessingDates.set(key, new Date())
      }

      return success;
    } catch (error) {
      console.error(`❌ Erro ao enviar e-mail para job ${job.id}:`, error)
      return false
    }
  }

  // Remover job da fila
  private removeJobFromQueue(jobId: string) {
    const index = this.queue.findIndex(job => job.id === jobId)
    if (index > -1) {
      this.queue.splice(index, 1)
    }
  }

  // Obter status da fila
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      jobs: this.queue.map(job => ({
        id: job.id,
        type: job.type,
        email: job.email,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        scheduledFor: job.scheduledFor
      }))
    }
  }

  // Limpar fila
  clearQueue() {
    this.queue = []
    console.log("🗑️ Fila de e-mails limpa")
  }
}

// Instância global da fila
export const emailQueue = new EmailQueue()
