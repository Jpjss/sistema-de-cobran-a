'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Settings, Zap, Check, X, Info } from 'lucide-react';

interface WhatsAppConfig {
  zapiUrl: string;
  zapiToken: string;
  webhookToken: string;
  autoReply: boolean;
  businessHours: string;
  welcomeMessage: string;
  awayMessage: string;
  negociationTemplate: string;
  paymentTemplate: string;
}

export default function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    zapiUrl: '',
    zapiToken: '',
    webhookToken: '',
    autoReply: true,
    businessHours: '08:00-18:00',
    welcomeMessage: 'Olá! 👋 Bem-vindo ao FynApp!\n\nSou seu assistente de cobranças automático.',
    awayMessage: 'Obrigado pelo contato! Nosso horário de atendimento é das 08h às 18h.',
    negociationTemplate: 'Olá! 👋\n\nVi que você quer negociar sua cobrança de *R$ {{valor}}*.\n\n🤝 *Opções disponíveis:*\n• Desconto de 10% para pagamento à vista\n• Parcelamento em até 3x sem juros',
    paymentTemplate: '💳 *Formas de Pagamento Disponíveis*\n\n*PIX* - Instantâneo com desconto de 5%\n*Cartão de Crédito* - Até 12x\n\nValor: *R$ {{valor}}*'
  });
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const testConnection = async () => {
    setTesting(true);
    try {
      // Simular teste de conexão com Z-API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no banco ou arquivo de configuração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular sucesso
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Erro de Conexão
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Info className="h-3 w-3 mr-1" />
            Não Testado
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Configurações WhatsApp
        </h1>
        <p className="text-gray-600 mt-2">
          Configure a integração com Z-API para automação via WhatsApp
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connection">Conexão</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Configuração Z-API
                </span>
                {getStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como configurar:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Acesse <a href="https://z-api.io" target="_blank" className="text-blue-600 underline">z-api.io</a> e crie uma conta</li>
                    <li>Crie uma nova instância do WhatsApp</li>
                    <li>Configure o webhook para: <code className="bg-gray-100 px-1 rounded">https://seu-dominio.com/api/zapi-webhook</code></li>
                    <li>Copie a URL da instância e o token de acesso</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zapiUrl">URL da Instância Z-API</Label>
                  <Input
                    id="zapiUrl"
                    value={config.zapiUrl}
                    onChange={(e) => setConfig({...config, zapiUrl: e.target.value})}
                    placeholder="https://api.z-api.io/instances/SUA_INSTANCIA"
                  />
                </div>

                <div>
                  <Label htmlFor="zapiToken">Token de Acesso</Label>
                  <Input
                    id="zapiToken"
                    type="password"
                    value={config.zapiToken}
                    onChange={(e) => setConfig({...config, zapiToken: e.target.value})}
                    placeholder="Seu token da Z-API"
                  />
                </div>

                <div>
                  <Label htmlFor="webhookToken">Token do Webhook (Segurança)</Label>
                  <Input
                    id="webhookToken"
                    value={config.webhookToken}
                    onChange={(e) => setConfig({...config, webhookToken: e.target.value})}
                    placeholder="Token secreto para validar webhooks"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <Button 
                    onClick={testConnection} 
                    disabled={testing || !config.zapiUrl || !config.zapiToken}
                    variant="outline"
                    className="w-full"
                  >
                    {testing ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>URL do Webhook:</strong> Configure no painel da Z-API:<br />
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    https://seu-dominio.vercel.app/api/zapi-webhook
                  </code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Respostas Automáticas</Label>
                  <p className="text-sm text-gray-600">Ativar respostas automáticas para mensagens recebidas</p>
                </div>
                <Switch
                  checked={config.autoReply}
                  onCheckedChange={(checked) => setConfig({...config, autoReply: checked})}
                />
              </div>

              <div>
                <Label htmlFor="businessHours">Horário de Funcionamento</Label>
                <Input
                  id="businessHours"
                  value={config.businessHours}
                  onChange={(e) => setConfig({...config, businessHours: e.target.value})}
                  placeholder="08:00-18:00"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Formato: HH:MM-HH:MM (fora desse horário será enviada mensagem de ausência)
                </p>
              </div>

              <div>
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                  rows={3}
                  placeholder="Mensagem enviada para novos contatos"
                />
              </div>

              <div>
                <Label htmlFor="awayMessage">Mensagem Fora do Horário</Label>
                <Textarea
                  id="awayMessage"
                  value={config.awayMessage}
                  onChange={(e) => setConfig({...config, awayMessage: e.target.value})}
                  rows={3}
                  placeholder="Mensagem enviada fora do horário de funcionamento"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use as variáveis: <code>{`{{valor}}`}</code>, <code>{`{{nome}}`}</code>, <code>{`{{vencimento}}`}</code>, <code>{`{{dias_atraso}}`}</code>
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="negociationTemplate">Template para Negociação</Label>
                <Textarea
                  id="negociationTemplate"
                  value={config.negociationTemplate}
                  onChange={(e) => setConfig({...config, negociationTemplate: e.target.value})}
                  rows={5}
                  placeholder="Template usado quando cliente quer negociar"
                />
              </div>

              <div>
                <Label htmlFor="paymentTemplate">Template para Pagamento</Label>
                <Textarea
                  id="paymentTemplate"
                  value={config.paymentTemplate}
                  onChange={(e) => setConfig({...config, paymentTemplate: e.target.value})}
                  rows={5}
                  placeholder="Template usado para informar formas de pagamento"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}