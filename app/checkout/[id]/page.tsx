"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PaymentCheckout } from '@/components/payment-checkout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CobrancaData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerDocument?: string;
  amount: number;
  description: string;
  dueDate: string;
  status: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const cobrancaId = params?.id as string;
  
  const [cobranca, setCobranca] = useState<CobrancaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (cobrancaId) {
      fetchCobranca();
    }
  }, [cobrancaId]);

  const fetchCobranca = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da cobrança
      const response = await fetch(`/api/cobrancas/${cobrancaId}`);
      
      if (!response.ok) {
        throw new Error('Cobrança não encontrada');
      }
      
      const data = await response.json();
      
      // Verificar se a cobrança já foi paga
      if (data.status === 'paid' || data.status === 'pago') {
        setError('Esta cobrança já foi paga.');
        return;
      }
      
      setCobranca(data);
      
    } catch (error) {
      console.error('Erro ao buscar cobrança:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar cobrança');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('✅ Pagamento realizado com sucesso:', transactionId);
    
    // Atualizar status da cobrança
    fetch(`/api/cobrancas/${cobrancaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'pago',
        dataPagamento: new Date().toISOString(),
        transactionId 
      })
    });
    
    // Mostrar mensagem de sucesso (já tratado no componente PaymentCheckout)
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Erro no pagamento:', error);
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !cobranca) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Cobrança não encontrada'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <PaymentCheckout
          cobrancaId={cobranca.id}
          amount={cobranca.amount}
          description={cobranca.description}
          customerInfo={{
            name: cobranca.customerName,
            email: cobranca.customerEmail,
            document: cobranca.customerDocument || ''
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </div>
    </div>
  );
}