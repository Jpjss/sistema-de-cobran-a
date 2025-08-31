import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider } = req.query;
    const payload = req.body;
    
    console.log('🔔 Webhook recebido:', { provider, payload });

    // Verificar assinatura do webhook (segurança)
    const isValid = await verifyWebhookSignature(req, provider as string);
    
    if (!isValid) {
      console.log('❌ Assinatura do webhook inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar webhook baseado no provedor
    let result;
    
    switch (provider) {
      case 'stripe':
        result = await processStripeWebhook(payload);
        break;
      case 'pagseguro':
        result = await processPagSeguroWebhook(payload);
        break;
      case 'mercadopago':
        result = await processMercadoPagoWebhook(payload);
        break;
      case 'pix':
        result = await processPixWebhook(payload);
        break;
      default:
        console.log('❌ Provedor não suportado:', provider);
        return res.status(400).json({ error: 'Provedor não suportado' });
    }

    if (result.success) {
      console.log('✅ Webhook processado com sucesso');
      return res.status(200).json({ received: true });
    } else {
      console.log('❌ Erro ao processar webhook:', result.error);
      return res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function verifyWebhookSignature(req: NextApiRequest, provider: string): Promise<boolean> {
  // Implementar verificação específica por provedor
  
  switch (provider) {
    case 'stripe':
      const stripeSignature = req.headers['stripe-signature'] as string;
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!stripeSignature || !stripeSecret) return false;
      
      // Verificar assinatura do Stripe
      try {
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', stripeSecret)
          .update(payload)
          .digest('hex');
        
        return crypto.timingSafeEqual(
          Buffer.from(stripeSignature),
          Buffer.from(expectedSignature)
        );
      } catch {
        return false;
      }

    case 'pagseguro':
      // PagSeguro usa token de notificação
      const notificationCode = req.body.notificationCode;
      return !!notificationCode;

    case 'mercadopago':
      // Mercado Pago envia x-signature
      const mpSignature = req.headers['x-signature'] as string;
      return !!mpSignature;

    case 'pix':
      // PIX via SPI/API do Banco Central
      return true; // Implementar validação específica

    default:
      return false;
  }
}

async function processStripeWebhook(payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { type, data } = payload;

    switch (type) {
      case 'payment_intent.succeeded':
        const paymentIntent = data.object;
        await updatePaymentStatus(paymentIntent.metadata.cobrancaId, 'completed', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = data.object;
        await updatePaymentStatus(failedPayment.metadata.cobrancaId, 'failed', failedPayment.id);
        break;

      default:
        console.log('Evento Stripe não tratado:', type);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

async function processPagSeguroWebhook(payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { notificationCode, notificationType } = payload;

    if (notificationType === 'transaction') {
      // Consultar API do PagSeguro para obter detalhes da transação
      const transactionDetails = await consultarTransacaoPagSeguro(notificationCode);
      
      if (transactionDetails) {
        const status = mapPagSeguroStatus(transactionDetails.status);
        await updatePaymentStatus(transactionDetails.reference, status, transactionDetails.code);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

async function processMercadoPagoWebhook(payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { action, data } = payload;

    if (action === 'payment.updated') {
      // Consultar API do Mercado Pago
      const paymentDetails = await consultarPagamentoMercadoPago(data.id);
      
      if (paymentDetails) {
        const status = mapMercadoPagoStatus(paymentDetails.status);
        await updatePaymentStatus(paymentDetails.external_reference, status, paymentDetails.id);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

async function processPixWebhook(payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { txid, status, valor } = payload;

    if (status === 'CONCLUIDA') {
      await updatePaymentStatus(txid, 'completed', txid);
    } else if (status === 'DEVOLVIDA') {
      await updatePaymentStatus(txid, 'failed', txid);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

async function updatePaymentStatus(
  cobrancaId: string, 
  status: 'completed' | 'failed', 
  providerTransactionId: string
): Promise<void> {
  try {
    console.log(`📝 Atualizando pagamento: ${cobrancaId} -> ${status}`);

    // Atualizar no MongoDB
    // const db = await MongoClient.connect(process.env.MONGODB_URI);
    // await db.collection('cobrancas').updateOne(
    //   { _id: new ObjectId(cobrancaId) },
    //   { 
    //     $set: { 
    //       status: status === 'completed' ? 'pago' : 'pendente',
    //       dataPagamento: status === 'completed' ? new Date() : null,
    //       providerTransactionId,
    //       updatedAt: new Date()
    //     } 
    //   }
    // );

    // Enviar notificação por email
    if (status === 'completed') {
      await enviarNotificacaoPagamento(cobrancaId);
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar status do pagamento:', error);
  }
}

async function consultarTransacaoPagSeguro(notificationCode: string): Promise<any> {
  // Implementar consulta à API do PagSeguro
  // const response = await fetch(`https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${notificationCode}`, {
  //   headers: { 'Authorization': `Bearer ${process.env.PAGSEGURO_TOKEN}` }
  // });
  // return await response.json();
  return null;
}

async function consultarPagamentoMercadoPago(paymentId: string): Promise<any> {
  // Implementar consulta à API do Mercado Pago
  // const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
  //   headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
  // });
  // return await response.json();
  return null;
}

function mapPagSeguroStatus(status: number): 'completed' | 'failed' {
  // Status do PagSeguro: 3 = Paga, 7 = Cancelada
  return status === 3 ? 'completed' : 'failed';
}

function mapMercadoPagoStatus(status: string): 'completed' | 'failed' {
  // Status do Mercado Pago: approved, rejected, cancelled
  return status === 'approved' ? 'completed' : 'failed';
}

async function enviarNotificacaoPagamento(cobrancaId: string): Promise<void> {
  // Implementar envio de notificação
  console.log(`📧 Enviando notificação de pagamento para cobrança: ${cobrancaId}`);
  
  // Aqui você integraria com o sistema de email existente
}