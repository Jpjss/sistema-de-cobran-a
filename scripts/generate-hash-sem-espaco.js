const bcrypt = require('bcryptjs');

async function gerarHashSemEspaco() {
  const senhaSemEspaco = 'jp22032006';
  const hash = await bcrypt.hash(senhaSemEspaco, 10);
  
  console.log('\n🔐 Hash gerado para senha SEM espaço:');
  console.log('Senha:', senhaSemEspaco);
  console.log('Hash:', hash);
  console.log('\n✅ Use este hash no arquivo lib/auth.ts para login sem espaço\n');
}

gerarHashSemEspaco();
