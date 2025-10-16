// Script para testar a fila de emails - Versão acelerada
const { EmailQueue } = require('../lib/email-queue');

// Criar uma nova instância da fila com processamento acelerado
class FastEmailQueue extends EmailQueue {
  constructor() {
    super();
  }

  // Sobrescrever o método start para processar mais frequentemente
  start() {
    if (this.processing) {
      console.log("📬 Fila de e-mails já está processando");
      return;
    }

    console.log("🚀 Iniciando processamento rápido da fila de e-mails...");
    this.processing = true;
    
    // Processar a cada 10 segundos (muito mais rápido para testes)
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 10000); // 10 segundos
    
    // Processar imediatamente
    this.processQueue();
  }
}

// Endereço de email para teste
const EMAIL_TESTE = 'seu-email@exemplo.com'; // Substitua pelo seu email real

async function testarFilaAcelerada() {
  console.log('🚀 Iniciando teste da fila de emails em modo acelerado...');
  
  // Criar instância da fila acelerada
  const fastQueue = new FastEmailQueue();
  
  // Iniciar o processamento
  fastQueue.start();
  
  console.log('⏱️ Fila iniciada com processamento a cada 10 segundos!');
  
  // Adicionar diferentes tipos de emails à fila
  await fastQueue.addJob({
    type: 'test',
    email: EMAIL_TESTE,
    customerName: 'Cliente de Teste',
    data: {},
    maxAttempts: 3
  });
  
  console.log('✅ Email de teste adicionado à fila');
  
  // Adicionar um lembrete de cobrança
  await fastQueue.addReminderJob(
    EMAIL_TESTE,
    'Cliente de Teste',
    {
      description: 'Assinatura mensal de serviço',
      amount: 99.90,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Amanhã
    }
  );
  
  console.log('✅ Lembrete de cobrança adicionado à fila');
  
  // Adicionar um alerta de atraso
  await fastQueue.addOverdueJob(
    EMAIL_TESTE,
    'Cliente de Teste',
    {
      description: 'Assinatura mensal de serviço',
      amount: 99.90,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 dias atrás
    }
  );
  
  console.log('✅ Alerta de atraso adicionado à fila');
  
  console.log('\n📱 Aguarde até 30 segundos e verifique sua caixa de entrada (e a pasta de spam)!');
  console.log('⏳ A fila continuará processando emails a cada 10 segundos...');
  
  // Manter script rodando por 2 minutos
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  // Parar a fila
  fastQueue.stop();
  console.log('✅ Teste concluído! Fila parada.');
}

// Executa o teste
console.log('='.repeat(60));
console.log('TESTE ACELERADO DA FILA DE EMAILS');
console.log('='.repeat(60));
console.log('⚠️ IMPORTANTE: Edite o arquivo para usar seu email real antes de executar!');
console.log('='.repeat(60));
testarFilaAcelerada().catch(console.error);