import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb()
    
    // Atualizar data da cobrança mais recente
    const result = await db.collection("cobrancas").updateOne(
      { _id: new ObjectId("6873e81cf2981f1f6b2f7bed") },
      { 
        $set: { 
          criadoEm: new Date("2025-07-13T03:00:00.000Z") // Ajustado para horário de Brasília (UTC-3)
        }
      }
    )
    
    return res.json({
      success: true,
      message: "Data da cobrança atualizada",
      modified: result.modifiedCount
    })
    
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Erro" })
  }
}
