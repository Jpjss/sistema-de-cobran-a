import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "@/lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb()
    
    // Resetar sua cobrança para testar novamente
    const result = await db.collection("cobrancas").updateOne(
      { _id: require('mongodb').ObjectId.createFromHexString("6872e797c5229ac8db690991") },
      { 
        $set: { 
          status: "pending",
          alertaAtrasadoEnviado: false,
          lembreteEnviado: false
        }
      }
    )
    
    return res.json({
      success: true,
      message: "Cobrança resetada para novo teste",
      modified: result.modifiedCount
    })
    
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro" })
  }
}
