import { EmailService, getEmailConfig } from "@/lib/email-service"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" })
    }

    console.log("🧪 Testando envio para:", email)

    const emailService = new EmailService(getEmailConfig("gmail"))
    
    // Verificar conexão SMTP primeiro
    const connectionOk = await emailService.verifyConnection()
    console.log("🔌 Conexão SMTP:", connectionOk ? "OK" : "FALHOU")
    
    if (!connectionOk) {
      return res.status(500).json({ 
        success: false, 
        error: "Falha na conexão SMTP",
        details: "Verifique as configurações de e-mail no arquivo .env"
      })
    }

    // Enviar e-mail de teste
    const result = await emailService.sendTestEmail(email)
    console.log("📧 Resultado do teste:", result)

    if (result) {
      return res.status(200).json({ 
        success: true, 
        message: "E-mail de teste enviado com sucesso!",
        sentTo: email
      })
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "Falha ao enviar e-mail de teste" 
      })
    }
  } catch (error) {
    console.error("❌ Erro no teste de e-mail:", error)
    return res.status(500).json({ 
      success: false, 
      error: "Erro interno do servidor", 
      details: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
