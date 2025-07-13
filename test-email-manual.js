// Manual Email Test Script
// Execute no terminal: node test-email-manual.js

const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔧 Iniciando teste manual de e-mail...');
  
  // Configuração SMTP
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'jp0886230@gmail.com',
      pass: 'ajol honi qoqa wabl'
    }
  });

  try {
    // Verificar conexão
    console.log('🔍 Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');

    // Enviar e-mail de teste
    console.log('📤 Enviando e-mail de teste...');
    const info = await transporter.sendMail({
      from: '"FynApp Teste" <jp0886230@gmail.com>',
      to: 'jp0886230@gmail.com',
      subject: '🧪 Teste Manual do Sistema',
      html: `
        <h2>🎉 Teste Bem-sucedido!</h2>
        <p>Se você está lendo isto, a configuração SMTP está funcionando!</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> ✅ Sistema Operacional</p>
      `
    });

    console.log('✅ E-mail enviado!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Problema de autenticação - verifique:');
      console.log('   1. Senha de app do Gmail');
      console.log('   2. Verificação em 2 etapas ativa');
      console.log('   3. "Acesso a apps menos seguros" (se não usar 2FA)');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('🌐 Problema de conexão - verifique:');
      console.log('   1. Conexão com internet');
      console.log('   2. Firewall bloqueando porta 587');
      console.log('   3. Proxy corporativo');
    }
  }
}

testEmail();
