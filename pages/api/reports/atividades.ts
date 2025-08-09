import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI!)
    const db = client.db(process.env.MONGODB_DB || 'fynapp')

    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())

    // Atividades do mês atual
    const cobrancasCriadasMes = await db.collection('cobrancas')
      .countDocuments({
        dataCriacao: { $gte: inicioMes }
      })

    const cobrancasPagasMes = await db.collection('cobrancas')
      .countDocuments({
        status: 'pago',
        dataPagamento: { $gte: inicioMes }
      })

    // Atividades da semana atual
    const cobrancasCriadasSemana = await db.collection('cobrancas')
      .countDocuments({
        dataCriacao: { $gte: inicioSemana }
      })

    const cobrancasPagasSemana = await db.collection('cobrancas')
      .countDocuments({
        status: 'pago',
        dataPagamento: { $gte: inicioSemana }
      })

    // Histórico diário dos últimos 30 dias
    const historicoDiario = []
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(hoje.getDate() - i)
      const dataInicio = new Date(data.setHours(0, 0, 0, 0))
      const dataFim = new Date(data.setHours(23, 59, 59, 999))

      const criadasNoDia = await db.collection('cobrancas')
        .countDocuments({
          dataCriacao: {
            $gte: dataInicio,
            $lte: dataFim
          }
        })

      const pagasNoDia = await db.collection('cobrancas')
        .countDocuments({
          status: 'pago',
          dataPagamento: {
            $gte: dataInicio,
            $lte: dataFim
          }
        })

      historicoDiario.push({
        data: dataInicio.toISOString().split('T')[0],
        dataFormatada: dataInicio.toLocaleDateString('pt-BR'),
        criadas: criadasNoDia,
        pagas: pagasNoDia,
        diaSemana: dataInicio.toLocaleDateString('pt-BR', { weekday: 'short' })
      })
    }

    // Estatísticas de emails (simulado - você pode implementar log real depois)
    const emailsEnviados = Math.floor(Math.random() * 50) + 20 // Simulado
    const emailsAbertura = Math.floor(emailsEnviados * 0.7) // 70% taxa de abertura simulada

    // Performance semanal
    const performanceSemanal = []
    for (let i = 3; i >= 0; i--) {
      const inicioSemanaRef = new Date(hoje)
      inicioSemanaRef.setDate(hoje.getDate() - (hoje.getDay() + (i * 7)))
      const fimSemanaRef = new Date(inicioSemanaRef)
      fimSemanaRef.setDate(inicioSemanaRef.getDate() + 6)

      const criadasSemana = await db.collection('cobrancas')
        .countDocuments({
          dataCriacao: {
            $gte: inicioSemanaRef,
            $lte: fimSemanaRef
          }
        })

      const pagasSemana = await db.collection('cobrancas')
        .countDocuments({
          status: 'pago',
          dataPagamento: {
            $gte: inicioSemanaRef,
            $lte: fimSemanaRef
          }
        })

      performanceSemanal.push({
        semana: `Sem ${4 - i}`,
        dataInicio: inicioSemanaRef.toLocaleDateString('pt-BR'),
        dataFim: fimSemanaRef.toLocaleDateString('pt-BR'),
        criadas: criadasSemana,
        pagas: pagasSemana,
        taxaConversao: criadasSemana > 0 ? Math.round((pagasSemana / criadasSemana) * 100) : 0
      })
    }

    await client.close()

    res.status(200).json({
      resumoMensal: {
        cobrancasCriadas: cobrancasCriadasMes,
        cobrancasPagas: cobrancasPagasMes,
        emailsEnviados,
        taxaConversaoMes: cobrancasCriadasMes > 0 ? Math.round((cobrancasPagasMes / cobrancasCriadasMes) * 100) : 0
      },
      resumoSemanal: {
        cobrancasCriadas: cobrancasCriadasSemana,
        cobrancasPagas: cobrancasPagasSemana,
        taxaConversaoSemana: cobrancasCriadasSemana > 0 ? Math.round((cobrancasPagasSemana / cobrancasCriadasSemana) * 100) : 0
      },
      historicoDiario,
      performanceSemanal,
      estatisticasEmail: {
        enviados: emailsEnviados,
        abertos: emailsAbertura,
        taxaAbertura: emailsEnviados > 0 ? Math.round((emailsAbertura / emailsEnviados) * 100) : 0
      },
      metadados: {
        periodoAnalise: '30 dias',
        dataAtualizacao: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados de atividades:', error)
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
