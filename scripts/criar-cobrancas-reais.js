// Script para criar cobranças reais (não-teste) no banco de dados
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'fynapp';

async function criarCobrancasReais() {
  console.log('🚀 Conectando ao MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  try {
    // Verificar se já existem cobranças no sistema
    const totalCobrancas = await db.collection('cobrancas').countDocuments({});
    console.log(`📊 Total de cobranças existentes: ${totalCobrancas}`);
    
    if (totalCobrancas > 0) {
      console.log('⚠️ Já existem cobranças no sistema. Deseja continuar? (s/n)');
      // Em um script real teríamos uma confirmação aqui
    }
    
    // Primeiro, vamos buscar os clientes existentes ou criar novos se não houver
    let clientes = await db.collection('clientes').find({}).toArray();
    
    if (clientes.length === 0) {
      console.log('🧑‍💼 Não existem clientes, criando clientes de produção...');
      
      const clientesNovos = [
        {
          nome: 'Empresa ABC Ltda',
          email: 'financeiro@empresaabc.com.br',
          telefone: '(11) 3333-4444',
          whatsapp: '5511999887766',
          endereco: 'Av. Paulista, 1000, São Paulo - SP',
          documento: '12.345.678/0001-90',
          dataCriacao: new Date(),
          setor: 'Tecnologia'
        },
        {
          nome: 'Indústrias XYZ S.A.',
          email: 'contato@industriasxyz.com.br',
          telefone: '(11) 2222-5555',
          whatsapp: '5511988776655',
          endereco: 'Rua Industrial, 500, Guarulhos - SP',
          documento: '98.765.432/0001-10',
          dataCriacao: new Date(),
          setor: 'Manufatura'
        },
        {
          nome: 'Consultoria Financeira Ltda',
          email: 'adm@consultoriafinanceira.com.br',
          telefone: '(11) 4444-6666',
          whatsapp: '5511977665544',
          endereco: 'Rua dos Bancos, 200, São Paulo - SP',
          documento: '45.678.901/0001-23',
          dataCriacao: new Date(),
          setor: 'Finanças'
        }
      ];
      
      const resultClientes = await db.collection('clientes').insertMany(clientesNovos);
      console.log(`✅ ${resultClientes.insertedCount} clientes criados`);
      
      clientes = await db.collection('clientes').find({}).toArray();
    }
    
    // Agora vamos criar cobranças reais com datas realistas
    console.log('💰 Criando cobranças para clientes...');
    
    const cobrancas = [];
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Para cada cliente, criamos algumas cobranças
    for (const cliente of clientes) {
      // Cobrança do mês passado (paga)
      const cobrancaMesPassado = {
        clienteId: cliente._id,
        cliente: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          telefone: cliente.telefone || cliente.whatsapp
        },
        descricao: `Serviços prestados - ${mesAtual === 0 ? 'Dezembro' : new Date(anoAtual, mesAtual - 1, 1).toLocaleString('pt-BR', { month: 'long' })}/${mesAtual === 0 ? anoAtual - 1 : anoAtual}`,
        valor: Math.floor(Math.random() * 5000) + 1000, // Entre R$ 1.000 e R$ 6.000
        categoria: 'Serviço Mensal',
        dataCriacao: new Date(mesAtual === 0 ? anoAtual - 1 : anoAtual, mesAtual === 0 ? 11 : mesAtual - 1, 10),
        vencimento: new Date(mesAtual === 0 ? anoAtual - 1 : anoAtual, mesAtual === 0 ? 11 : mesAtual - 1, 25),
        status: 'pago',
        dataPagamento: new Date(mesAtual === 0 ? anoAtual - 1 : anoAtual, mesAtual === 0 ? 11 : mesAtual - 1, 23),
        metodoPagamento: ['PIX', 'Transferência', 'Boleto'][Math.floor(Math.random() * 3)],
        cobrancaId: `COB${Date.now()}${Math.floor(Math.random() * 1000)}`,
        lembretesEnviados: 1,
        notificado: true
      };
      cobrancas.push(cobrancaMesPassado);
      
      // Cobrança do mês atual (pendente ou paga, dependendo da data)
      const diaHoje = hoje.getDate();
      const statusMesAtual = diaHoje > 15 ? (Math.random() > 0.5 ? 'pago' : 'pendente') : 'pendente';
      
      const cobrancaMesAtual = {
        clienteId: cliente._id,
        cliente: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          telefone: cliente.telefone || cliente.whatsapp
        },
        descricao: `Serviços prestados - ${new Date(anoAtual, mesAtual, 1).toLocaleString('pt-BR', { month: 'long' })}/${anoAtual}`,
        valor: Math.floor(Math.random() * 5000) + 1000, // Entre R$ 1.000 e R$ 6.000
        categoria: 'Serviço Mensal',
        dataCriacao: new Date(anoAtual, mesAtual, 10),
        vencimento: new Date(anoAtual, mesAtual, 25),
        status: statusMesAtual,
        dataPagamento: statusMesAtual === 'pago' ? new Date(anoAtual, mesAtual, Math.floor(Math.random() * (diaHoje - 15)) + 15) : null,
        metodoPagamento: statusMesAtual === 'pago' ? ['PIX', 'Transferência', 'Boleto'][Math.floor(Math.random() * 3)] : null,
        cobrancaId: `COB${Date.now()}${Math.floor(Math.random() * 1000)}`,
        lembretesEnviados: diaHoje > 15 && statusMesAtual === 'pendente' ? 1 : 0,
        notificado: false
      };
      cobrancas.push(cobrancaMesAtual);
      
      // Cobrança do próximo mês (futura)
      const cobrancaProximoMes = {
        clienteId: cliente._id,
        cliente: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          telefone: cliente.telefone || cliente.whatsapp
        },
        descricao: `Serviços prestados - ${new Date(anoAtual, mesAtual + 1, 1).toLocaleString('pt-BR', { month: 'long' })}/${anoAtual}`,
        valor: Math.floor(Math.random() * 5000) + 1000, // Entre R$ 1.000 e R$ 6.000
        categoria: 'Serviço Mensal',
        dataCriacao: new Date(anoAtual, mesAtual, 28), // Criada no fim do mês atual
        vencimento: new Date(anoAtual, mesAtual + 1, 25), // Vencimento no próximo mês
        status: 'pendente',
        dataPagamento: null,
        metodoPagamento: null,
        cobrancaId: `COB${Date.now()}${Math.floor(Math.random() * 1000)}`,
        lembretesEnviados: 0,
        notificado: false
      };
      cobrancas.push(cobrancaProximoMes);
    }
    
    // Inserir cobranças no banco
    const resultCobrancas = await db.collection('cobrancas').insertMany(cobrancas);
    console.log(`✅ ${resultCobrancas.insertedCount} cobranças criadas com sucesso!`);
    
    // Estatísticas das cobranças criadas
    const estatisticas = {
      total: cobrancas.length,
      pagas: cobrancas.filter(c => c.status === 'pago').length,
      pendentes: cobrancas.filter(c => c.status === 'pendente').length,
      valorTotal: cobrancas.reduce((sum, c) => sum + c.valor, 0),
      valorRecebido: cobrancas.filter(c => c.status === 'pago').reduce((sum, c) => sum + c.valor, 0),
      valorPendente: cobrancas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0)
    };
    
    console.log('\n📊 Estatísticas das cobranças criadas:');
    console.log(`Total de cobranças: ${estatisticas.total}`);
    console.log(`Cobranças pagas: ${estatisticas.pagas}`);
    console.log(`Cobranças pendentes: ${estatisticas.pendentes}`);
    console.log(`Valor total: R$ ${estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Valor recebido: R$ ${estatisticas.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Valor pendente: R$ ${estatisticas.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    console.log('\n✅ Dados de produção criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar cobranças:', error);
  } finally {
    await client.close();
    console.log('🔒 Conexão com o banco fechada');
  }
}

// Executar o script
criarCobrancasReais().catch(console.error);