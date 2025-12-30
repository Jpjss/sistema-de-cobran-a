import { getDb } from "@/lib/mongodb"
import type { NextApiRequest, NextApiResponse } from "next"
import { ObjectId } from "mongodb"

export const runtime = 'nodejs'

/**
 * API para RETOMAR um atendimento pausado
 * POST /api/atendimentos/retomar
 * 
 * Body: {
 *   atendimentoId: string
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { atendimentoId } = req.body

    if (!atendimentoId) {
      return res.status(400).json({ error: "atendimentoId é obrigatório." })
    }

    const db = await getDb()

    const atendimento = await db.collection("atendimentos_tempo").findOne({ 
      _id: new ObjectId(atendimentoId) 
    })

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado." })
    }

    if (atendimento.status !== "pausado") {
      return res.status(400).json({ 
        error: `Não é possível retomar. Status atual: ${atendimento.status}` 
      })
    }

    await db.collection("atendimentos_tempo").updateOne(
      { _id: new ObjectId(atendimentoId) },
      { 
        $set: { 
          status: "em_andamento",
          updatedAt: new Date()
        } 
      }
    )

    console.log(`▶️  Atendimento retomado: ${atendimentoId}`)

    return res.status(200).json({ 
      success: true, 
      message: "Atendimento retomado com sucesso.",
      status: "em_andamento"
    })

  } catch (error) {
    console.error("❌ Erro ao retomar atendimento:", error)
    return res.status(500).json({ 
      error: "Erro ao retomar atendimento.", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
