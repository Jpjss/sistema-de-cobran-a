import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "@/lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    const { action } = req.body

    const db = await getDb()

    if (action === "mark-all-sent") {
      // Marcar todas as cobranças como já enviadas para parar spam
      const updateResult = await db.collection("cobrancas").updateMany(
        {}, // Todas as cobranças
        {
          $set: {
            lembreteEnviado: true,
            alertaAtrasadoEnviado: true,
            lastEmailCheck: new Date()
          }
        }
      )

      return res.json({
        success: true,
        message: `${updateResult.modifiedCount} cobranças marcadas como já enviadas`,
        details: "Não enviarão mais e-mails automáticos"
      })
    }

    if (action === "delete-test-cobrancas") {
      // Deletar cobranças de teste
      const deleteResult = await db.collection("cobrancas").deleteMany({
        $or: [
          { descricao: { $regex: /teste/i } },
          { descricao: { $regex: /Cobrança de Teste/i } },
          { descricao: { $regex: /Cobrança Atrasada - Teste/i } },
          { descricao: { $regex: /Teste direto da fila/i } }
        ]
      })

      return res.json({
        success: true,
        message: `${deleteResult.deletedCount} cobranças de teste deletadas`,
        details: "Cobranças de teste removidas do banco"
      })
    }

    if (action === "list-cobrancas") {
      // Listar todas as cobranças para verificar
      const cobrancas = await db.collection("cobrancas").find({}).toArray()
      
      return res.json({
        success: true,
        total: cobrancas.length,
        cobrancas: cobrancas.map(c => ({
          _id: c._id,
          clienteId: c.clienteId,
          descricao: c.descricao,
          valor: c.valor,
          vencimento: c.vencimento,
          status: c.status,
          lembreteEnviado: c.lembreteEnviado || false,
          alertaAtrasadoEnviado: c.alertaAtrasadoEnviado || false
        }))
      })
    }

    return res.status(400).json({ message: "Ação não reconhecida" })

  } catch (error) {
    console.error("❌ Erro na limpeza:", error)
    return res.status(500).json({ 
      message: "Erro interno", 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
