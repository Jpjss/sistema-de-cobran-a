import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db(process.env.MONGODB_DB || 'fynapp')

    // Buscar todas as cobranças
    const cobrancas = await db.collection('cobrancas').find({}).toArray()

    // Calcular totais
    const totalRecebido = cobrancas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + (c.valor || 0), 0)

    const totalPendente = cobrancas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (c.valor || 0), 0)

    const totalVencido = cobrancas
      .filter(c => c.status === 'pendente' && new Date(c.vencimento) < new Date())
      .reduce((sum, c) => sum + (c.valor || 0), 0)

    // Calcular histórico mensal dos últimos 6 meses
    const hoje = new Date()
    const historicoMensal = []
    
    for (let i = 5; i >= 0; i--) {
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0)
      
      const cobrancasDoMes = cobrancas.filter(c => {
        const dataCriacao = new Date(c.dataCriacao || c._id.getTimestamp())
        return dataCriacao >= dataInicio && dataCriacao <= dataFim
      })

      const recebidoNoMes = cobrancasDoMes
        .filter(c => c.status === 'pago')
        .reduce((sum, c) => sum + (c.valor || 0), 0)

      const pendenteNoMes = cobrancasDoMes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor || 0), 0)

      historicoMensal.push({
        mes: dataInicio.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        mesCompleto: dataInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        recebido: recebidoNoMes,
        pendente: pendenteNoMes,
        total: recebidoNoMes + pendenteNoMes
      })
    }

    // Calcular previsão próximo mês (baseado na média dos últimos 3 meses)
    const ultimosTresMeses = historicoMensal.slice(-3)
    const mediaTresMeses = ultimosTresMeses.reduce((sum, m) => sum + m.total, 0) / 3

    // Dados para gráfico de pizza
    const dadosPizza = [
      { name: 'Recebido', value: totalRecebido, fill: '#22c55e' },
      { name: 'Pendente', value: totalPendente, fill: '#f59e0b' },
      { name: 'Vencido', value: totalVencido, fill: '#ef4444' }
    ]

    await client.close()

    res.status(200).json({
      resumo: {
        totalRecebido,
        totalPendente,
        totalVencido,
        previsaoProximoMes: Math.round(mediaTresMeses)
      },
      historicoMensal,
      dadosPizza,
      metadados: {
        totalCobrancas: cobrancas.length,
        cobrancasPagas: cobrancas.filter(c => c.status === 'pago').length,
        cobrancasPendentes: cobrancas.filter(c => c.status === 'pendente').length,
        dataAtualizacao: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error)
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
