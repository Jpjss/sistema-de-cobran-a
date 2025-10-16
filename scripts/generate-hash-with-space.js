const bcrypt = require('bcryptjs');

const senhaComEspaco = ' jp22032006';

bcrypt.hash(senhaComEspaco, 10).then(hash => {
  console.log('\n🔐 Novo hash para a senha " jp22032006" (COM espaço):');
  console.log(hash);
  console.log('\n✅ Copie esse hash e use no arquivo lib/auth.ts\n');
});
