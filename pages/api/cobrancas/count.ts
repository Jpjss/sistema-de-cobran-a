// API para verificar contagem e última modificação das cobranças
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDb()
    
    // Contar total de cobranças
    const count = await db.collection('cobrancas').countDocuments()
    
    // Buscar a cobrança mais recentemente modificada
    const lastModifiedBilling = await db.collection('cobrancas')
      .findOne(
        {},
        { 
          sort: { dataCriacao: -1 }
        }
      )

    // Determinar timestamp da última modificação
    let lastModified = new Date()
    if (lastModifiedBilling) {
      const dates = [
        lastModifiedBilling.dataPagamento,
        lastModifiedBilling.atualizadoEm,
        lastModifiedBilling.dataCriacao
      ].filter(Boolean).map(d => new Date(d))
      
      if (dates.length > 0) {
        lastModified = new Date(Math.max(...dates.map(d => d.getTime())))
      }
    }

    // Contar por status para mudanças rápidas
    const statusCounts = await db.collection('cobrancas').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$valor' }
        }
      }
    ]).toArray()

    const summary = {
      pendente: 0,
      pago: 0,
      vencido: 0,
      totalPendente: 0,
      totalPago: 0,
      totalVencido: 0
    }

    statusCounts.forEach(item => {
      if (item._id === 'pendente') {
        summary.pendente = item.count
        summary.totalPendente = item.total || 0
      } else if (item._id === 'pago') {
        summary.pago = item.count
        summary.totalPago = item.total || 0
      } else if (item._id === 'vencido' || item._id === 'overdue') {
        summary.vencido = item.count
        summary.totalVencido = item.total || 0
      }
    })

    res.status(200).json({
      count,
      lastModified: lastModified.toISOString(),
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao verificar contagem de cobranças:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}