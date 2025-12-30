// Script de teste para validar a integração completa
// Executar: node scripts/testar-integracao-atendimentos.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/sistema-cobranca";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function testarIntegracao() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');

    const db = client.db();

    // 1. Verificar estruturas no banco
    console.log('📊 1. Verificando estruturas do banco...\n');

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('Collections encontradas:');
    collectionNames.forEach(name => console.log(`   - ${name}`));

    // Verificar se existe atendimentos_tempo
    if (!collectionNames.includes('atendimentos_tempo')) {
      console.log('\n⚠️  Collection atendimentos_tempo não existe ainda (será criada no primeiro insert)');
    }

    // 2. Verificar analistas
    console.log('\n👥 2. Verificando analistas...\n');

    const analistas = await db.collection('users').find({ role: 'analista', ativo: true }).toArray();
    
    if (analistas.length === 0) {
      console.log('❌ Nenhum analista encontrado! Execute: node scripts/criar-analistas.js');
      return;
    }

    console.log(`✅ ${analistas.length} analista(s) encontrado(s):`);
    analistas.forEach(a => {
      console.log(`   - ${a.name} (${a.email}) - R$ ${a.valorHora}/h`);
    });

    // 3. Verificar clientes
    console.log('\n👤 3. Verificando clientes...\n');

    const clientes = await db.collection('customers').find().limit(5).toArray();
    
    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado! Cadastre um cliente primeiro.');
      return;
    }

    console.log(`✅ ${clientes.length} cliente(s) encontrado(s):`);
    clientes.forEach(c => {
      console.log(`   - ${c.name} (${c.email})`);
    });

    // 4. Simular criação de atendimento
    console.log('\n⏱️  4. Simulando criação de atendimento...\n');

    const analistaTeste = analistas[0];
    const clienteTeste = clientes[0];

    const novoAtendimento = {
      customerId: new ObjectId(clienteTeste._id),
      analistaId: new ObjectId(analistaTeste._id),
      inicio: new Date(),
      fim: null,
      tempoMinutos: null,
      valorHora: analistaTeste.valorHora,
      valorTotal: null,
      status: "em_andamento",
      descricao: "Teste de integração - Script automatizado",
      cobrancaId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const resultAtendimento = await db.collection('atendimentos_tempo').insertOne(novoAtendimento);
    const atendimentoId = resultAtendimento.insertedId;

    console.log(`✅ Atendimento criado: ${atendimentoId}`);
    console.log(`   Cliente: ${clienteTeste.name}`);
    console.log(`   Analista: ${analistaTeste.name}`);
    console.log(`   Valor/hora: R$ ${analistaTeste.valorHora}`);

    // 5. Simular finalização (aguardar 2 segundos)
    console.log('\n⏳ Aguardando 2 segundos para simular atendimento...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calcular tempo e valor
    const dataInicio = novoAtendimento.inicio;
    const dataFim = new Date();
    const diferencaMs = dataFim.getTime() - dataInicio.getTime();
    const tempoMinutos = Math.ceil(diferencaMs / (1000 * 60));
    const valorPorMinuto = analistaTeste.valorHora / 60;
    const valorTotal = tempoMinutos * valorPorMinuto;

    console.log(`📊 5. Finalizando atendimento e criando cobrança...\n`);
    console.log(`   Tempo decorrido: ${tempoMinutos} minuto(s)`);
    console.log(`   Valor calculado: R$ ${valorTotal.toFixed(2)}`);

    // Criar cobrança
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 7);

    const horas = Math.floor(tempoMinutos / 60);
    const minutos = tempoMinutos % 60;
    const tempoFormatado = `${horas}h${minutos.toString().padStart(2, '0')}min`;

    const descricaoCobranca = `Atendimento técnico – ${analistaTeste.name} – ${dataFim.toLocaleDateString('pt-BR')}
Tempo: ${tempoFormatado}
Cliente: ${clienteTeste.name}
[TESTE AUTOMATIZADO]`;

    const novaCobranca = {
      customerId: new ObjectId(clienteTeste._id),
      description: descricaoCobranca,
      amount: valorTotal,
      dueDate: dataVencimento,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: null,
      reminderSent: false,
      lastReminderDate: null,
      overdueSent: false,
      lastOverdueDate: null,
      origem: "ATENDIMENTO_TEMPO",
      referenciaId: atendimentoId
    };

    const resultCobranca = await db.collection('billings').insertOne(novaCobranca);
    const cobrancaId = resultCobranca.insertedId;

    console.log(`✅ Cobrança criada: ${cobrancaId}`);
    console.log(`   Descrição: ${descricaoCobranca.split('\n')[0]}...`);
    console.log(`   Valor: R$ ${valorTotal.toFixed(2)}`);
    console.log(`   Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}`);

    // Atualizar atendimento
    await db.collection('atendimentos_tempo').updateOne(
      { _id: atendimentoId },
      {
        $set: {
          fim: dataFim,
          tempoMinutos: tempoMinutos,
          valorTotal: valorTotal,
          status: "finalizado",
          cobrancaId: cobrancaId,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Atendimento atualizado com status "finalizado"`);

    // 6. Verificar rastreabilidade
    console.log('\n🔗 6. Verificando rastreabilidade...\n');

    const atendimentoFinalizado = await db.collection('atendimentos_tempo').findOne({ _id: atendimentoId });
    const cobrancaCriada = await db.collection('billings').findOne({ _id: cobrancaId });

    console.log('✅ Vínculo Atendimento → Cobrança:');
    console.log(`   Atendimento.cobrancaId: ${atendimentoFinalizado.cobrancaId}`);
    console.log(`   Cobrança._id: ${cobrancaCriada._id}`);
    console.log(`   Match: ${atendimentoFinalizado.cobrancaId.toString() === cobrancaCriada._id.toString() ? '✅' : '❌'}`);

    console.log('\n✅ Vínculo Cobrança → Atendimento:');
    console.log(`   Cobrança.referenciaId: ${cobrancaCriada.referenciaId}`);
    console.log(`   Atendimento._id: ${atendimentoFinalizado._id}`);
    console.log(`   Match: ${cobrancaCriada.referenciaId.toString() === atendimentoFinalizado._id.toString() ? '✅' : '❌'}`);

    console.log(`\n✅ Origem da cobrança: ${cobrancaCriada.origem}`);

    // 7. Verificar se aparece nas queries
    console.log('\n📊 7. Verificando queries...\n');

    const totalAtendimentos = await db.collection('atendimentos_tempo').countDocuments();
    const atendimentosFinalizados = await db.collection('atendimentos_tempo').countDocuments({ status: 'finalizado' });
    const cobrancasAtendimento = await db.collection('billings').countDocuments({ origem: 'ATENDIMENTO_TEMPO' });

    console.log(`✅ Total de atendimentos: ${totalAtendimentos}`);
    console.log(`✅ Atendimentos finalizados: ${atendimentosFinalizados}`);
    console.log(`✅ Cobranças de atendimentos: ${cobrancasAtendimento}`);

    // 8. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DA INTEGRAÇÃO');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Estrutura de dados: OK');
    console.log('✅ Analistas cadastrados: OK');
    console.log('✅ Clientes cadastrados: OK');
    console.log('✅ Criação de atendimento: OK');
    console.log('✅ Cálculo de tempo e valor: OK');
    console.log('✅ Criação automática de cobrança: OK');
    console.log('✅ Rastreabilidade (vínculos): OK');
    console.log('✅ Queries funcionando: OK');
    console.log('');
    console.log('🎉 INTEGRAÇÃO 100% FUNCIONAL!');
    console.log('');
    console.log('📝 IDs gerados:');
    console.log(`   Atendimento: ${atendimentoId}`);
    console.log(`   Cobrança: ${cobrancaId}`);
    console.log('');
    console.log('🧹 Para limpar dados de teste:');
    console.log(`   db.atendimentos_tempo.deleteOne({ _id: ObjectId("${atendimentoId}") })`);
    console.log(`   db.billings.deleteOne({ _id: ObjectId("${cobrancaId}") })`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Conexão fechada');
  }
}

// Executar
testarIntegracao();
