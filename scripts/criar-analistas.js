// Script para criar usuários analistas no banco de dados
// Executar: node scripts/criar-analistas.js

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/sistema-cobranca";

async function criarAnalistas() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Verificar se já existem usuários
    const count = await usersCollection.countDocuments();
    
    if (count > 0) {
      console.log(`ℹ️  Já existem ${count} usuário(s) no banco. Deseja criar mais? (y/n)`);
      // Em produção, usar readline para input do usuário
    }

    // Criar analistas de exemplo
    const analistas = [
      {
        name: "Weder Santos",
        email: "weder@empresa.com",
        password: await bcrypt.hash("senha123", 10),
        role: "analista",
        valorHora: 150.0,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "João Silva",
        email: "joao@empresa.com",
        password: await bcrypt.hash("senha123", 10),
        role: "analista",
        valorHora: 120.0,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Maria Oliveira",
        email: "maria@empresa.com",
        password: await bcrypt.hash("senha123", 10),
        role: "analista",
        valorHora: 180.0,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Administrador",
        email: "admin@empresa.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        valorHora: 200.0,
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('\n📝 Criando analistas...\n');

    for (const analista of analistas) {
      // Verificar se já existe
      const exists = await usersCollection.findOne({ email: analista.email });
      
      if (exists) {
        console.log(`⚠️  Analista ${analista.name} (${analista.email}) já existe`);
        continue;
      }

      const result = await usersCollection.insertOne(analista);
      console.log(`✅ Criado: ${analista.name} - ${analista.email} - R$ ${analista.valorHora}/h`);
      console.log(`   ID: ${result.insertedId}`);
    }

    console.log('\n✅ Processo concluído!');
    console.log('\n📋 Resumo:');
    const totalUsers = await usersCollection.countDocuments();
    const totalAnalistas = await usersCollection.countDocuments({ role: 'analista' });
    const totalAdmins = await usersCollection.countDocuments({ role: 'admin' });
    
    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Analistas: ${totalAnalistas}`);
    console.log(`   Administradores: ${totalAdmins}`);

    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Email: weder@empresa.com | Senha: senha123');
    console.log('   Email: admin@empresa.com | Senha: admin123');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Conexão fechada');
  }
}

// Executar
criarAnalistas();
