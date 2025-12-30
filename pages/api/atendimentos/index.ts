import { getDb } from "@/lib/mongodb"
import type { NextApiRequest, NextApiResponse } from "next"
import { ObjectId } from "mongodb"

export const runtime = 'nodejs'

/**
 * API para LISTAR atendimentos
 * GET /api/atendimentos
 * 
 * Query params:
 * - analistaId?: string (filtrar por analista)
 * - customerId?: string (filtrar por cliente)
 * - status?: string (filtrar por status)
 * - limit?: number (limite de resultados, padrão: 50)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { analistaId, customerId, status, limit = "50" } = req.query

    const db = await getDb()

    // Construir filtro
    const filtro: any = {}

    if (analistaId && typeof analistaId === 'string') {
      filtro.analistaId = new ObjectId(analistaId)
    }

    if (customerId && typeof customerId === 'string') {
      filtro.customerId = new ObjectId(customerId)
    }

    if (status && typeof status === 'string') {
      filtro.status = status
    }

    // Buscar atendimentos
    const atendimentos = await db.collection("atendimentos_tempo")
      .find(filtro)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .toArray()

    // Enriquecer com dados do cliente e analista
    const atendimentosEnriquecidos = await Promise.all(
      atendimentos.map(async (atendimento) => {
        const cliente = await db.collection("clientes").findOne({ 
          _id: new ObjectId(atendimento.customerId) 
        })
        
        const analista = await db.collection("users").findOne({ 
          _id: new ObjectId(atendimento.analistaId) 
        })

        let cobranca = null
        if (atendimento.cobrancaId) {
          cobranca = await db.collection("billings").findOne({ 
            _id: new ObjectId(atendimento.cobrancaId) 
          })
        }

        return {
          ...atendimento,
          cliente: cliente ? { 
            _id: cliente._id, 
            name: cliente.name, 
            email: cliente.email 
          } : null,
          analista: analista ? { 
            _id: analista._id, 
            name: analista.name, 
            email: analista.email 
          } : null,
          cobranca: cobranca ? {
            _id: cobranca._id,
            amount: cobranca.amount,
            status: cobranca.status,
            dueDate: cobranca.dueDate
          } : null
        }
      })
    )

    return res.status(200).json({ 
      success: true,
      atendimentos: atendimentosEnriquecidos,
      total: atendimentosEnriquecidos.length
    })

  } catch (error) {
    console.error("❌ Erro ao listar atendimentos:", error)
    return res.status(500).json({ 
      error: "Erro ao listar atendimentos.", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
