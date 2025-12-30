import { getDb } from "@/lib/mongodb"
import type { NextApiRequest, NextApiResponse } from "next"
import { ObjectId } from "mongodb"

export const runtime = 'nodejs'

/**
 * API para CANCELAR um atendimento
 * POST /api/atendimentos/cancelar
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

    if (atendimento.status === "finalizado") {
      return res.status(400).json({ 
        error: "Não é possível cancelar um atendimento finalizado." 
      })
    }

    if (atendimento.status === "cancelado") {
      return res.status(400).json({ 
        error: "Atendimento já está cancelado." 
      })
    }

    await db.collection("atendimentos_tempo").updateOne(
      { _id: new ObjectId(atendimentoId) },
      { 
        $set: { 
          status: "cancelado",
          updatedAt: new Date()
        } 
      }
    )

    console.log(`❌ Atendimento cancelado: ${atendimentoId}`)

    return res.status(200).json({ 
      success: true, 
      message: "Atendimento cancelado com sucesso.",
      status: "cancelado"
    })

  } catch (error) {
    console.error("❌ Erro ao cancelar atendimento:", error)
    return res.status(500).json({ 
      error: "Erro ao cancelar atendimento.", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
