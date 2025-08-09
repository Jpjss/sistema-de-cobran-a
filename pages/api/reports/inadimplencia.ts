import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db(process.env.MONGODB_DB || 'fynapp')

    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999) // Final do dia atual

    // Buscar cobranças inadimplentes com dados do cliente
    const inadimplentes = await db.collection('cobrancas')
      .aggregate([
        {
          $match: {
            status: 'pendente',
            vencimento: { $lt: hoje }
          }
        },
        {
          $lookup: {
            from: 'clientes',
            localField: 'clienteId',
            foreignField: '_id',
            as: 'cliente'
          }
        },
        {
          $addFields: {
            diasAtraso: {
              $floor: {
                $divide: [
                  { $subtract: [hoje, '$vencimento'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        },
        {
          $sort: { diasAtraso: -1 }
        }
      ])
      .toArray()

    // Calcular total de inadimplência
    const totalInadimplencia = inadimplentes.reduce((sum, c) => sum + (c.valor || 0), 0)

    // Buscar total geral de cobranças para calcular percentual
    const totalCobrancas = await db.collection('cobrancas').countDocuments()
    const totalInadimplentes = inadimplentes.length
    const percentualInadimplencia = totalCobrancas > 0 ? (totalInadimplentes / totalCobrancas) * 100 : 0

    // Histórico de inadimplência por mês (últimos 6 meses)
    const historicoMensal = []
    
    for (let i = 5; i >= 0; i--) {
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0)
      
      // Cobranças que venceram neste mês
      const cobrancasVencidasNoMes = await db.collection('cobrancas')
        .find({
          status: 'pendente',
          vencimento: {
            $gte: dataInicio,
            $lte: dataFim
          }
        })
        .toArray()

      const valorInadimplenteNoMes = cobrancasVencidasNoMes.reduce((sum, c) => sum + (c.valor || 0), 0)

      historicoMensal.push({
        mes: dataInicio.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        mesCompleto: dataInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        valor: valorInadimplenteNoMes,
        quantidade: cobrancasVencidasNoMes.length
      })
    }

    // Lista formatada de inadimplentes
    const listaInadimplentes = inadimplentes.map(c => ({
      id: c._id,
      clienteNome: c.cliente[0]?.nome || 'Cliente não encontrado',
      clienteEmail: c.cliente[0]?.email || '',
      valor: c.valor || 0,
      vencimento: c.vencimento,
      diasAtraso: c.diasAtraso,
      descricao: c.descricao || '',
      categoria: c.categoria || 'Geral'
    }))

    // Agrupar por faixas de atraso
    const faixasAtraso = [
      { nome: '1-30 dias', min: 1, max: 30, cor: '#f59e0b' },
      { nome: '31-60 dias', min: 31, max: 60, cor: '#ef4444' },
      { nome: '61-90 dias', min: 61, max: 90, cor: '#dc2626' },
      { nome: '90+ dias', min: 91, max: Infinity, cor: '#7f1d1d' }
    ]

    const inadimplenciaPorFaixa = faixasAtraso.map(faixa => {
      const cobrancasDaFaixa = listaInadimplentes.filter(c => 
        c.diasAtraso >= faixa.min && c.diasAtraso <= faixa.max
      )
      return {
        ...faixa,
        quantidade: cobrancasDaFaixa.length,
        valor: cobrancasDaFaixa.reduce((sum, c) => sum + c.valor, 0)
      }
    })

    await client.close()

    res.status(200).json({
      resumo: {
        totalInadimplencia,
        totalInadimplentes,
        percentualInadimplencia: Math.round(percentualInadimplencia * 100) / 100,
        mediaValorInadimplente: totalInadimplentes > 0 ? Math.round(totalInadimplencia / totalInadimplentes) : 0
      },
      listaInadimplentes: listaInadimplentes.slice(0, 50), // Limitar a 50 para performance
      historicoMensal,
      inadimplenciaPorFaixa,
      metadados: {
        totalRegistros: listaInadimplentes.length,
        dataAtualizacao: new Date().toISOString(),
        criterio: 'Cobranças com vencimento anterior à data atual'
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados de inadimplência:', error)
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
