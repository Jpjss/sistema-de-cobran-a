import { EmailService, getEmailConfig } from "@/lib/email-service"

export default async function handler(req, res) {
  // Provedor pode ser passado na query string (?provider=gmail ou ?provider=outlook)
  const provider = (req.query.provider === "outlook") ? "outlook" : "gmail";
  const emailService = new EmailService(getEmailConfig(provider));

  // Dados fixos do cliente para teste
  const customerEmail = 'gustavog.moraes@outlook.com';
  const customerName = 'Gustavo Moraes';
  const billing = {
    description: `Cobrança automática (${provider})`,
    amount: 199.99,
    dueDate: new Date().toISOString(),
  };

  // Dispara o e-mail de lembrete de vencimento e captura erro detalhado
  let success = false;
  let errorMsg = null;
  try {
    success = await emailService.sendDueReminder(customerEmail, customerName, billing);
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  // Tenta capturar erro do último envio do Nodemailer (caso sendDueReminder retorne false)
  if (!success && !errorMsg) {
    errorMsg = 'Falha desconhecida ao enviar e-mail. Veja o terminal para detalhes.';
  }

  res.status(200).json({ success, provider, to: customerEmail, error: errorMsg });
}

