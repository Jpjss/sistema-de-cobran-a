// Script interativo para limpar cobranças do banco de dados
const { MongoClient } = require('mongodb');
const readline = require('readline');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'fynapp';

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para perguntar ao usuário
function pergunta(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function limparCobrancas() {
  console.log('🧹 Ferramenta de Limpeza de Cobranças FynApp 🧹');
  console.log('===============================================\n');
  
  console.log('🚀 Conectando ao MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  try {
    // Estatísticas iniciais
    const totalCobrancas = await db.collection('cobrancas').countDocuments({});
    const cobPendentes = await db.collection('cobrancas').countDocuments({ status: 'pendente' });
    const cobPagas = await db.collection('cobrancas').countDocuments({ status: 'pago' });
    const cobTeste = await db.collection('cobrancas').countDocuments({ 
      $or: [
        { teste: true },
        { cobrancaId: { $regex: /^test_/ } }
      ]
    });
    
    console.log('\n📊 Estatísticas do Banco de Dados:');
    console.log(`Total de cobranças: ${totalCobrancas}`);
    console.log(`Cobranças pendentes: ${cobPendentes}`);
    console.log(`Cobranças pagas: ${cobPagas}`);
    console.log(`Cobranças de teste identificadas: ${cobTeste}`);
    
    // Menu de opções
    console.log('\n🔍 O que você deseja fazer?');
    console.log('1. Excluir apenas cobranças marcadas como teste');
    console.log('2. Excluir cobranças pendentes');
    console.log('3. Excluir todas as cobranças');
    console.log('4. Sair sem fazer alterações');
    
    const opcao = await pergunta('\nEscolha uma opção (1-4): ');
    
    switch (opcao.trim()) {
      case '1':
        // Excluir apenas cobranças de teste
        const confirmaTeste = await pergunta(`Confirma a exclusão de ${cobTeste} cobranças de teste? (s/n): `);
        if (confirmaTeste.toLowerCase() === 's') {
          const resultTeste = await db.collection('cobrancas').deleteMany({ 
            $or: [
              { teste: true },
              { cobrancaId: { $regex: /^test_/ } }
            ]
          });
          console.log(`\n✅ ${resultTeste.deletedCount} cobranças de teste removidas com sucesso!`);
        } else {
          console.log('\n❌ Operação cancelada pelo usuário.');
        }
        break;
        
      case '2':
        // Excluir cobranças pendentes
        const confirmaPendentes = await pergunta(`Confirma a exclusão de ${cobPendentes} cobranças pendentes? (s/n): `);
        if (confirmaPendentes.toLowerCase() === 's') {
          const resultPendentes = await db.collection('cobrancas').deleteMany({ status: 'pendente' });
          console.log(`\n✅ ${resultPendentes.deletedCount} cobranças pendentes removidas com sucesso!`);
        } else {
          console.log('\n❌ Operação cancelada pelo usuário.');
        }
        break;
        
      case '3':
        // Excluir TODAS as cobranças
        const confirmaTodas = await pergunta(`⚠️ ATENÇÃO! Confirma a exclusão de TODAS as ${totalCobrancas} cobranças? (s/n): `);
        if (confirmaTodas.toLowerCase() === 's') {
          const segundaConfirmacao = await pergunta(`⚠️ Tem absoluta certeza? Esta ação não pode ser desfeita! (digite 'confirmar' para prosseguir): `);
          if (segundaConfirmacao.toLowerCase() === 'confirmar') {
            const resultTodas = await db.collection('cobrancas').deleteMany({});
            console.log(`\n✅ ${resultTodas.deletedCount} cobranças removidas com sucesso!`);
          } else {
            console.log('\n❌ Operação cancelada pelo usuário.');
          }
        } else {
          console.log('\n❌ Operação cancelada pelo usuário.');
        }
        break;
        
      case '4':
      default:
        console.log('\n👋 Saindo sem fazer alterações.');
        break;
    }
    
    // Estatísticas finais
    const totalDepois = await db.collection('cobrancas').countDocuments({});
    console.log(`\n📊 Total de cobranças após a operação: ${totalDepois}`);
    
    if (totalDepois > 0) {
      console.log('\n📋 Amostra das cobranças restantes:');
      const restantes = await db.collection('cobrancas')
        .find({})
        .limit(3)
        .toArray();
      
      restantes.forEach((cobranca, index) => {
        console.log(`${index + 1}. ID: ${cobranca.cobrancaId || cobranca._id}, ` + 
                   `Valor: R$ ${cobranca.valor?.toFixed(2) || 'N/A'}, ` +
                   `Status: ${cobranca.status || 'N/A'}`);
      });
      
      if (totalDepois > 3) {
        console.log(`... e mais ${totalDepois - 3} cobranças`);
      }
    } else {
      console.log('Banco de dados de cobranças vazio.');
    }

  } catch (error) {
    console.error('❌ Erro ao processar operação:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Conexão com o banco fechada');
    rl.close();
  }
}

// Executar o script
limparCobrancas().catch(console.error);