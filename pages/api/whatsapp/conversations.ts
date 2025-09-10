import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getConversations(req, res);
  } else if (req.method === 'POST') {
    return sendMessage(req, res);
  } else if (req.method === 'PUT') {
    return updateConversation(req, res);
  }
  
  return res.status(405).json({ error: 'Método não permitido' });
}

async function getConversations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    const db = client.db('sistema_cobranca');
    
    const { status, limit = 50, page = 1 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    
    const conversations = await db.collection('whatsapp_conversations')
      .find(filter)
      .sort({ lastInteraction: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .toArray();
    
    const total = await db.collection('whatsapp_conversations').countDocuments(filter);
    
    await client.close();
    
    return res.status(200).json({
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function sendMessage(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { phone, message, fromMe = true } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }
    
    // Enviar via Z-API
    const sent = await sendWhatsAppMessage(phone, message);
    
    if (sent) {
      // Salvar no MongoDB
      const client = new MongoClient(process.env.MONGODB_URI || '');
      await client.connect();
      const db = client.db('sistema_cobranca');
      
      await db.collection('whatsapp_conversations').updateOne(
        { phone },
        {
          $push: {
            messages: {
              messageId: `manual_${Date.now()}`,
              body: message,
              fromMe,
              timestamp: Math.floor(Date.now() / 1000),
              createdAt: new Date()
            }
          } as any,
          $set: { lastInteraction: new Date() }
        },
        { upsert: true }
      );
      
      await client.close();
      
      return res.status(200).json({ success: true, sent: true });
    } else {
      return res.status(500).json({ error: 'Falha ao enviar mensagem' });
    }
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function updateConversation(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { phone, status, tags, customerName } = req.body;
    
    const client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    const db = client.db('sistema_cobranca');
    
    const update: any = {};
    if (status) update.status = status;
    if (tags) update.tags = tags;
    if (customerName) update.customerName = customerName;
    
    await db.collection('whatsapp_conversations').updateOne(
      { phone },
      { $set: update }
    );
    
    await client.close();
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const zapiUrl = process.env.ZAPI_URL;
  const zapiToken = process.env.ZAPI_TOKEN;
  
  if (!zapiUrl || !zapiToken) {
    console.log('📱 Z-API não configurada, simulando envio:', { phone, message });
    return true; // Simular sucesso para desenvolvimento
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
    
    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar via Z-API:', error);
    return false;
  }
}