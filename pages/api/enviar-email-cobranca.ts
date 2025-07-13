import { EmailService, getEmailConfig } from "@/lib/email-service"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" })
  }

  try {
    const { customerName, customerEmail, description, amount, dueDate, provider } = req.body

    console.log("Dados recebidos para envio de e-mail:", {
      customerName,
      customerEmail,
      description,
      amount,
      dueDate,
      provider
    })

    if (!customerName || !customerEmail || !description || !amount || !dueDate) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" })
    }

    // Usar o provedor especificado ou Gmail como padrão
    const emailProvider = provider || "gmail"
    console.log("Usando provedor de e-mail:", emailProvider)
    
    const emailService = new EmailService(getEmailConfig(emailProvider))

    // Dados da cobrança
    const billing = {
      description,
      amount,
      dueDate,
    }

    console.log("Tentando enviar e-mail para:", customerEmail)

    // Enviar e-mail de cobrança
    const result = await emailService.sendDueReminder(customerEmail, customerName, billing)

    console.log("Resultado do envio de e-mail:", result)

    if (result) {
      return res.status(200).json({ 
        success: true, 
        message: "E-mail de cobrança enviado com sucesso!",
        provider: emailProvider,
        sentTo: customerEmail
      })
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "Falha ao enviar e-mail de cobrança" 
      })
    }
  } catch (error) {
    console.error("Erro detalhado ao enviar e-mail:", error)
    return res.status(500).json({ 
      success: false, 
      error: "Erro interno do servidor", 
      details: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
