import { emailScheduler } from "@/lib/email-scheduler"
import { emailQueue } from "@/lib/email-queue"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { action } = req.body

      switch (action) {
        case 'start':
          console.log("🚀 Iniciando sistema de e-mails automáticos...")
          emailQueue.start()
          emailScheduler.start()
          return res.status(200).json({ 
            success: true, 
            message: "Sistema de e-mails automáticos iniciado!" 
          })

        case 'stop':
          console.log("⏹️ Parando sistema de e-mails automáticos...")
          emailQueue.stop()
          emailScheduler.stop()
          return res.status(200).json({ 
            success: true, 
            message: "Sistema de e-mails automáticos parado!" 
          })

        case 'status':
          const queueStatus = emailQueue.getStatus()
          return res.status(200).json({
            success: true,
            scheduler: {
              running: true // Assumindo que está rodando
            },
            queue: queueStatus
          })

        case 'run_check':
          console.log("🔧 Executando verificação manual...")
          await emailScheduler.runNow()
          return res.status(200).json({ 
            success: true, 
            message: "Verificação manual executada!" 
          })

        case 'clear_queue':
          emailQueue.clearQueue()
          return res.status(200).json({ 
            success: true, 
            message: "Fila de e-mails limpa!" 
          })

        default:
          return res.status(400).json({ 
            error: "Ação inválida. Use: start, stop, status, run_check, clear_queue" 
          })
      }
    } catch (error) {
      console.error("❌ Erro no controle de e-mails:", error)
      return res.status(500).json({ 
        error: "Erro interno do servidor", 
        details: error instanceof Error ? error.message : "Erro desconhecido"
      })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
