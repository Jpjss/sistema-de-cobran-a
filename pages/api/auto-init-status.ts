import type { NextApiRequest, NextApiResponse } from "next"
import { getServicesStatus, initializeAutomatedServices } from "@/lib/auto-init"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Verificar status
      const status = getServicesStatus()
      
      return res.json({
        autoInitialized: status.initialized,
        timestamp: status.timestamp,
        serverTime: new Date().toISOString(),
        message: status.initialized ? "Serviços auto-iniciados" : "Serviços NÃO iniciados"
      })
    }
    
    if (req.method === "POST") {
      // Forçar inicialização
      console.log("🔧 Forçando inicialização via API...")
      const result = initializeAutomatedServices()
      
      return res.json({
        success: result,
        message: result ? "Serviços iniciados com sucesso" : "Falha na inicialização",
        timestamp: new Date().toISOString()
      })
    }
    
    return res.status(405).json({ message: "Método não permitido" })
    
  } catch (error) {
    console.error("❌ Erro no endpoint de auto-init:", error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
