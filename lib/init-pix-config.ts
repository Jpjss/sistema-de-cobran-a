// Pre-configuração PIX para o sistema FynApp
// Este arquivo será executado uma vez para configurar o PIX automaticamente

import { PaymentConfigService } from '@/lib/payment-providers';

export function initializePIXConfig() {
  // Configurações PIX que foram inseridas durante os testes
  const pixConfig = {
    enabled: true,
    config: {
      chave: 'jp0886230@gmail.com',
      banco: '260',
      agencia: '0001',
      conta: '705640198-7'
    }
  };

  // Atualiza a configuração PIX
  PaymentConfigService.updateMethodConfig('pix', pixConfig);
  
  console.log('✅ Configuração PIX inicializada com sucesso');
  console.log('Chave PIX:', pixConfig.config.chave);
  console.log('Banco:', pixConfig.config.banco);
  console.log('Agência:', pixConfig.config.agencia);
  console.log('Conta:', pixConfig.config.conta);
}

// Auto-inicializar se estivermos no cliente
if (typeof window !== 'undefined') {
  // Executa apenas uma vez ou se as configurações estão vazias
  const savedConfig = localStorage.getItem('payment-config');
  if (!savedConfig) {
    initializePIXConfig();
  }
} else {
  // No servidor, sempre inicializar para garantir que esteja disponível
  initializePIXConfig();
}