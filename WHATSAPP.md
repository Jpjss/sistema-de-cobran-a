# 📱 Sistema WhatsApp Z-API - FynApp

Integração completa do WhatsApp via Z-API para automação de cobranças e atendimento ao cliente.

## 🚀 Funcionalidades Implementadas

### ✅ Webhook Inteligente
- **Endpoint**: `/api/zapi-webhook`
- **Segurança**: Token de verificação configurável
- **Processamento**: Mensagens, status de entrega, eventos
- **Logging**: Rastreamento completo de eventos

### ✅ Automação Inteligente
- **Detecção de Intenções**: Negociação, pagamento, dúvidas
- **Respostas Automáticas**: Baseadas no contexto da conversa
- **Horário Comercial**: Mensagens automáticas fora do horário
- **Templates Personalizáveis**: Mensagens dinâmicas com variáveis

### ✅ Gerenciamento de Conversas
- **Interface Visual**: Chat em tempo real
- **Status**: Ativo, Pendente, Resolvido
- **Tags**: Classificação automática de conversas
- **Histórico**: Todas as mensagens salvas no MongoDB

### ✅ Integração com Cobranças
- **Busca Automática**: Localiza cobranças por telefone
- **Informações Dinâmicas**: Valor, vencimento, dias de atraso
- **Opções de Pagamento**: PIX, cartão, parcelamento
- **Negociação**: Fluxos automáticos para acordos

## 🛠️ Configuração

### 1. Z-API Setup
1. Acesse https://z-api.io
2. Crie uma conta e uma nova instância
3. Configure o webhook: `https://seu-dominio.com/api/zapi-webhook`
4. Obtenha URL da instância e token

### 2. Variáveis de Ambiente
```bash
# Z-API Configuration
ZAPI_URL=https://api.z-api.io/instances/SUA_INSTANCIA
ZAPI_TOKEN=seu-token-z-api-aqui
ZAPI_WEBHOOK_TOKEN=seu-token-webhook-secreto

# MongoDB (para salvar conversas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### 3. Configuração no Sistema
- Acesse `/whatsapp/settings`
- Configure URL da instância e tokens
- Teste a conexão
- Personalize templates de mensagens

## 📊 Estrutura de Dados

### Conversas (MongoDB)
```javascript
{
  phone: "5511999999999",
  customerName: "João Silva",
  messages: [
    {
      messageId: "msg_123",
      body: "Olá, quero negociar",
      fromMe: false,
      timestamp: 1635724800,
      createdAt: Date
    }
  ],
  lastInteraction: Date,
  status: "active", // active, pending, resolved
  cobrancaId: "ObjectId",
  tags: ["negociar", "tem_cobranca"]
}
```

### Eventos Z-API
```javascript
{
  event: "MESSAGE",
  phone: "5511999999999",
  message: {
    body: "Mensagem recebida",
    messageId: "msg_123",
    fromMe: false,
    timestamp: 1635724800
  }
}
```

## 🤖 Fluxos de Automação

### 1. Nova Mensagem
```
Mensagem Recebida → Detectar Intenção → Buscar Cobrança → Resposta Automática
```

### 2. Detecção de Intenções
- **Negociar**: "negociar", "parcela", "desconto", "acordo"
- **Pagamento**: "pagar", "pix", "cartão", "boleto"
- **Dúvida**: "ajuda", "dúvida", "como", "explicar"

### 3. Respostas Automáticas
```javascript
// Exemplo: Cliente quer negociar
"Olá! 👋 Vi que você quer negociar sua cobrança de R$ 150,00.

🤝 Opções disponíveis:
• Desconto de 10% para pagamento à vista
• Parcelamento em até 3x sem juros

Digite DESCONTO ou PARCELAR para mais detalhes."
```

## 📱 Interface de Gerenciamento

### Dashboard WhatsApp (`/whatsapp`)
- **Lista de Conversas**: Filtros por status
- **Chat Interface**: Resposta manual
- **Status Management**: Ativo, Pendente, Resolvido
- **Tags Automáticas**: Classificação de conversas

### Configurações (`/whatsapp/settings`)
- **Conexão Z-API**: URL, tokens, teste
- **Automação**: Horários, respostas automáticas
- **Templates**: Personalização de mensagens

## 🚀 APIs Disponíveis

### 1. Webhook Z-API
```
POST /api/zapi-webhook
Content-Type: application/json
X-ZAPI-Token: seu-token-webhook

{
  "event": "MESSAGE",
  "phone": "5511999999999",
  "message": {
    "body": "Mensagem do cliente"
  }
}
```

### 2. Gerenciamento de Conversas
```
GET /api/whatsapp/conversations?status=active
POST /api/whatsapp/conversations (enviar mensagem)
PUT /api/whatsapp/conversations (atualizar status)
```

## 🎯 Palavras-chave Reconhecidas

### Negociação
- negociar, parcela, desconto, acordo, parcelar, dividir

### Pagamento
- pagar, pagamento, pix, cartão, boleto, transferir

### Dúvidas
- ajuda, dúvida, como, não entendi, explicar

### Comandos
- DESCONTO, PARCELAR, PIX, SUPORTE, COBRANÇA

## 📋 Checklist de Implementação

### ✅ Backend
- [x] Webhook Z-API implementado
- [x] Detecção de intenções
- [x] Respostas automáticas
- [x] Integração MongoDB
- [x] API de conversas
- [x] Segurança com tokens

### ✅ Frontend
- [x] Interface de chat
- [x] Gerenciamento de conversas
- [x] Configurações Z-API
- [x] Templates personalizáveis
- [x] Status e tags

### 🔄 Próximos Passos
- [ ] Métricas e analytics
- [ ] Integração com CRM
- [ ] Chatbot com IA
- [ ] Envio de mídias
- [ ] Campanhas em massa

## 🎉 Resultado

Sistema completo de WhatsApp automatizado que:
- ✅ Recebe mensagens via webhook
- ✅ Detecta intenções automaticamente
- ✅ Responde baseado no contexto
- ✅ Integra com sistema de cobranças
- ✅ Interface de gerenciamento completa
- ✅ Configuração flexível e personalizável

**Agora seus clientes podem negociar e pagar via WhatsApp de forma totalmente automatizada!** 🚀📱