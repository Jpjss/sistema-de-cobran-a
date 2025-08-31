"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Settings, 
  Save, 
  TestTube,
  AlertTriangle,
  CheckCircle,
  QrCode
} from "lucide-react";
import { defaultPaymentMethods, PaymentMethod, PaymentConfigService } from "@/lib/payment-providers";
import { initializePIXConfig } from "@/lib/init-pix-config";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onUpdate: (methodId: string, updates: Partial<PaymentMethod>) => void;
}

function PaymentMethodCard({ method, onUpdate }: PaymentMethodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState(method.config);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'pix': return <QrCode className="h-5 w-5" />;
      case 'credit_card': return <CreditCard className="h-5 w-5" />;
      case 'debit_card': return <CreditCard className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'banco_central': return 'bg-green-100 text-green-800';
      case 'stripe': return 'bg-purple-100 text-purple-800';
      case 'pagseguro': return 'bg-blue-100 text-blue-800';
      case 'mercadopago': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
  };

  const handleSave = () => {
    onUpdate(method.id, { config: localConfig });
  };

  const isConfigComplete = () => {
    if (method.provider === 'banco_central') {
      return localConfig.chave && localConfig.banco;
    }
    if (method.provider === 'stripe') {
      return localConfig.publicKey && localConfig.secretKey;
    }
    if (method.provider === 'pagseguro') {
      return localConfig.token && localConfig.email;
    }
    if (method.provider === 'mercadopago') {
      return localConfig.accessToken && localConfig.publicKey;
    }
    return false;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getMethodIcon(method.type)}
            <div>
              <CardTitle className="text-lg">{method.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className={getProviderColor(method.provider)}>
                  {method.provider}
                </Badge>
                {method.enabled && isConfigComplete() && (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
                {method.enabled && !isConfigComplete() && (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Configuração Incompleta
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={method.enabled}
              onCheckedChange={(enabled) => onUpdate(method.id, { enabled })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Taxa: {method.fees.percentage}% + R$ {(method.fees.fixed / 100).toFixed(2)}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          {/* Configurações específicas por provedor */}
          <div className="space-y-4">
            {method.provider === 'banco_central' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${method.id}-chave`}>Chave PIX</Label>
                    <Input
                      id={`${method.id}-chave`}
                      value={localConfig.chave || ''}
                      onChange={(e) => handleConfigChange('chave', e.target.value)}
                      placeholder="CNPJ, CPF, e-mail ou chave aleatória"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${method.id}-banco`}>Código do Banco</Label>
                    <Input
                      id={`${method.id}-banco`}
                      value={localConfig.banco || ''}
                      onChange={(e) => handleConfigChange('banco', e.target.value)}
                      placeholder="Ex: 001, 033, 104, 237"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${method.id}-agencia`}>Agência</Label>
                    <Input
                      id={`${method.id}-agencia`}
                      value={localConfig.agencia || ''}
                      onChange={(e) => handleConfigChange('agencia', e.target.value)}
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${method.id}-conta`}>Conta</Label>
                    <Input
                      id={`${method.id}-conta`}
                      value={localConfig.conta || ''}
                      onChange={(e) => handleConfigChange('conta', e.target.value)}
                      placeholder="00000-0"
                    />
                  </div>
                </div>
              </>
            )}

            {method.provider === 'stripe' && (
              <>
                <div>
                  <Label htmlFor={`${method.id}-publicKey`}>Public Key</Label>
                  <Input
                    id={`${method.id}-publicKey`}
                    value={localConfig.publicKey || ''}
                    onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor={`${method.id}-secretKey`}>Secret Key</Label>
                  <Input
                    id={`${method.id}-secretKey`}
                    type="password"
                    value={localConfig.secretKey || ''}
                    onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                    placeholder="sk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor={`${method.id}-webhookSecret`}>Webhook Secret (Opcional)</Label>
                  <Input
                    id={`${method.id}-webhookSecret`}
                    type="password"
                    value={localConfig.webhookSecret || ''}
                    onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                    placeholder="whsec_..."
                  />
                </div>
              </>
            )}

            {method.provider === 'pagseguro' && (
              <>
                <div>
                  <Label htmlFor={`${method.id}-email`}>Email PagSeguro</Label>
                  <Input
                    id={`${method.id}-email`}
                    type="email"
                    value={localConfig.email || ''}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor={`${method.id}-token`}>Token</Label>
                  <Input
                    id={`${method.id}-token`}
                    type="password"
                    value={localConfig.token || ''}
                    onChange={(e) => handleConfigChange('token', e.target.value)}
                    placeholder="Token de integração"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={localConfig.sandbox || false}
                    onCheckedChange={(sandbox) => handleConfigChange('sandbox', sandbox.toString())}
                  />
                  <Label>Modo Sandbox (Teste)</Label>
                </div>
              </>
            )}

            {method.provider === 'mercadopago' && (
              <>
                <div>
                  <Label htmlFor={`${method.id}-accessToken`}>Access Token</Label>
                  <Input
                    id={`${method.id}-accessToken`}
                    type="password"
                    value={localConfig.accessToken || ''}
                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                    placeholder="APP_USR-..."
                  />
                </div>
                <div>
                  <Label htmlFor={`${method.id}-publicKey`}>Public Key</Label>
                  <Input
                    id={`${method.id}-publicKey`}
                    value={localConfig.publicKey || ''}
                    onChange={(e) => handleConfigChange('publicKey', e.target.value)}
                    placeholder="APP_USR-..."
                  />
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implementar teste */}}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Testar Configuração
              </Button>
              
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function PaymentMethodsConfig() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Carrega configurações salvas na inicialização
  useEffect(() => {
    // Inicializa PIX se necessário
    initializePIXConfig();
    
    // Carrega configurações atualizadas
    const config = PaymentConfigService.getConfig();
    setMethods(config.methods);
  }, []);

  const handleMethodUpdate = (methodId: string, updates: Partial<PaymentMethod>) => {
    setMethods(prev => prev.map(method => 
      method.id === methodId 
        ? { ...method, ...updates }
        : method
    ));
    
    // Atualizar no serviço de configuração
    PaymentConfigService.updateMethodConfig(methodId, updates);
  };

  const getTotalEnabledMethods = () => {
    return methods.filter(m => m.enabled).length;
  };

  const getEstimatedMonthlyFees = () => {
    // Simulação baseada em R$ 10.000 de transações mensais
    const monthlyVolume = 10000;
    const averageFees = methods
      .filter(m => m.enabled)
      .reduce((acc, method) => {
        const fees = PaymentConfigService.calculateFees(monthlyVolume / methods.length, method.id);
        return acc + fees;
      }, 0);
    
    return averageFees;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Métodos de Pagamento</h2>
        <p className="text-muted-foreground">
          Configure os métodos de pagamento para receber suas cobranças online
        </p>
      </div>

      {/* Resumo */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalEnabledMethods()}</div>
              <div className="text-sm text-muted-foreground">Métodos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {getEstimatedMonthlyFees().toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Taxas Estimadas/Mês*</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {methods.filter(m => m.enabled && m.provider === 'banco_central').length > 0 ? '0%' : '~4%'}
              </div>
              <div className="text-sm text-muted-foreground">Taxa Média</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Baseado em R$ 10.000 de transações mensais
          </p>
        </CardContent>
      </Card>

      {/* Alert de recomendação */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <strong>Recomendação:</strong> O PIX é o método mais econômico para seus clientes brasileiros (sem taxas). 
          Combine com cartão de crédito para maximizar suas conversões.
        </AlertDescription>
      </Alert>

      {/* Lista de métodos */}
      <div className="space-y-4">
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            onUpdate={handleMethodUpdate}
          />
        ))}
      </div>

      {/* Configurações avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações Avançadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">URL de Webhook</Label>
            <Input
              id="webhook-url"
              value={`${window.location.origin}/api/webhooks/payment`}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use esta URL nos seus provedores de pagamento para receber notificações automáticas
            </p>
          </div>
          
          <div>
            <Label htmlFor="return-url">URL de Retorno (Sucesso)</Label>
            <Input
              id="return-url"
              defaultValue="/payment/success"
              placeholder="/payment/success"
            />
          </div>
          
          <div>
            <Label htmlFor="cancel-url">URL de Cancelamento</Label>
            <Input
              id="cancel-url"
              defaultValue="/payment/cancel"
              placeholder="/payment/cancel"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}