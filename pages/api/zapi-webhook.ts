import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

// Interface para os eventos da Z-API
interface ZApiEvent {
  event: string;
  phone: string;
  message?: {
    body: string;
    messageId: string;
    fromMe: boolean;
    timestamp: number;
  };
  status?: string;
  timestamp: number;
}

// Interface para conversas salvas
interface Conversation {
  phone: string;
  customerName?: string;
  messages: Array<{
    messageId: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
    createdAt: Date;
  }>;
  lastInteraction: Date;
  status: 'active' | 'resolved' | 'pending';
  cobrancaId?: string;
  tags: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificação de segurança com token
  const AUTH_TOKEN = process.env.ZAPI_WEBHOOK_TOKEN;
  if (AUTH_TOKEN && req.headers['x-zapi-token'] !== AUTH_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const event: ZApiEvent = req.body;
  
  // Log do evento recebido
  console.log('📱 Evento Z-API recebido:', {
    event: event.event,
    phone: event.phone,
    timestamp: new Date(event.timestamp * 1000)
  });

  try {
    // Conectar ao MongoDB
    const client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    const db = client.db('sistema_cobranca');

    if (event.event === 'MESSAGE' && event.message && !event.message.fromMe) {
      await handleIncomingMessage(db, event);
    } else if (event.event === 'MESSAGE_STATUS') {
      await handleMessageStatus(db, event);
    }

    await client.close();
    
    return res.status(200).json({ 
      status: 'Recebido com sucesso',
      processed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook Z-API:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

async function handleIncomingMessage(db: any, event: ZApiEvent) {
  const { phone, message } = event;
  
  if (!message) return;

  const messageBody = message.body.toLowerCase().trim();
  
  // Salvar mensagem na conversa
  await saveMessage(db, phone, message);
  
  // Verificar se existe cobrança para este telefone
  const cobranca = await findCobrancaByPhone(db, phone);
  
  // Detectar intenções da mensagem
  const intent = detectIntent(messageBody);
  
  console.log(`📞 Mensagem de ${phone}: "${message.body}" | Intenção: ${intent}`);
  
  // Responder automaticamente baseado na intenção
  if (intent === 'negociar' && cobranca) {
    await sendNegotiationResponse(phone, cobranca);
  } else if (intent === 'pagamento' && cobranca) {
    await sendPaymentOptions(phone, cobranca);
  } else if (intent === 'duvida') {
    await sendHelpResponse(phone);
  } else if (cobranca) {
    await sendCobrancaInfo(phone, cobranca);
  } else {
    await sendWelcomeMessage(phone);
  }
  
  // Atualizar tags da conversa baseado na intenção
  await updateConversationTags(db, phone, intent, cobranca?.id);
}

async function handleMessageStatus(db: any, event: ZApiEvent) {
  console.log(`📋 Status da mensagem: ${event.status} para ${event.phone}`);
  
  // Aqui você pode implementar lógica para rastrear entregas,
  // visualizações, etc.
}

async function saveMessage(db: any, phone: string, message: any) {
  const conversations = db.collection('whatsapp_conversations');
  
  const messageData = {
    messageId: message.messageId,
    body: message.body,
    fromMe: message.fromMe || false,
    timestamp: message.timestamp,
    createdAt: new Date()
  };
  
  await conversations.updateOne(
    { phone },
    {
      $push: { messages: messageData },
      $set: { 
        lastInteraction: new Date(),
        status: 'active'
      },
      $setOnInsert: {
        phone,
        tags: [],
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function findCobrancaByPhone(db: any, phone: string) {
  const cobrancas = db.collection('cobrancas');
  
  // Limpar o telefone para busca (remover caracteres especiais)
  const cleanPhone = phone.replace(/\D/g, '');
  
  return await cobrancas.findOne({
    $or: [
      { 'cliente.telefone': phone },
      { 'cliente.telefone': cleanPhone },
      { 'cliente.whatsapp': phone },
      { 'cliente.whatsapp': cleanPhone },
      { telefone: phone },
      { telefone: cleanPhone }
    ],
    status: { $in: ['pendente', 'pending'] }
  });
}

function detectIntent(message: string): string {
  const negotiationWords = ['negociar', 'parcela', 'desconto', 'acordo', 'parcelar', 'dividir'];
  const paymentWords = ['pagar', 'pagamento', 'pix', 'cartão', 'boleto', 'transferir'];
  const helpWords = ['ajuda', 'dúvida', 'como', 'não entendi', 'explicar'];
  
  if (negotiationWords.some(word => message.includes(word))) {
    return 'negociar';
  } else if (paymentWords.some(word => message.includes(word))) {
    return 'pagamento';
  } else if (helpWords.some(word => message.includes(word))) {
    return 'duvida';
  }
  
  return 'geral';
}

async function sendNegotiationResponse(phone: string, cobranca: any) {
  const message = `Olá! 👋\n\nVi que você quer negociar sua cobrança de *R$ ${cobranca.valor?.toFixed(2)}*.\n\n🤝 *Opções disponíveis:*\n• Desconto de 10% para pagamento à vista\n• Parcelamento em até 3x sem juros\n• Desconto progressivo por atraso\n\nDigite *DESCONTO* para ver condições especiais ou *PARCELAR* para opções de parcelamento.`;
  
  await sendWhatsAppMessage(phone, message);
}

async function sendPaymentOptions(phone: string, cobranca: any) {
  const message = `💳 *Formas de Pagamento Disponíveis*\n\n*PIX* - Instantâneo com desconto de 5%\n*Cartão de Crédito* - Até 12x\n*Boleto* - Vencimento em 3 dias\n\nValor: *R$ ${cobranca.valor?.toFixed(2)}*\nVencimento: ${new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}\n\nDigite *PIX* para gerar código de pagamento instantâneo! 🚀`;
  
  await sendWhatsAppMessage(phone, message);
}

async function sendHelpResponse(phone: string) {
  const message = `🆘 *Como posso te ajudar?*\n\n• Digite *COBRANÇA* para ver suas pendências\n• Digite *PAGAMENTO* para formas de pagamento\n• Digite *NEGOCIAR* para fazer um acordo\n• Digite *SUPORTE* para falar com atendente\n\nEstou aqui para facilitar sua vida! 😊`;
  
  await sendWhatsAppMessage(phone, message);
}

async function sendCobrancaInfo(phone: string, cobranca: any) {
  const diasAtraso = Math.floor((Date.now() - new Date(cobranca.vencimento).getTime()) / (1000 * 60 * 60 * 24));
  const statusAtraso = diasAtraso > 0 ? `⚠️ ${diasAtraso} dias em atraso` : '✅ No prazo';
  
  const message = `📋 *Informações da sua cobrança:*\n\nValor: *R$ ${cobranca.valor?.toFixed(2)}*\nVencimento: ${new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}\nStatus: ${statusAtraso}\n\n${diasAtraso > 0 ? '🎯 *Quer negociar?* Digite *NEGOCIAR*' : '💳 Digite *PAGAR* para ver opções de pagamento'}\n\nFynApp - Gestão Inteligente`;
  
  await sendWhatsAppMessage(phone, message);
}

async function sendWelcomeMessage(phone: string) {
  const message = `Olá! 👋 Bem-vindo ao *FynApp*!\n\nSou seu assistente de cobranças automático. \n\n🔍 Não encontrei cobranças pendentes para este número.\n\nSe você tem alguma pendência, entre em contato com nossa equipe ou verifique se o número está correto.\n\n📞 *Suporte:* Digite *SUPORTE*`;
  
  await sendWhatsAppMessage(phone, message);
}

async function updateConversationTags(db: any, phone: string, intent: string, cobrancaId?: string) {
  const conversations = db.collection('whatsapp_conversations');
  
  const tags = [intent];
  if (cobrancaId) tags.push('tem_cobranca');
  
  await conversations.updateOne(
    { phone },
    { 
      $addToSet: { tags: { $each: tags } },
      $set: { cobrancaId }
    }
  );
}

async function sendWhatsAppMessage(phone: string, message: string) {
  // Implementar envio via Z-API
  const zapiUrl = process.env.ZAPI_URL;
  const zapiToken = process.env.ZAPI_TOKEN;
  
  if (!zapiUrl || !zapiToken) {
    console.log('📱 Simulando envio:', { phone, message });
    return;
  }
  
  try {
    const response = await fetch(`${zapiUrl}/send-text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zapiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone,
        message
      })
    });
    
    if (response.ok) {
      console.log(`✅ Mensagem enviada para ${phone}`);
    } else {
      console.error(`❌ Erro ao enviar mensagem: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Z-API:', error);
  }
}