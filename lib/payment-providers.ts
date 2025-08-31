/**
 * Configurações e integrações dos provedores de pagamento
 * Suporte para PIX, Stripe, PagSeguro, Mercado Pago
 */

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'pix_copia_cola';
  provider: string;
  enabled: boolean;
  config: Record<string, any>;
  fees: {
    percentage: number;
    fixed: number; // em centavos
  };
}

export interface PaymentConfig {
  methods: PaymentMethod[];
  webhookSecret?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

// Configurações padrão dos métodos de pagamento
export const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'pix',
    name: 'PIX',
    type: 'pix',
    provider: 'banco_central',
    enabled: true,
    config: {
      chave: process.env.PIX_KEY || '',
      banco: process.env.BANK_CODE || '',
      agencia: process.env.BANK_AGENCY || '',
      conta: process.env.BANK_ACCOUNT || '705640198-7',
    },
    fees: { percentage: 0, fixed: 0 }
  },
  {
    id: 'stripe_card',
    name: 'Cartão de Crédito/Débito',
    type: 'credit_card',
    provider: 'stripe',
    enabled: false,
    config: {
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    fees: { percentage: 3.4, fixed: 39 } // Taxas típicas do Stripe
  },
  {
    id: 'pagseguro_all',
    name: 'PagSeguro (Todos os Métodos)',
    type: 'credit_card',
    provider: 'pagseguro',
    enabled: false,
    config: {
      token: process.env.PAGSEGURO_TOKEN || '',
      email: process.env.PAGSEGURO_EMAIL || '',
      sandbox: process.env.NODE_ENV !== 'production',
    },
    fees: { percentage: 4.99, fixed: 0 }
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    type: 'credit_card',
    provider: 'mercadopago',
    enabled: false,
    config: {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    },
    fees: { percentage: 4.49, fixed: 0 }
  }
];

// Service para gerenciar configurações de pagamento
export class PaymentConfigService {
  private static config: PaymentConfig = {
    methods: defaultPaymentMethods,
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    returnUrl: process.env.PAYMENT_RETURN_URL || '/payment/success',
    cancelUrl: process.env.PAYMENT_CANCEL_URL || '/payment/cancel'
  };

  static getConfig(): PaymentConfig {
    // Carrega configurações do localStorage se disponível
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('payment-config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          this.config = { ...this.config, ...parsed };
        } catch (e) {
          console.warn('Erro ao carregar configurações de pagamento do localStorage');
        }
      }
    }
    return this.config;
  }

  static getEnabledMethods(): PaymentMethod[] {
    return this.getConfig().methods.filter(method => method.enabled);
  }

  static getMethodByProvider(provider: string): PaymentMethod | null {
    return this.getConfig().methods.find(method => 
      method.provider === provider && method.enabled
    ) || null;
  }

  static updateMethodConfig(methodId: string, config: Partial<PaymentMethod>): boolean {
    const methodIndex = this.config.methods.findIndex(m => m.id === methodId);
    if (methodIndex === -1) return false;

    this.config.methods[methodIndex] = {
      ...this.config.methods[methodIndex],
      ...config
    };

    // Salva configurações no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('payment-config', JSON.stringify(this.config));
      } catch (e) {
        console.warn('Erro ao salvar configurações de pagamento no localStorage');
      }
    }

    return true;
  }

  static calculateFees(amount: number, methodId: string): number {
    const method = this.config.methods.find(m => m.id === methodId);
    if (!method) return 0;

    const percentageFee = (amount * method.fees.percentage) / 100;
    const fixedFee = method.fees.fixed / 100; // convertendo centavos para reais
    
    return percentageFee + fixedFee;
  }

  static getNetAmount(amount: number, methodId: string): number {
    const fees = this.calculateFees(amount, methodId);
    return amount - fees;
  }
}

// Tipos para transações
export interface PaymentTransaction {
  id: string;
  cobrancaId: string;
  amount: number;
  fees: number;
  netAmount: number;
  method: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  providerTransactionId?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  checkoutUrl?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

// Interface para provedores de pagamento
export interface PaymentProvider {
  name: string;
  createPayment(amount: number, description: string, metadata?: any): Promise<PaymentTransaction>;
  checkPaymentStatus(transactionId: string): Promise<PaymentTransaction>;
  processWebhook(payload: any, signature?: string): Promise<PaymentTransaction | null>;
}