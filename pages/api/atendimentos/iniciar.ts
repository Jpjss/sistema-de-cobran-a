import { getDb } from "@/lib/mongodb"
import type { NextApiRequest, NextApiResponse } from "next"
import { ObjectId } from "mongodb"

export const runtime = 'nodejs'

/**
 * API para INICIAR um novo atendimento
 * POST /api/atendimentos/iniciar
 * 
 * Body: {
 *   customerId: string,
 *   analistaId: string,
 *   descricao?: string
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { customerId, analistaId, descricao } = req.body

    // Validações
    if (!customerId || !analistaId) {
      return res.status(400).json({ 
        error: "customerId e analistaId são obrigatórios." 
      })
    }

    const db = await getDb()

    // Buscar valor/hora do analista
    const analista = await db.collection("users").findOne({ 
      _id: new ObjectId(analistaId) 
    })

    if (!analista) {
      return res.status(404).json({ error: "Analista não encontrado." })
    }

    if (!analista.ativo) {
      return res.status(400).json({ error: "Analista inativo." })
    }

    // Verificar se o cliente existe
    const cliente = await db.collection("clientes").findOne({ 
      _id: new ObjectId(customerId) 
    })

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado." })
    }

    // Verificar se já existe um atendimento em andamento para este analista
    const atendimentoEmAndamento = await db.collection("atendimentos_tempo").findOne({
      analistaId: new ObjectId(analistaId),
      status: { $in: ["em_andamento", "pausado"] }
    })

    if (atendimentoEmAndamento) {
      return res.status(400).json({ 
        error: "Você já possui um atendimento em andamento. Finalize-o antes de iniciar outro.",
        atendimentoId: atendimentoEmAndamento._id
      })
    }

    // Criar novo atendimento
    const novoAtendimento = {
      customerId: new ObjectId(customerId),
      analistaId: new ObjectId(analistaId),
      inicio: new Date(),
      fim: null,
      tempoMinutos: null,
      valorHora: analista.valorHora || 100.0,
      valorTotal: null,
      status: "em_andamento",
      descricao: descricao || "",
      cobrancaId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("atendimentos_tempo").insertOne(novoAtendimento)

    console.log(`✅ Atendimento iniciado: ${result.insertedId} - Analista: ${analista.name} - Cliente: ${cliente.name}`)

    return res.status(201).json({ 
      success: true, 
      atendimentoId: result.insertedId,
      atendimento: {
        ...novoAtendimento,
        _id: result.insertedId
      }
    })

  } catch (error) {
    console.error("❌ Erro ao iniciar atendimento:", error)
    return res.status(500).json({ 
      error: "Erro ao iniciar atendimento.", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
