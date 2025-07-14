import nodemailer from "nodemailer"

export interface EmailTemplate {
  subject: string
  body: string
  variables: Record<string, string>
}

export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  fromName: string
}

export class EmailService {
  private config: EmailConfig
  private transporter: nodemailer.Transporter

  constructor(config: EmailConfig) {
    this.config = config

    // Configurar transporter do Nodemailer
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure, // true para 465, false para outras portas
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    })
  }

  // Verificar conexão SMTP
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log("✅ Conexão SMTP verificada com sucesso")
      return true
    } catch (error) {
      console.error("❌ Erro na conexão SMTP:", error)
      return false
    }
  }

  // Substituir variáveis no template
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      result = result.replace(regex, value)
    })
    return result
  }

  // Enviar e-mail real usando Nodemailer
  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // Substituir variáveis no assunto e corpo
      const subject = this.replaceVariables(template.subject, template.variables)
      const body = this.replaceVariables(template.body, template.variables)

      // Configurar opções do e-mail
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: to,
        subject: subject,
        text: body, // Versão texto
        html: body.replace(/\n/g, "<br>"), // Versão HTML simples
      }

      // Enviar e-mail
      const info = await this.transporter.sendMail(mailOptions)

      console.log("📧 E-mail enviado com sucesso:", {
        messageId: info.messageId,
        to: to,
        subject: subject,
      })

      return true
    } catch (error) {
      console.error("❌ Erro ao enviar e-mail:", error)
      return false
    }
  }

  // Enviar lembrete de vencimento
  async sendDueReminder(customerEmail: string, customerName: string, billing: any): Promise<boolean> {
    console.log("📧 Iniciando envio de lembrete de vencimento para:", {
      email: customerEmail,
      nome: customerName,
      cobranca: billing
    })

    const template: EmailTemplate = {
      subject: "🔔 Lembrete: Cobrança vence em breve",
      body: `Olá {{customerName}},

Esperamos que esteja bem! Este é um lembrete amigável de que sua cobrança vencerá em breve.

📋 Detalhes da cobrança:
• Descrição: {{description}}
• Valor: {{amount}}
• Data de vencimento: {{dueDate}}

💡 Para evitar atrasos, por favor efetue o pagamento até a data de vencimento.

Se você já efetuou o pagamento, pode desconsiderar este e-mail.

Atenciosamente,
Equipe de Cobrança

---
Este é um e-mail automático. Em caso de dúvidas, entre em contato conosco.`,
      variables: {
        customerName,
        description: billing.description,
        amount: billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        dueDate: billing.dueDate.includes('T') ? new Date(billing.dueDate).toLocaleDateString("pt-BR") : billing.dueDate.split('-').reverse().join('/'),
      },
    }

    console.log("📝 Template preparado:", {
      subject: template.subject,
      variables: template.variables
    })

    const result = await this.sendEmail(customerEmail, template)
    console.log("📬 Resultado do envio:", result)
    
    return result
  }

  // Enviar aviso de atraso
  async sendOverdueAlert(customerEmail: string, customerName: string, billing: any): Promise<boolean> {
    // Calcula dias em atraso sem considerar horário
    const today = new Date().toISOString().split('T')[0]
    const dueDate = billing.dueDate.includes('T') ? billing.dueDate.split('T')[0] : billing.dueDate
    const daysOverdue = Math.ceil((new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24))

    const template: EmailTemplate = {
      subject: "🚨 URGENTE: Cobrança em atraso",
      body: `Olá {{customerName}},

Identificamos que sua cobrança está em atraso. Por favor, regularize sua situação o quanto antes para evitar maiores complicações.

📋 Detalhes da cobrança:
• Descrição: {{description}}
• Valor: {{amount}}
• Data de vencimento: {{dueDate}}
• Dias em atraso: {{daysOverdue}} dias

⚠️ ATENÇÃO: Cobranças em atraso podem gerar juros e multas conforme acordado.

💬 Entre em contato conosco imediatamente se houver alguma dúvida ou dificuldade para efetuar o pagamento.

Atenciosamente,
Equipe de Cobrança

---
Este é um e-mail automático. Responda este e-mail ou entre em contato conosco para esclarecimentos.`,
      variables: {
        customerName,
        description: billing.description,
        amount: billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        dueDate: billing.dueDate.includes('T') ? new Date(billing.dueDate).toLocaleDateString("pt-BR") : billing.dueDate.split('-').reverse().join('/'),
        daysOverdue: daysOverdue.toString(),
      },
    }

    return this.sendEmail(customerEmail, template)
  }

  // Enviar confirmação de pagamento
  async sendPaymentConfirmation(customerEmail: string, customerName: string, billing: any): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "✅ Pagamento confirmado - Obrigado!",
      body: `Olá {{customerName}},

Confirmamos o recebimento do seu pagamento. Muito obrigado!

📋 Detalhes da cobrança:
• Descrição: {{description}}
• Valor: {{amount}}
• Data do pagamento: {{paymentDate}}

✅ Sua conta está em dia. Agradecemos pela pontualidade e confiança!

Se precisar de algum comprovante adicional ou tiver dúvidas, não hesite em nos contatar.

Atenciosamente,
Equipe Financeira

---
Guarde este e-mail como comprovante do seu pagamento.`,
      variables: {
        customerName,
        description: billing.description,
        amount: billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        paymentDate: new Date().toLocaleDateString("pt-BR"),
      },
    }

    return this.sendEmail(customerEmail, template)
  }

  // Enviar e-mail de teste
  async sendTestEmail(to: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "🧪 Teste do Sistema de Notificações",
      body: `Este é um e-mail de teste do FynApp.

Se você recebeu este e-mail, significa que a configuração SMTP está funcionando corretamente!

✅ Configuração SMTP: OK
✅ Envio de e-mails: OK
✅ Sistema de notificações: Ativo

Data/Hora do teste: {{testDate}}

Atenciosamente,
FynApp`,
      variables: {
        testDate: new Date().toLocaleString("pt-BR"),
      },
    }

    return this.sendEmail(to, template)
  }

  // Enviar lembrete diário
  async sendDailyReminder(customerEmail: string, customerName: string, billing: any): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "📢 Lembrete de Cobrança Pendente",
      body: `Olá {{customerName}},

Esta é uma notificação diária sobre sua cobrança pendente.

📋 Detalhes da cobrança:
• Descrição: {{description}}
• Valor: {{amount}}
• Data de vencimento: {{dueDate}}
{{overdueWarning}}

Por favor, entre em contato conosco caso precise de algum esclarecimento ou tenha dificuldade para efetuar o pagamento.

Atenciosamente,
Equipe de Cobrança

---
Este é um e-mail automático. Você receberá este lembrete diariamente até que a cobrança seja paga.`,
      variables: {
        customerName,
        description: billing.description,
        amount: billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        dueDate: billing.dueDate.includes('T') ? new Date(billing.dueDate).toLocaleDateString("pt-BR") : billing.dueDate.split('-').reverse().join('/'),
        overdueWarning: new Date(billing.dueDate) < new Date() ? "\n⚠️ ATENÇÃO: Esta cobrança está em atraso!" : "",
      },
    }

    return this.sendEmail(customerEmail, template)
  }
}


