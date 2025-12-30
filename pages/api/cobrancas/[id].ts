import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'fynapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID da cobrança é obrigatório' });
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('cobrancas');

    if (req.method === 'GET') {
      // Buscar cobrança específica
      console.log('🔍 Buscando cobrança:', id);
      
      let cobrancaId;
      try {
        cobrancaId = new ObjectId(id);
      } catch (error) {
        await client.close();
        return res.status(400).json({ error: 'ID da cobrança inválido' });
      }

      const cobranca = await collection.findOne({ _id: cobrancaId });
      
      if (!cobranca) {
        await client.close();
        return res.status(404).json({ error: 'Cobrança não encontrada' });
      }

      // Buscar dados do cliente
      const clientesCollection = db.collection('clientes');
      const cliente = await clientesCollection.findOne({ _id: cobranca.cliente });

      const result = {
        _id: cobranca._id.toString(),
        customerId: cobranca.cliente?.toString() || '',
        amount: cobranca.valor,
        description: cobranca.descricao,
        dueDate: cobranca.vencimento,
        status: cobranca.status,
        createdAt: cobranca.dataCriacao,
        paymentMethod: cobranca.metodoPagamento || null,
        origem: cobranca.origem || null,
        referenciaId: cobranca.referenciaId?.toString() || null,
        customer: cliente ? {
          name: cliente.nome || '',
          email: cliente.email || '',
          phone: cliente.telefone || cliente.whatsapp || ''
        } : null
      };

      console.log('✅ Cobrança encontrada:', result.customer?.name || 'Sem cliente');
      
      await client.close();
      return res.status(200).json(result);

    } else if (req.method === 'PATCH') {
      // Atualizar cobrança
      console.log('📝 Atualizando cobrança:', id);
      
      const updates = req.body;
      let cobrancaId;
      
      try {
        cobrancaId = new ObjectId(id);
      } catch (error) {
        await client.close();
        return res.status(400).json({ error: 'ID da cobrança inválido' });
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      // Mapear campos de atualização
      if (updates.status) {
        updateData.status = updates.status;
      }
      
      if (updates.dataPagamento) {
        updateData.dataPagamento = new Date(updates.dataPagamento);
      }
      
      if (updates.transactionId) {
        updateData.transactionId = updates.transactionId;
      }

      const result = await collection.updateOne(
        { _id: cobrancaId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        await client.close();
        return res.status(404).json({ error: 'Cobrança não encontrada' });
      }

      console.log('✅ Cobrança atualizada com sucesso');
      
      await client.close();
      return res.status(200).json({ success: true, updated: result.modifiedCount });

    } else {
      await client.close();
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('❌ Erro na API de cobrança:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}