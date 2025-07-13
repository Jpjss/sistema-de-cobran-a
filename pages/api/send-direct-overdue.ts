import type { NextApiRequest, NextApiResponse } from "next"
import { EmailService, getEmailConfig } from "@/lib/email-service"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    console.log("🚨 ENVIANDO E-MAIL DIRETO - SEM FILA!")
    
    const emailConfig = getEmailConfig("gmail")
    const emailService = new EmailService(emailConfig)
    
    console.log("⚙️ Config SMTP:", {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      user: emailConfig.smtpUser
    })
    
    // Verificar conexão
    const connectionOk = await emailService.verifyConnection()
    console.log("🔌 Conexão SMTP:", connectionOk ? "OK" : "FALHOU")
    
    if (!connectionOk) {
      return res.json({
        success: false,
        message: "Falha na conexão SMTP",
        suggestion: "Verifique credenciais Gmail"
      })
    }
    
    // Enviar e-mail de alerta direto
    console.log("📧 Enviando alerta de atraso...")
    
    const result = await emailService.sendOverdueAlert(
      "jp0886230@gmail.com",
      "João Paulo",
      {
        description: "projeto de automação desenvolvido",
        amount: 5000,
        dueDate: "2025-07-10"
      }
    )
    
    console.log("📊 Resultado:", result)
    
    return res.json({
      success: result,
      message: result ? "E-mail enviado com sucesso!" : "Falha no envio",
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("❌ Erro no envio direto:", error)
    return res.status(500).json({ 
      message: "Erro interno", 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
