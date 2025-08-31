'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestePIX() {
  const [valor, setValor] = useState('100.50');
  const [nomeCliente, setNomeCliente] = useState('Cliente Teste');
  const [codigoPIX, setCodigoPIX] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const testarPIX = async () => {
    setCarregando(true);
    setErro('');
    setCodigoPIX('');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cobrancaId: `test_${Date.now()}`,
          amount: parseFloat(valor),
          method: 'pix',
          customerInfo: {
            name: nomeCliente,
            email: 'teste@exemplo.com'
          }
        })
      });

      const data = await response.json();

      if (data.success && data.paymentCode) {
        setCodigoPIX(data.paymentCode);
      } else {
        setErro(data.message || 'Erro ao gerar código PIX');
      }
    } catch (error) {
      setErro('Erro de conexão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setCarregando(false);
    }
  };

  const analisarCodigo = (codigo: string) => {
    if (!codigo) return null;

    const analise = {
      tamanho: codigo.length,
      versao: codigo.substring(0, 5),
      temBCB: codigo.includes('BR.GOV.BCB.PIX'),
      temMoeda: codigo.includes('5303986'),
      crc: codigo.slice(-4),
      estruturaOK: codigo.startsWith('00020')
    };

    return analise;
  };

  const analise = analisarCodigo(codigoPIX);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Gerador PIX EMV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Valor (R$)</label>
            <Input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="100.50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
            <Input
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <Button 
            onClick={testarPIX} 
            disabled={carregando}
            className="w-full"
          >
            {carregando ? 'Gerando...' : 'Gerar Código PIX'}
          </Button>

          {erro && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                ❌ {erro}
              </AlertDescription>
            </Alert>
          )}

          {codigoPIX && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ Código PIX gerado com sucesso!
                </AlertDescription>
              </Alert>

              <div>
                <label className="block text-sm font-medium mb-2">Código PIX EMV:</label>
                <textarea
                  value={codigoPIX}
                  readOnly
                  rows={4}
                  className="w-full p-2 border rounded font-mono text-xs"
                />
              </div>

              {analise && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Análise do Código</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Tamanho: <span className="font-mono">{analise.tamanho} chars</span></div>
                      <div>Versão: <span className="font-mono">{analise.versao}</span></div>
                      <div>Estrutura: {analise.estruturaOK ? '✅' : '❌'}</div>
                      <div>BCB PIX: {analise.temBCB ? '✅' : '❌'}</div>
                      <div>Moeda BRL: {analise.temMoeda ? '✅' : '❌'}</div>
                      <div>CRC16: <span className="font-mono">{analise.crc}</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-xs text-gray-600">
                <p><strong>Como testar:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie o código PIX gerado</li>
                  <li>Abra o app do seu banco</li>
                  <li>Escolha "PIX" → "Pagar"</li>
                  <li>Selecione "PIX Copia e Cola"</li>
                  <li>Cole o código e confirme se o valor aparece corretamente</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}