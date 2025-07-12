import { EmailService, getEmailConfig } from "@/lib/email-service"

export default async function handler(req, res) {
  // Obter provedor da query string (?provider=gmail ou ?provider=outlook)
  const provider = (req.query.provider === "outlook") ? "outlook" : "gmail"
  const emailService = new EmailService(getEmailConfig(provider))

  // Dados do cliente fictício
  const customerName = "JOAO PEDRO PEREIRA SILVA"
  const customerEmail = "jp0886230@gmail.com"
  const billing = {
    description: `Teste de cobrança automática (${provider})`,
    amount: 123.45,
    dueDate: new Date().toISOString(),
  }

  // Dispara o e-mail de lembrete de vencimento
  const result = await emailService.sendDueReminder(customerEmail, customerName, billing)

  res.status(200).json({ success: result, provider })
}
