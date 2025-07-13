import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("🔧 DEBUG: Verificação manual iniciada")
    console.log("📅 Data atual:", new Date().toISOString())
    console.log("📅 Data atual formatada:", new Date().toISOString().split('T')[0])
    
    // Simular verificação de cobrança atrasada
    const hoje = new Date().toISOString().split('T')[0] // 2025-07-12
    const vencimento = "2025-07-10"
    
    console.log("🔍 Verificando:")
    console.log("   - Hoje:", hoje)
    console.log("   - Vencimento:", vencimento)
    console.log("   - Está atrasada?", vencimento < hoje)
    
    if (vencimento < hoje) {
      console.log("🚨 COBRANÇA ATRASADA DETECTADA!")
      console.log("   - Dias de atraso:", Math.floor((new Date(hoje).getTime() - new Date(vencimento).getTime()) / (1000 * 60 * 60 * 24)))
    }
    
    return res.json({
      success: true,
      hoje,
      vencimento,
      atrasada: vencimento < hoje,
      diasAtraso: Math.floor((new Date(hoje).getTime() - new Date(vencimento).getTime()) / (1000 * 60 * 60 * 24))
    })
    
  } catch (error) {
    console.error("❌ Erro no debug:", error)
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro" })
  }
}