// Função para obter configuração de provedor
export function getEmailConfig(provider: "gmail" | "outlook"): EmailConfig {
  if (provider === "gmail") {
    return {
      smtpHost: process.env.GMAIL_SMTP_HOST || "",
      smtpPort: Number(process.env.GMAIL_SMTP_PORT || 587),
      smtpSecure: process.env.GMAIL_SMTP_SECURE === "true",
      smtpUser: process.env.GMAIL_SMTP_USER || "",
      smtpPassword: process.env.GMAIL_SMTP_PASSWORD || "",
      fromEmail: process.env.GMAIL_FROM_EMAIL || "",
      fromName: process.env.GMAIL_FROM_NAME || "FynApp",
    }
  }
  if (provider === "outlook") {
    return {
      smtpHost: process.env.OUTLOOK_SMTP_HOST || "",
      smtpPort: Number(process.env.OUTLOOK_SMTP_PORT || 587),
      smtpSecure: process.env.OUTLOOK_SMTP_SECURE === "true",
      smtpUser: process.env.OUTLOOK_SMTP_USER || "",
      smtpPassword: process.env.OUTLOOK_SMTP_PASSWORD || "",
      fromEmail: process.env.OUTLOOK_FROM_EMAIL || "",
      fromName: process.env.OUTLOOK_FROM_NAME || "FynApp",
    }
  }
  throw new Error("Provedor não suportado")
}

// Instância padrão (Gmail)
export const emailService = new EmailService(getEmailConfig("gmail"));
