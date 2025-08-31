import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentTransaction } from '@/lib/payment-providers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionId } = req.query;

  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Transaction ID é obrigatório' });
  }

  try {
    console.log('🔍 Verificando status do pagamento:', transactionId);

    // Buscar transação (simulação)
    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Simular verificação de status
    // Em produção, aqui você consultaria a API do provedor de pagamento
    const updatedTransaction = await checkPaymentStatus(transaction);

    console.log('📊 Status atual:', updatedTransaction.status);

    return res.status(200).json({
      id: updatedTransaction.id,
      status: updatedTransaction.status,
      amount: updatedTransaction.amount,
      completedAt: updatedTransaction.completedAt,
      providerTransactionId: updatedTransaction.providerTransactionId
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Simular banco de dados de transações em memória
const transactions: { [key: string]: PaymentTransaction } = {};

async function getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
  // Aqui você buscaria no MongoDB:
  // const db = await MongoClient.connect(process.env.MONGODB_URI);
  // return await db.collection('transactions').findOne({ id: transactionId });
  
  return transactions[transactionId] || null;
}

async function checkPaymentStatus(transaction: PaymentTransaction): Promise<PaymentTransaction> {
  // Simular verificação de status baseada no tempo
  const now = new Date();
  const createdAt = new Date(transaction.createdAt);
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

  let updatedTransaction = { ...transaction };

  if (transaction.status === 'pending') {
    if (transaction.method === 'pix') {
      // Simular aprovação automática após 2 minutos para demonstração
      if (minutesElapsed > 2) {
        updatedTransaction.status = 'completed';
        updatedTransaction.completedAt = now.toISOString();
        updatedTransaction.providerTransactionId = `pix_${Date.now()}`;
        
        // Atualizar status da cobrança
        await updateCobrancaStatus(transaction.cobrancaId, 'pago');
        
        console.log('✅ PIX confirmado automaticamente (simulação)');
      }
    } else if (transaction.method === 'credit_card') {
      // Simular aprovação de cartão após 1 minuto
      if (minutesElapsed > 1) {
        updatedTransaction.status = 'completed';
        updatedTransaction.completedAt = now.toISOString();
        updatedTransaction.providerTransactionId = `card_${Date.now()}`;
        
        await updateCobrancaStatus(transaction.cobrancaId, 'pago');
        
        console.log('✅ Cartão aprovado automaticamente (simulação)');
      }
    }

    // Salvar transação atualizada
    transactions[transaction.id] = updatedTransaction;
  }

  return updatedTransaction;
}

async function updateCobrancaStatus(cobrancaId: string, status: string): Promise<void> {
  try {
    // Aqui você atualizaria a cobrança no MongoDB
    console.log(`📝 Atualizando cobrança ${cobrancaId} para status: ${status}`);
    
    // Simulação:
    // const db = await MongoClient.connect(process.env.MONGODB_URI);
    // await db.collection('cobrancas').updateOne(
    //   { _id: new ObjectId(cobrancaId) },
    //   { 
    //     $set: { 
    //       status: status,
    //       dataPagamento: new Date(),
    //       updatedAt: new Date()
    //     } 
    //   }
    // );

  } catch (error) {
    console.error('❌ Erro ao atualizar cobrança:', error);
  }
}