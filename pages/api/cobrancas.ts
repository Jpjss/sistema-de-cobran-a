import { getDb } from "@/lib/mongodb";
import { EmailService, getEmailConfig } from "@/lib/email-service"
import type { NextApiRequest, NextApiResponse } from "next"

// Garantir que use Node.js runtime
export const runtime = 'nodejs'

import { formatDate, formatDateTime } from "@/lib/date-utils"

// Função para processar eventos de cobrança
async function processCobrancaEvent(cobranca: any, eventType: 'created' | 'updated') {
  try {
    console.log(`🔔 Evento de cobrança: ${eventType}`, cobranca._id)
    
    const emailService = new EmailService(getEmailConfig("gmail"))
    
    if (eventType === 'created') {
      // Quando uma cobrança é criada, enviar confirmação
      console.log(`📧 Enviando confirmação de cobrança para: ${cobranca.clienteId}`)
      
      // Aqui você pode implementar um template de confirmação
      // Por enquanto, vamos apenas logar
      console.log(`✅ Cobrança criada com sucesso: ${cobranca._id}`)
    }
    
    if (eventType === 'updated') {
      // Se a cobrança foi marcada como paga, enviar confirmação de pagamento
      if (cobranca.status === 'paid') {
        console.log(`💰 Enviando confirmação de pagamento para: ${cobranca.clienteId}`)
        
        const result = await emailService.sendPaymentConfirmation(
          cobranca.clienteId,
          cobranca.clienteId, // Nome temporário
          {
            description: cobranca.descricao,
            amount: cobranca.valor,
            dueDate: cobranca.vencimento
          }
        )
        
        if (result) {
          console.log(`✅ Confirmação de pagamento enviada para: ${cobranca.clienteId}`)
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar evento de cobrança:", error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { clienteId, descricao, valor, vencimento, status } = req.body;
      if (!clienteId || !descricao || !valor || !vencimento) {
        return res.status(400).json({ error: "Dados obrigatórios faltando." });
      }
      const db = await getDb();
      const cobranca = {
        clienteId,
        descricao,
        valor,
        vencimento: formatDate(vencimento),
        status: status || "pending", // Padronizando para inglês
        criadoEm: formatDateTime(new Date()),
      };
      const result = await db.collection("cobrancas").insertOne(cobranca);
      
      // Processar evento de criação (webhook)
      const cobrancaCriada = { ...cobranca, _id: result.insertedId }
      await processCobrancaEvent(cobrancaCriada, 'created')
      
      return res.status(201).json({ success: true, cobrancaId: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao cadastrar cobrança.", details: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  } else if (req.method === "GET") {
    try {
      const db = await getDb();
      const cobrancas = await db.collection("cobrancas").find({}).toArray();
      return res.status(200).json(cobrancas);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar cobranças.", details: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  } else if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ error: "ID da cobrança é obrigatório." });
      }
      
      const db = await getDb();
      const { ObjectId } = require('mongodb');
      
      const result = await db.collection("cobrancas").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, atualizadoEm: new Date() } },
        { returnDocument: 'after' }
      );
      
      if (result && result.value) {
        // Processar evento de atualização (webhook)
        await processCobrancaEvent(result.value, 'updated')
        
        return res.status(200).json({ success: true, cobranca: result.value });
      } else {
        return res.status(404).json({ error: "Cobrança não encontrada." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar cobrança.", details: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      
      // Validação do ID
      if (!id) {
        return res.status(400).json({ error: "ID da cobrança é obrigatório." });
      }

      const db = await getDb();
      const { ObjectId } = require('mongodb');
      
      // Verifica se a cobrança existe antes de tentar excluir
      const cobranca = await db.collection("cobrancas").findOne({ _id: new ObjectId(id) });
      
      if (!cobranca) {
        return res.status(404).json({ error: "Cobrança não encontrada." });
      }
      
      // Executa a exclusão
      const result = await db.collection("cobrancas").deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 1) {
        return res.status(200).json({ 
          success: true,
          message: "Cobrança excluída com sucesso."
        });
      } else {
        return res.status(500).json({ error: "Erro ao excluir cobrança." });
      }
    } catch (error) {
      console.error("Erro ao excluir cobrança:", error);
      return res.status(500).json({ 
        error: "Erro ao excluir cobrança.", 
        details: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
