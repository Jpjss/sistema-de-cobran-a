import { getDb } from "@/lib/mongodb"
import { formatDate, formatDateTime } from "@/lib/date-utils"
import type { NextApiRequest, NextApiResponse } from "next"
import { ObjectId } from "mongodb"

export const runtime = 'nodejs'

/**
 * API para FINALIZAR um atendimento e criar cobrança automaticamente
 * POST /api/atendimentos/finalizar
 * 
 * Body: {
 *   atendimentoId: string,
 *   diasParaVencimento?: number (padrão: 7)
 * }
 * 
 * PROCESSO:
 * 1. Calcula tempo total
 * 2. Calcula valor total
 * 3. Atualiza atendimento
 * 4. Cria cobrança automaticamente
 * 5. Vincula cobrança ao atendimento
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { atendimentoId, diasParaVencimento = 7 } = req.body

    // Validações
    if (!atendimentoId) {
      return res.status(400).json({ 
        error: "atendimentoId é obrigatório." 
      })
    }

    const db = await getDb()

    // Buscar atendimento
    const atendimento = await db.collection("atendimentos_tempo").findOne({ 
      _id: new ObjectId(atendimentoId) 
    })

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado." })
    }

    if (atendimento.status === "finalizado") {
      return res.status(400).json({ 
        error: "Atendimento já foi finalizado.",
        cobrancaId: atendimento.cobrancaId
      })
    }

    if (atendimento.status === "cancelado") {
      return res.status(400).json({ error: "Atendimento foi cancelado." })
    }

    // Buscar dados do analista e cliente
    const analista = await db.collection("users").findOne({ 
      _id: new ObjectId(atendimento.analistaId) 
    })

    const cliente = await db.collection("clientes").findOne({ 
      _id: new ObjectId(atendimento.customerId) 
    })

    if (!analista || !cliente) {
      return res.status(404).json({ error: "Analista ou cliente não encontrado." })
    }

    // 1️⃣ CALCULAR TEMPO TOTAL
    const dataInicio = new Date(atendimento.inicio)
    const dataFim = new Date()
    const diferencaMs = dataFim.getTime() - dataInicio.getTime()
    const tempoMinutos = Math.ceil(diferencaMs / (1000 * 60)) // arredonda para cima

    // 2️⃣ CALCULAR VALOR TOTAL
    const valorPorMinuto = atendimento.valorHora / 60
    const valorTotal = (tempoMinutos * valorPorMinuto)

    // Formatar tempo para exibição
    const horas = Math.floor(tempoMinutos / 60)
    const minutos = tempoMinutos % 60
    const tempoFormatado = `${horas}h${minutos.toString().padStart(2, '0')}min`

    // 3️⃣ CRIAR COBRANÇA AUTOMATICAMENTE
    const dataVencimento = new Date()
    dataVencimento.setDate(dataVencimento.getDate() + diasParaVencimento)

    const descricaoCobranca = `Atendimento técnico – ${analista.name} – ${formatDate(dataFim)}
Tempo: ${tempoFormatado}
Cliente: ${cliente.name}`

    const novaCobranca = {
      customerId: new ObjectId(atendimento.customerId),
      description: descricaoCobranca,
      amount: valorTotal,
      dueDate: dataVencimento,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: null,
      reminderSent: false,
      lastReminderDate: null,
      overdueSent: false,
      lastOverdueDate: null,
      origem: "ATENDIMENTO_TEMPO",
      referenciaId: new ObjectId(atendimentoId)
    }

    const resultCobranca = await db.collection("billings").insertOne(novaCobranca)

    console.log(`💰 Cobrança criada automaticamente: ${resultCobranca.insertedId}`)

    // 4️⃣ ATUALIZAR ATENDIMENTO
    const atendimentoAtualizado = {
      fim: dataFim,
      tempoMinutos: tempoMinutos,
      valorTotal: valorTotal,
      status: "finalizado",
      cobrancaId: resultCobranca.insertedId,
      updatedAt: new Date()
    }

    await db.collection("atendimentos_tempo").updateOne(
      { _id: new ObjectId(atendimentoId) },
      { $set: atendimentoAtualizado }
    )

    console.log(`✅ Atendimento finalizado: ${atendimentoId}`)
    console.log(`⏱️  Tempo: ${tempoFormatado} (${tempoMinutos} minutos)`)
    console.log(`💵 Valor: R$ ${valorTotal.toFixed(2)}`)

    // 5️⃣ PROCESSAR EVENTO DE COBRANÇA (dispara e-mail automático)
    const cobrancaCriada = { 
      ...novaCobranca, 
      _id: resultCobranca.insertedId,
      clienteId: cliente.email // compatibilidade com sistema de e-mail
    }

    // Aqui o sistema de e-mail automático do seu sistema será acionado
    // através do webhook/evento que já existe no sistema

    return res.status(200).json({ 
      success: true, 
      atendimento: {
        _id: atendimentoId,
        tempoMinutos,
        tempoFormatado,
        valorTotal,
        status: "finalizado"
      },
      cobranca: {
        _id: resultCobranca.insertedId,
        description: descricaoCobranca,
        amount: valorTotal,
        dueDate: dataVencimento,
        status: "pending"
      },
      message: `Atendimento finalizado com sucesso! Cobrança de R$ ${valorTotal.toFixed(2)} criada automaticamente.`
    })

  } catch (error) {
    console.error("❌ Erro ao finalizar atendimento:", error)
    return res.status(500).json({ 
      error: "Erro ao finalizar atendimento.", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
