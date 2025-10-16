// Script para teste direto de envio de e-mail (sem usar a fila)
const nodemailer = require('nodemailer');

// Seu endereço de e-mail para teste
const EMAIL_TESTE = 'jp0886230@gmail.com'; // Use o mesmo email para garantir que funcione
const EMAIL_REMETENTE = 'jp0886230@gmail.com';
const SENHA_APP = 'ajol honi qoqa wabl';

async function testarEnvioEmailDireto() {
  console.log('🚀 Iniciando teste direto de envio de e-mail...');
  console.log(`📧 Tentando enviar para: ${EMAIL_TESTE}`);

  // Criar transportador SMTP com as credenciais
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: EMAIL_REMETENTE,
      pass: SENHA_APP
    }
  });

  try {
    // Verificar conexão com o servidor SMTP
    console.log('🔍 Verificando conexão com servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso!');

    // Preparar e-mail de teste
    const mailOptions = {
      from: `"FynApp Teste" <${EMAIL_REMETENTE}>`,
      to: EMAIL_TESTE,
      subject: '🧪 Teste de Envio Direto - Sistema de Cobrança',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568;">Teste de E-mail FynApp</h2>
          <p>Este é um e-mail de teste <strong>direto</strong> do sistema de cobrança FynApp.</p>
          <p>Se você está recebendo este e-mail, significa que o sistema de envio de e-mails está <strong>funcionando corretamente</strong>!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Detalhes técnicos:</p>
          <ul>
            <li>Data/hora: ${new Date().toLocaleString('pt-BR')}</li>
            <li>Método: Envio direto (sem fila)</li>
            <li>Servidor: smtp.gmail.com</li>
          </ul>
          <p style="font-size: 12px; color: #718096; margin-top: 20px;">
            Este é um e-mail automático, não responda a esta mensagem.
          </p>
        </div>
      `
    };

    // Enviar e-mail
    console.log('📤 Enviando e-mail de teste...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ E-mail enviado com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   - ID: ${info.messageId}`);
    console.log(`   - Aceito por: ${info.accepted}`);
    console.log(`   - Resposta: ${info.response}`);
    
    console.log('\n📱 Por favor, verifique sua caixa de entrada (e a pasta de spam)!');

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    
    // Análise detalhada do erro
    if (error.code === 'EAUTH') {
      console.log('\n⚠️ Erro de autenticação! Possíveis causas:');
      console.log('1. Senha de app incorreta ou expirada');
      console.log('2. Autenticação de dois fatores habilitada sem senha de app');
      console.log('3. Conta com configurações restritivas de segurança');
    } else if (error.code === 'ESOCKET') {
      console.log('\n⚠️ Erro de conexão! Possíveis causas:');
      console.log('1. Firewall ou rede bloqueando a conexão');
      console.log('2. Servidor SMTP incorreto ou indisponível');
    }
    
    console.log('\n📋 Recomendações:');
    console.log('1. Verifique se a senha de app está correta e válida');
    console.log('2. Tente criar uma nova senha de app no Gmail');
    console.log('3. Verifique configurações de segurança da conta Google');
  }
}

// Executa o teste
console.log('='.repeat(60));
console.log('TESTE DIRETO DE ENVIO DE E-MAIL (SEM FILA)');
console.log('='.repeat(60));
console.log('⚠️ IMPORTANTE: Edite o arquivo para usar seu email real antes de executar!');
console.log('='.repeat(60));
testarEnvioEmailDireto().catch(console.error);