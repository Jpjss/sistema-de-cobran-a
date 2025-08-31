import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentConfigService } from '@/lib/payment-providers';
import { initializePIXConfig } from '@/lib/init-pix-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Garantir que a configuração PIX esteja inicializada
    initializePIXConfig();
    
    // Buscar configuração PIX
    const pixConfig = PaymentConfigService.getConfig().methods.find(m => m.id === 'pix' && m.enabled);
    
    if (!pixConfig) {
      return res.status(200).json({
        status: 'error',
        message: 'PIX não encontrado nos métodos',
        methods: PaymentConfigService.getConfig().methods.map(m => ({ id: m.id, enabled: m.enabled }))
      });
    }
    
    if (!pixConfig.config || !pixConfig.config.chave) {
      return res.status(200).json({
        status: 'error',
        message: 'PIX encontrado mas sem configuração de chave',
        pixConfig: pixConfig
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'PIX configurado corretamente',
      pixConfig: {
        id: pixConfig.id,
        enabled: pixConfig.enabled,
        chave: pixConfig.config.chave,
        banco: pixConfig.config.banco,
        agencia: pixConfig.config.agencia,
        conta: pixConfig.config.conta
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar configuração PIX',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}