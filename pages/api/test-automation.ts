import type { NextApiRequest, NextApiResponse } from "next"
import { getDb } from "@/lib/mongodb"
import { emailScheduler } from "@/lib/email-scheduler"
import { emailQueue } from "@/lib/email-queue"

// Garantir que serviços estejam rodando
function ensureServices() {
  try {
    if (!(emailScheduler as any).isRunning) {
      console.log("🚀 Auto-inicializando agendador...")
      emailScheduler.start()
    }
    emailQueue.start() // Sempre garantir que fila esteja ativa
  } catch (error) {
    console.error("❌ Erro ao garantir serviços:", error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // SEMPRE garantir que serviços estejam rodando
  ensureServices()

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" })
  }

  try {
    const { action, testData } = req.body

    switch (action) {
      case "status":
        // Verificar status dos serviços
        return res.json({
          scheduler: {
            running: (emailScheduler as any).isRunning || false,
            message: "Agendador verificando cobranças a cada hora"
          },
          queue: {
            running: true,
            pending: (emailQueue as any).jobs?.length || 0,
            message: "Fila processando e-mails"
          }
        })

      case "create-test-cobranca":
        // Criar cobrança de teste
        const db = await getDb()
        
        // Data de vencimento para amanhã (para teste de lembrete)
        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        
        const testCobranca = {
          clienteId: testData?.email || "teste@email.com",
          descricao: "Cobrança de Teste - Automação",
          valor: 150.00,
          vencimento: amanha.toISOString().split('T')[0],
          status: "pendente",
          createdAt: new Date(),
          lembreteEnviado: false,
          alertaAtrasadoEnviado: false
        }

        const result = await db.collection("cobrancas").insertOne(testCobranca)
        
        return res.json({
          message: "Cobrança de teste criada! Webhook deve ter disparado e-mail automático.",
          cobranca: { ...testCobranca, _id: result.insertedId },
          nextStep: "Verifique o e-mail e aguarde o lembrete automático amanhã"
        })

      case "create-overdue-test":
        // Criar cobrança atrasada de teste
        const dbOverdue = await getDb()
        
        // Data de vencimento ontem (para teste de atraso)
        const ontem = new Date()
        ontem.setDate(ontem.getDate() - 1)
        
        const overdueCobranca = {
          clienteId: testData?.email || "teste@email.com",
          descricao: "Cobrança Atrasada - Teste",
          valor: 75.00,
          vencimento: ontem.toISOString().split('T')[0],
          status: "pendente",
          createdAt: new Date(),
          lembreteEnviado: false,
          alertaAtrasadoEnviado: false
        }

        const overdueResult = await dbOverdue.collection("cobrancas").insertOne(overdueCobranca)
        
        return res.json({
          message: "Cobrança atrasada criada! Na próxima verificação (máximo 1h) será enviado alerta.",
          cobranca: { ...overdueCobranca, _id: overdueResult.insertedId },
          nextStep: "Aguarde até 1 hora ou execute verificação manual"
        })

      case "force-check":
        // Forçar verificação manual
        console.log("🔧 Executando verificação manual para teste...")
        await emailScheduler.runNow()
        
        return res.json({
          message: "Verificação manual executada! Confira os logs do servidor.",
          tip: "Verifique o console do servidor para ver os e-mails sendo processados"
        })

      case "queue-status":
        // Status da fila
        const queueStats = {
          pending: (emailQueue as any).jobs?.length || 0,
          processing: (emailQueue as any).isProcessing || false,
          lastProcessed: (emailQueue as any).lastProcessed || "Nunca"
        }
        
        return res.json({
          message: "Status da fila de e-mails",
          queue: queueStats
        })

      case "send-test-email":
        // Enviar e-mail de teste direto
        await emailQueue.addJob({
          type: "test",
          email: testData?.email || "teste@email.com",
          customerName: "Cliente de Teste",
          data: {
            description: "Teste direto da fila",
            amount: 100.00,
            dueDate: new Date().toISOString().split('T')[0]
          },
          maxAttempts: 3
        })

        return res.json({
          message: "E-mail de teste adicionado à fila!",
          tip: "Verifique o e-mail em alguns segundos"
        })

      default:
        return res.status(400).json({ message: "Ação não reconhecida" })
    }

  } catch (error) {
    console.error("❌ Erro no teste de automação:", error)
    return res.status(500).json({ 
      message: "Erro no teste", 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    })
  }
}
