import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const MONGODB_DB = process.env.MONGODB_DB || 'fynapp'

async function seedDatabase() {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  try {
    // Limpar dados existentes (apenas para demo)
    await db.collection('clientes').deleteMany({})
    await db.collection('cobrancas').deleteMany({})

    console.log('🗑️  Dados antigos removidos')

    // Criar clientes de exemplo
    const clientes = [
      {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        telefone: '(11) 99999-1111',
        endereco: 'Rua das Flores, 123',
        dataCriacao: new Date('2024-01-15')
      },
      {
        nome: 'Maria Santos',
        email: 'maria@exemplo.com',
        telefone: '(11) 99999-2222',
        endereco: 'Av. Principal, 456',
        dataCriacao: new Date('2024-02-10')
      },
      {
        nome: 'Pedro Oliveira',
        email: 'pedro@exemplo.com',
        telefone: '(11) 99999-3333',
        endereco: 'Rua dos Andradas, 789',
        dataCriacao: new Date('2024-03-05')
      },
      {
        nome: 'Ana Costa',
        email: 'ana@exemplo.com',
        telefone: '(11) 99999-4444',
        endereco: 'Rua São Paulo, 321',
        dataCriacao: new Date('2024-04-12')
      },
      {
        nome: 'Carlos Ferreira',
        email: 'carlos@exemplo.com',
        telefone: '(11) 99999-5555',
        endereco: 'Av. Brasil, 654',
        dataCriacao: new Date('2024-05-20')
      }
    ]

    const resultClientes = await db.collection('clientes').insertMany(clientes)
    const clienteIds = Object.values(resultClientes.insertedIds)
    
    console.log(`👥 ${clienteIds.length} clientes criados`)

    // Criar cobranças de exemplo (dos últimos 6 meses)
    const hoje = new Date()
    const cobrancas = []

    // Gerar cobranças para cada mês dos últimos 6 meses
    for (let mes = 5; mes >= 0; mes--) {
      const dataBase = new Date(hoje.getFullYear(), hoje.getMonth() - mes, 1)
      
      // 3-8 cobranças por mês
      const numCobrancas = Math.floor(Math.random() * 6) + 3
      
      for (let i = 0; i < numCobrancas; i++) {
        const clienteId = clienteIds[Math.floor(Math.random() * clienteIds.length)]
        const valor = Math.floor(Math.random() * 2000) + 100 // R$ 100 - R$ 2100
        
        // Data de criação no mês
        const dataCriacao = new Date(dataBase)
        dataCriacao.setDate(Math.floor(Math.random() * 28) + 1)
        
        // Vencimento 30 dias após criação
        const vencimento = new Date(dataCriacao)
        vencimento.setDate(vencimento.getDate() + 30)
        
        // Status baseado na data (70% pagas, 20% pendentes, 10% vencidas)
        let status = 'pendente'
        let dataPagamento = null
        
        const random = Math.random()
        if (random < 0.7) {
          status = 'pago'
          // Pagamento entre a criação e vencimento
          dataPagamento = new Date(dataCriacao)
          dataPagamento.setDate(dataPagamento.getDate() + Math.floor(Math.random() * 25))
        } else if (random < 0.9) {
          status = 'pendente'
        } else {
          status = 'pendente' // Vencida (será identificada pela data)
        }

        cobrancas.push({
          clienteId,
          descricao: `Serviço ${['Consultoria', 'Desenvolvimento', 'Suporte', 'Treinamento'][Math.floor(Math.random() * 4)]}`,
          valor,
          categoria: ['Consultoria', 'Produto', 'Serviço', 'Manutenção'][Math.floor(Math.random() * 4)],
          vencimento,
          status,
          dataCriacao,
          dataPagamento,
          metodoPagamento: status === 'pago' ? ['PIX', 'Cartão', 'Boleto'][Math.floor(Math.random() * 3)] : null
        })
      }
    }

    await db.collection('cobrancas').insertMany(cobrancas)
    console.log(`💰 ${cobrancas.length} cobranças criadas`)

    // Estatísticas dos dados criados
    const statusCount: Record<string, number> = cobrancas.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalValor = cobrancas.reduce((sum, c) => sum + c.valor, 0)
    const valorPago = cobrancas.filter(c => c.status === 'pago').reduce((sum, c) => sum + c.valor, 0)
    const valorPendente = cobrancas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0)

    console.log('\n📊 Estatísticas dos dados criados:')
    console.log(`Total de cobranças: ${cobrancas.length}`)
    console.log(`Status: Pagas: ${statusCount['pago'] || 0}, Pendentes: ${statusCount['pendente'] || 0}`)
    console.log(`Valor total: R$ ${totalValor.toLocaleString('pt-BR')}`)
    console.log(`Valor pago: R$ ${valorPago.toLocaleString('pt-BR')}`)
    console.log(`Valor pendente: R$ ${valorPendente.toLocaleString('pt-BR')}`)

    console.log('\n✅ Database populated successfully!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await client.close()
  }
}

// Executar o script
seedDatabase().catch(console.error)
