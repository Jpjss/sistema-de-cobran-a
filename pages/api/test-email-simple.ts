import type { NextApiRequest, NextApiResponse } from "next"
import { EmailService, getEmailConfig } from "@/lib/email-service"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "E-mail é obrigatório" })
    }

    console.log("🔧 Iniciando teste de e-mail...")
    console.log("📧 E-mail destino:", email)

    // Verificar configuração SMTP
    const emailConfig = getEmailConfig("gmail")
    console.log("⚙️ Configuração SMTP:", {
      host: emailConfig.host,
      port: emailConfig.port,
      user: emailConfig.auth.user,
      hasPassword: !!emailConfig.auth.pass
    })

    // Criar serviço de e-mail
    const emailService = new EmailService(emailConfig)
    console.log("✅ Serviço de e-mail criado")

    // Tentar enviar e-mail de teste
    console.log("📤 Enviando e-mail de teste...")
    
    const result = await emailService.sendTestEmail(email)

    console.log("📊 Resultado do envio:", result)

    if (result) {
      return res.json({
        success: true,
        message: "E-mail de teste enviado com sucesso!",
        details: "Verifique sua caixa de entrada e spam"
      })
    } else {
      return res.json({
        success: false,
        message: "Falha ao enviar e-mail",
        details: "Verifique os logs do servidor para mais informações"
      })
    }

  } catch (error) {
    console.error("❌ Erro no teste de e-mail:", error)
    
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido",
      details: "Verifique os logs do servidor"
    })
  }
}
