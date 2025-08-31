// CÓDIGO PARA EXECUTAR NO CONSOLE DO NAVEGADOR
// Copie e cole este código no console (F12 → Console)

console.log('🔄 Atualizando conta PIX para 705640198-7...');

// Busca configuração atual ou cria nova
let config = JSON.parse(localStorage.getItem('payment-config') || '{"methods":[]}');

// Encontra ou cria método PIX
let pixMethod = config.methods.find(m => m.id === 'pix');
if (!pixMethod) {
    pixMethod = {
        id: 'pix',
        name: 'PIX',
        type: 'pix',
        provider: 'banco_central',
        enabled: true,
        config: {},
        fees: { percentage: 0, fixed: 0 }
    };
    config.methods.push(pixMethod);
}

// Atualiza configuração PIX
pixMethod.config = {
    chave: 'jp0886230@gmail.com',
    banco: '260',
    agencia: '0001',
    conta: '705640198-7'
};
pixMethod.enabled = true;

// Salva e recarrega
localStorage.setItem('payment-config', JSON.stringify(config));
console.log('✅ Conta PIX atualizada para:', pixMethod.config.conta);
console.log('🔄 Recarregando página...');
window.location.reload();