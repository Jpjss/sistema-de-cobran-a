import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentConfigService, PaymentTransaction } from '@/lib/payment-providers';
import { generateValidPixCode } from '@/lib/pix-generator';
import { initializePIXConfig } from '@/lib/init-pix-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Garantir que a configuração PIX esteja inicializada
    initializePIXConfig();
    
    const { cobrancaId, amount, method, customerInfo } = req.body;

    if (!cobrancaId || !amount || !method) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }

    // Garantir que customerInfo tenha pelo menos o nome
    const customerData = {
      name: customerInfo?.name || customerInfo?.customerName || 'Cliente',
      email: customerInfo?.email || customerInfo?.customerEmail || '',
      ...customerInfo
    };

    console.log('💳 Criando pagamento:', { cobrancaId, amount, method, customerData });

    // Gerar ID único para a transação
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calcular taxas
    const fees = PaymentConfigService.calculateFees(amount, method);
    const netAmount = PaymentConfigService.getNetAmount(amount, method);

    // Criar transação baseada no método
    let transaction: PaymentTransaction;

    if (method === 'pix') {
      // Busca configuração PIX
      const pixConfig = PaymentConfigService.getConfig().methods.find(m => m.id === 'pix' && m.enabled);
      if (!pixConfig || !pixConfig.config || !pixConfig.config.chave) {
        return res.status(400).json({ error: 'PIX não configurado' });
      }

      const pixCode = generateValidPixCode(
        pixConfig.config.chave, // Chave PIX correta (email)
        customerData.name, // Nome do cliente
        amount,
        `Cobrança ${cobrancaId}`,
        transactionId // ID da transação como referência
      );
      
      transaction = {
        id: transactionId,
        cobrancaId,
        amount,
        fees,
        netAmount,
        method: 'pix',
        provider: 'banco_central',
        status: 'pending',
        pixQrCode: pixCode,
        pixCopyPaste: pixCode,
        createdAt: new Date().toISOString(),
        metadata: {
          pixKey: pixConfig.config.chave,
          customerInfo: customerData
        }
      };

      // Simular salvamento no banco de dados
      await saveTransaction(transaction);

      console.log('✅ PIX criado com sucesso:', transactionId);

      return res.status(200).json({
        success: true,
        id: transactionId,
        status: 'pending',
        amount,
        fees,
        netAmount,
        paymentCode: pixCode,
        pixQrCode: pixCode,
        pixCopyPaste: pixCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
      });

    } else if (method === 'credit_card') {
      // Gerar checkout URL (simulada)
      const checkoutUrl = `https://checkout.stripe.com/pay/test_${transactionId}`;
      
      transaction = {
        id: transactionId,
        cobrancaId,
        amount,
        fees,
        netAmount,
        method: 'credit_card',
        provider: 'stripe',
        status: 'pending',
        checkoutUrl,
        createdAt: new Date().toISOString(),
        metadata: {
          customerInfo
        }
      };

      await saveTransaction(transaction);

      console.log('✅ Checkout criado com sucesso:', transactionId);

      return res.status(200).json({
        id: transactionId,
        status: 'pending',
        checkoutUrl,
        amount,
        fees,
        netAmount
      });

    } else {
      return res.status(400).json({ error: 'Método de pagamento não suportado' });
    }

  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Simular banco de dados de transações em memória
const transactions: { [key: string]: PaymentTransaction } = {};

async function saveTransaction(transaction: PaymentTransaction): Promise<void> {
  transactions[transaction.id] = transaction;
  
  // Aqui você salvaria no MongoDB:
  // const db = await MongoClient.connect(process.env.MONGODB_URI);
  // await db.collection('transactions').insertOne(transaction);
}

