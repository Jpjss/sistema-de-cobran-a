// Script para atualizar o número da conta PIX no sistema
// Executa via console do navegador para atualizar imediatamente

console.log('🔄 Atualizando número da conta PIX...');

// Carrega configuração atual
let config = JSON.parse(localStorage.getItem('payment-config') || '{}');

// Se não existe configuração, cria uma nova
if (!config.methods) {
    config = {
        methods: [
            {
                id: 'pix',
                name: 'PIX',
                type: 'pix',
                provider: 'banco_central',
                enabled: true,
                config: {
                    chave: 'jp0886230@gmail.com',
                    banco: '260',
                    agencia: '0001',
                    conta: '705640198-7'
                },
                fees: { percentage: 0, fixed: 0 }
            }
        ]
    };
} else {
    // Atualiza apenas a conta PIX
    const pixMethod = config.methods.find(m => m.id === 'pix');
    if (pixMethod) {
        pixMethod.config.conta = '705640198-7';
        console.log('✅ Conta PIX atualizada:', pixMethod.config.conta);
    } else {
        console.log('⚠️ Método PIX não encontrado na configuração');
    }
}

// Salva configuração atualizada
localStorage.setItem('payment-config', JSON.stringify(config));

console.log('✅ Configuração PIX atualizada com sucesso!');
console.log('📋 Dados PIX atuais:');
console.log('   - Chave PIX:', config.methods.find(m => m.id === 'pix')?.config.chave);
console.log('   - Banco:', config.methods.find(m => m.id === 'pix')?.config.banco);
console.log('   - Agência:', config.methods.find(m => m.id === 'pix')?.config.agencia);
console.log('   - Conta:', config.methods.find(m => m.id === 'pix')?.config.conta);

// Recarrega a página para aplicar as mudanças
console.log('🔄 Recarregando página em 2 segundos...');
setTimeout(() => {
    window.location.reload();
}, 2000);