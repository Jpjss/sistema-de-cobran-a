// Script para verificar as configurações SMTP
const nodemailer = require('nodemailer');

async function verificarConfiguracoesEmail() {
  console.log('🔍 Verificando configurações de email do sistema...');
  
  // Verificar variáveis de ambiente
  console.log('\n📋 Configurações Gmail:');
  const smtpUser = process.env.GMAIL_SMTP_USER || 'jp0886230@gmail.com';
  const smtpPass = process.env.GMAIL_SMTP_PASSWORD || 'ajol honi qoqa wabl';
  
  console.log(`SMTP Host: smtp.gmail.com`);
  console.log(`SMTP Port: 587`);
  console.log(`SMTP User: ${smtpUser}`);
  console.log(`SMTP Pass: ${'*'.repeat(smtpPass.length)}`);
  
  // Tentar verificar a conexão
  try {
    console.log('\n🔄 Testando conexão com servidor SMTP...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    const verificacao = await transporter.verify();
    
    console.log('✅ Conexão com servidor SMTP bem-sucedida!');
    console.log('✅ Autenticação aceita!');
    console.log('✅ Tudo pronto para enviar emails!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar conexão SMTP:', error.message);
    
    // Análise mais detalhada do erro
    if (error.code === 'EAUTH') {
      console.log('\n🔐 PROBLEMA DE AUTENTICAÇÃO:');
      console.log('1. A senha de aplicativo pode estar incorreta ou expirada');
      console.log('2. A verificação em duas etapas pode estar habilitada sem uma senha de aplicativo');
      console.log('3. A conta Google pode ter políticas de segurança restritivas');
      
      console.log('\n🛠️ SOLUÇÃO RECOMENDADA:');
      console.log('1. Acesse: https://myaccount.google.com/security');
      console.log('2. Habilite a verificação em duas etapas se ainda não estiver');
      console.log('3. Crie uma nova senha de aplicativo específica para este sistema');
      console.log('4. Atualize o arquivo .env com a nova senha');
    } else {
      console.log('\n⚠️ OUTROS PROBLEMAS POSSÍVEIS:');
      console.log('1. Firewall ou rede bloqueando a conexão');
      console.log('2. Servidor SMTP incorreto ou indisponível');
      console.log('3. Restrições da conta de email');
    }
  }
  
  console.log('\n📝 RESUMO:');
  console.log('• A fila processa emails a cada 1 HORA por padrão');
  console.log('• Os lembretes diários são enviados apenas UMA VEZ por dia');
  console.log('• Cada tipo de email tem limitações de frequência para evitar spam');
  console.log('• Para testes, use os scripts teste-email-direto.js ou teste-fila-acelerada.js');
}

// Executar a verificação
console.log('='.repeat(60));
console.log('DIAGNÓSTICO DE CONFIGURAÇÃO DE EMAIL');
console.log('='.repeat(60));
verificarConfiguracoesEmail().catch(console.error);