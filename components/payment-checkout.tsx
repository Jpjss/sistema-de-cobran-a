"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Smartphone,
  DollarSign,
  Shield
} from "lucide-react";

interface CheckoutProps {
  cobrancaId: string;
  amount: number;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    document: string;
  };
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentOption {
  id: string;
  name: string;
  type: 'pix' | 'credit_card' | 'bank_slip';
  icon: React.ReactNode;
  fee: number;
  description: string;
  enabled: boolean;
}

export function PaymentCheckout({ 
  cobrancaId, 
  amount, 
  description, 
  customerInfo, 
  onPaymentSuccess, 
  onPaymentError 
}: CheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Opções de pagamento disponíveis
  const paymentOptions: PaymentOption[] = [
    {
      id: 'pix',
      name: 'PIX',
      type: 'pix',
      icon: <QrCode className="h-6 w-6" />,
      fee: 0,
      description: 'Transferência instantânea e gratuita',
      enabled: true
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      type: 'credit_card',
      icon: <CreditCard className="h-6 w-6" />,
      fee: 3.4,
      description: 'Parcelamento disponível',
      enabled: true
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotal = (methodId: string) => {
    const method = paymentOptions.find(m => m.id === methodId);
    if (!method) return amount;
    
    const fee = (amount * method.fee) / 100;
    return amount + fee;
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentData(null);
    setPaymentStatus('idle');
  };

  const handlePixPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cobrancaId,
          amount,
          method: 'pix',
          customerInfo
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      setPaymentData(result);
      // Simular geração de QR Code PIX
      const pixData = {
        qrCode: `00020126580014BR.GOV.BCB.PIX0136${cobrancaId}0219${description}5204000053039865802BR5925${customerInfo.name}6009SAO PAULO62070503***6304`,
        copyPaste: `00020126580014BR.GOV.BCB.PIX0136${cobrancaId}0219${description}5204000053039865802BR5925${customerInfo.name}6009SAO PAULO62070503***6304`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      };
      
      setPaymentData({ ...result, ...pixData });
      
      // Iniciar polling para verificar status do pagamento
      startPaymentPolling(result.id);
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setPaymentStatus('error');
      onPaymentError?.(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Aqui seria integrado com Stripe, PagSeguro, etc.
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cobrancaId,
          amount: calculateTotal('credit_card'),
          method: 'credit_card',
          customerInfo
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      // Redirecionar para checkout do provedor
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setPaymentStatus('error');
      onPaymentError?.(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsProcessing(false);
    }
  };

  const startPaymentPolling = (transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/status/${transactionId}`);
        const result = await response.json();
        
        if (result.status === 'completed') {
          clearInterval(pollInterval);
          setPaymentStatus('completed');
          onPaymentSuccess?.(transactionId);
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          setPaymentStatus('error');
          setErrorMessage('Pagamento não foi confirmado');
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Parar polling após 30 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'processing') {
        setPaymentStatus('error');
        setErrorMessage('Tempo limite excedido. Tente novamente.');
      }
    }, 30 * 60 * 1000);
  };

  const copyPixCode = () => {
    if (paymentData?.copyPaste) {
      navigator.clipboard.writeText(paymentData.copyPaste);
      // TODO: Mostrar toast de sucesso
    }
  };

  if (paymentStatus === 'completed') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Pagamento Confirmado!</h3>
          <p className="text-muted-foreground mb-4">
            Seu pagamento de {formatCurrency(amount)} foi processado com sucesso.
          </p>
          <Button onClick={() => window.close()}>Fechar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Checkout Seguro - FynApp</span>
          </CardTitle>
          <CardDescription>
            Complete seu pagamento de forma rápida e segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Descrição:</span>
              <span className="font-medium">{description}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor:</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-medium">{customerInfo.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de método de pagamento */}
      {!selectedMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o método de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentOptions.filter(option => option.enabled).map((option) => (
              <div
                key={option.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleMethodSelect(option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {option.icon}
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(calculateTotal(option.id))}</div>
                    {option.fee > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Taxa: {option.fee}%
                      </div>
                    )}
                    {option.fee === 0 && (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                        Gratuito
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PIX Payment */}
      {selectedMethod === 'pix' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Pagamento via PIX</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!paymentData && (
              <div className="text-center">
                <Button 
                  onClick={handlePixPayment} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Gerando PIX...' : 'Gerar Código PIX'}
                </Button>
              </div>
            )}

            {paymentData && paymentStatus === 'processing' && (
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    PIX gerado! Realize o pagamento em até 30 minutos.
                  </AlertDescription>
                </Alert>

                {/* QR Code simulado */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Código Copia e Cola */}
                <div>
                  <Label>Código PIX - Copia e Cola</Label>
                  <div className="flex space-x-2">
                    <Input 
                      value={paymentData.copyPaste || ''} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={copyPixCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Aguardando confirmação do pagamento...</span>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedMethod('')}>
                    Escolher outro método
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Card Payment */}
      {selectedMethod === 'credit_card' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Pagamento com Cartão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você será redirecionado para o ambiente seguro do processador de pagamentos.
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button 
                onClick={handleCardPayment} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Redirecionando...' : `Pagar ${formatCurrency(calculateTotal('credit_card'))}`}
              </Button>
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={() => setSelectedMethod('')}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {paymentStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}