// Script para limpar cobranças de teste do banco de dados
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'fynapp';

async function limparCobrancasTeste() {
  console.log('🚀 Conectando ao MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  try {
    // Contar cobranças antes da limpeza
    const totalAntes = await db.collection('cobrancas').countDocuments({});
    console.log(`📊 Total de cobranças antes: ${totalAntes}`);

    // Identificar cobranças de teste - podemos usar diferentes critérios:
    // 1. Cobranças com campo 'teste' = true (se existir)
    // 2. Cobranças com IDs que começam com 'test_'
    // 3. Todas as cobranças (se quiser limpar tudo)
    
    // Opção 1: Deletar apenas cobranças marcadas como teste
    const resultTestFlag = await db.collection('cobrancas').deleteMany({ teste: true });
    console.log(`🗑️ Cobranças marcadas como teste: ${resultTestFlag.deletedCount} removidas`);
    
    // Opção 2: Deletar cobranças com IDs que começam com 'test_'
    const resultTestId = await db.collection('cobrancas').deleteMany({ 
      cobrancaId: { $regex: /^test_/ } 
    });
    console.log(`🗑️ Cobranças com ID de teste: ${resultTestId.deletedCount} removidas`);
    
    // CUIDADO: Descomentar apenas se quiser excluir TODAS as cobranças
    // const resultAll = await db.collection('cobrancas').deleteMany({});
    // console.log(`🗑️ TODAS as cobranças: ${resultAll.deletedCount} removidas`);
    
    // Contar cobranças após a limpeza
    const totalDepois = await db.collection('cobrancas').countDocuments({});
    console.log(`📊 Total de cobranças depois: ${totalDepois}`);
    console.log(`✅ ${totalAntes - totalDepois} cobranças removidas no total`);
    
    // Opcionalmente, listar as cobranças que restaram
    console.log('\n📋 Amostra das cobranças restantes:');
    const restantes = await db.collection('cobrancas')
      .find({})
      .limit(5)
      .toArray();
    
    if (restantes.length > 0) {
      restantes.forEach((cobranca, index) => {
        console.log(`${index + 1}. ID: ${cobranca.cobrancaId || cobranca._id}, ` + 
                   `Valor: R$ ${cobranca.valor}, ` +
                   `Status: ${cobranca.status}`);
      });
      console.log(`... e mais ${totalDepois - 5} cobranças`);
    } else {
      console.log('Nenhuma cobrança restante no banco de dados.');
    }

  } catch (error) {
    console.error('❌ Erro ao limpar cobranças:', error);
  } finally {
    await client.close();
    console.log('🔒 Conexão com o banco fechada');
  }
}

// Executar a limpeza
limparCobrancasTeste().catch(console.error);