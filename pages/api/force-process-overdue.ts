import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "@/lib/mongodb"
import { emailQueue } from "@/lib/email-queue"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    console.log("🔧 FORÇANDO processamento da cobrança específica...")
    
    const db = await getDb()
    const hoje = new Date().toISOString().split('T')[0]
    
    console.log("📅 Data de hoje:", hoje)
    
    // Buscar especificamente a cobrança do usuário que está atrasada
    const cobrancaAtrasada = await db.collection("cobrancas").findOne({
      _id: require('mongodb').ObjectId.createFromHexString("6872e797c5229ac8db690991"),
      status: "pending"
    })
    
    if (!cobrancaAtrasada) {
      return res.json({
        success: false,
        message: "Cobrança não encontrada ou já processada"
      })
    }
    
    console.log("🚨 Cobrança encontrada:", cobrancaAtrasada)
    console.log("📧 Cliente ID:", cobrancaAtrasada.clienteId)
    console.log("📅 Vencimento:", cobrancaAtrasada.vencimento)
    console.log("📅 Está atrasada?", cobrancaAtrasada.vencimento < hoje)
    
    if (cobrancaAtrasada.vencimento < hoje) {
      console.log("🚨 PROCESSANDO COBRANÇA ATRASADA MANUALMENTE...")
      
      // Adicionar à fila
      await emailQueue.addJob({
        type: "overdue",
        email: cobrancaAtrasada.clienteId,
        customerName: "Cliente",
        data: {
          description: cobrancaAtrasada.descricao,
          amount: cobrancaAtrasada.valor,
          dueDate: cobrancaAtrasada.vencimento
        },
        maxAttempts: 3
      })
      
      console.log("✅ Adicionado à fila!")
      
      // Atualizar no banco
      await db.collection("cobrancas").updateOne(
        { _id: cobrancaAtrasada._id },
        { 
          $set: { 
            status: "overdue", 
            alertaAtrasadoEnviado: true,
            processedAt: new Date()
          } 
        }
      )
      
      console.log("✅ Status atualizado no banco!")
      
      return res.json({
        success: true,
        message: "Cobrança processada manualmente! E-mail enviado.",
        details: {
          cobrancaId: cobrancaAtrasada._id,
          email: cobrancaAtrasada.clienteId,
          vencimento: cobrancaAtrasada.vencimento,
          diasAtraso: Math.floor((new Date(hoje).getTime() - new Date(cobrancaAtrasada.vencimento).getTime()) / (1000 * 60 * 60 * 24))
        }
      })
    } else {
      return res.json({
        success: false,
        message: "Cobrança não está atrasada",
        vencimento: cobrancaAtrasada.vencimento,
        hoje
      })
    }
    
  } catch (error) {
    console.error("❌ Erro no processamento manual:", error)
    return res.status(500).json({ 
      message: "Erro interno", 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
