# 🎯 Sistema de Atendimento por Tempo

Sistema integrado de controle de atendimentos com cronômetro, que gera cobranças automaticamente ao finalizar.

## 📋 Índice

- [Características](#características)
- [Instalação](#instalação)
- [Estrutura de Dados](#estrutura-de-dados)
- [APIs Disponíveis](#apis-disponíveis)
- [Como Usar](#como-usar)
- [Fluxo de Trabalho](#fluxo-de-trabalho)
- [Integração com Sistema de Cobranças](#integração)

---

## ✨ Características

✅ **Cronômetro em tempo real** - Controle preciso do tempo de atendimento  
✅ **Pausar/Retomar** - Flexibilidade durante o atendimento  
✅ **Cálculo automático** - Tempo e valor calculados automaticamente  
✅ **Criação automática de cobrança** - Sem ação manual necessária  
✅ **Integração total** - Dispara emails, atualiza relatórios e dashboard  
✅ **Rastreabilidade** - Vínculo entre atendimento e cobrança  
✅ **Multi-analista** - Suporta múltiplos analistas com valores/hora diferentes  

---

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install
# ou
pnpm install
```

### 2. Atualizar o banco de dados

```bash
# Gerar cliente Prisma com novos modelos
npx prisma generate

# (Opcional) Criar analistas de exemplo
node scripts/criar-analistas.js
```

### 3. Verificar variáveis de ambiente

```env
DATABASE_URL="mongodb://..."
```

### 4. Iniciar o servidor

```bash
npm run dev
# ou
pnpm dev
```

### 5. Acessar a página

```
http://localhost:3000/atendimentos
```

---

## 📊 Estrutura de Dados

### Modelo `AtendimentoTempo`

```prisma
model AtendimentoTempo {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  customerId    String    @db.ObjectId
  analistaId    String    @db.ObjectId
  
  inicio        DateTime
  fim           DateTime?
  tempoMinutos  Int?
  valorHora     Float
  valorTotal    Float?
  
  status        String    @default("em_andamento")
  descricao     String?
  cobrancaId    String?   @db.ObjectId
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Modelo `Billing` (atualizado)

Novos campos adicionados:

```prisma
origem         String?  // "ATENDIMENTO_TEMPO", "MANUAL", etc
referenciaId   String?  @db.ObjectId // ID do atendimento
```

### Modelo `User` (analistas)

```prisma
model User {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  name       String
  email      String   @unique
  password   String
  role       String   @default("analista")
  valorHora  Float    @default(100.0)
  ativo      Boolean  @default(true)
}
```

---

## 🔌 APIs Disponíveis

### 1. **POST** `/api/atendimentos/iniciar`

Inicia um novo atendimento.

**Body:**
```json
{
  "customerId": "64abc123...",
  "analistaId": "64def456...",
  "descricao": "Suporte técnico - Problema no login"
}
```

**Response:**
```json
{
  "success": true,
  "atendimentoId": "64xyz789...",
  "atendimento": { ... }
}
```

---

### 2. **POST** `/api/atendimentos/pausar`

Pausa um atendimento em andamento.

**Body:**
```json
{
  "atendimentoId": "64xyz789..."
}
```

---

### 3. **POST** `/api/atendimentos/retomar`

Retoma um atendimento pausado.

**Body:**
```json
{
  "atendimentoId": "64xyz789..."
}
```

---

### 4. **POST** `/api/atendimentos/finalizar`

Finaliza o atendimento e **cria a cobrança automaticamente**.

**Body:**
```json
{
  "atendimentoId": "64xyz789...",
  "diasParaVencimento": 7
}
```

**Response:**
```json
{
  "success": true,
  "atendimento": {
    "_id": "64xyz789...",
    "tempoMinutos": 72,
    "tempoFormatado": "1h12min",
    "valorTotal": 144.00,
    "status": "finalizado"
  },
  "cobranca": {
    "_id": "64abc111...",
    "description": "Atendimento técnico – Weder – 29/12/2025\nTempo: 1h12min",
    "amount": 144.00,
    "dueDate": "2026-01-05T00:00:00.000Z",
    "status": "pending"
  },
  "message": "Atendimento finalizado com sucesso! Cobrança de R$ 144.00 criada automaticamente."
}
```

---

### 5. **POST** `/api/atendimentos/cancelar`

Cancela um atendimento.

**Body:**
```json
{
  "atendimentoId": "64xyz789..."
}
```

---

### 6. **GET** `/api/atendimentos`

Lista atendimentos com filtros opcionais.

**Query params:**
- `analistaId`: Filtrar por analista
- `customerId`: Filtrar por cliente
- `status`: Filtrar por status (em_andamento, pausado, finalizado, cancelado)
- `limit`: Limite de resultados (padrão: 50)

**Example:**
```
GET /api/atendimentos?analistaId=64def456&status=finalizado
```

**Response:**
```json
{
  "success": true,
  "atendimentos": [
    {
      "_id": "...",
      "cliente": { "name": "...", "email": "..." },
      "analista": { "name": "...", "email": "..." },
      "inicio": "2025-12-29T10:00:00.000Z",
      "fim": "2025-12-29T11:12:00.000Z",
      "tempoMinutos": 72,
      "valorTotal": 144.00,
      "status": "finalizado",
      "cobranca": { ... }
    }
  ],
  "total": 1
}
```

---

## 💡 Como Usar

### Interface Web

1. Acesse `/atendimentos`
2. Selecione o cliente e analista
3. Clique em "Iniciar Atendimento"
4. O cronômetro começa a contar automaticamente
5. Você pode pausar e retomar quando necessário
6. Ao finalizar:
   - Sistema calcula tempo total
   - Calcula valor baseado no valor/hora do analista
   - Cria cobrança automaticamente
   - Dispara email para o cliente
   - Atualiza relatórios

### Via API

```javascript
// 1. Iniciar atendimento
const response = await fetch('/api/atendimentos/iniciar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: '64abc123...',
    analistaId: '64def456...',
    descricao: 'Suporte técnico'
  })
})

const { atendimentoId } = await response.json()

// 2. Finalizar e criar cobrança
await fetch('/api/atendimentos/finalizar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    atendimentoId,
    diasParaVencimento: 7
  })
})
```

---

## 🔄 Fluxo de Trabalho

```
1. Analista inicia o cronômetro
   ↓
2. Sistema registra início (data/hora)
   ↓
3. Cronômetro roda em tempo real
   ↓
4. Analista pode pausar/retomar
   ↓
5. Analista finaliza o atendimento
   ↓
6. Sistema AUTOMATICAMENTE:
   ├─ Calcula tempo total (minutos)
   ├─ Calcula valor (tempo × valor/hora)
   ├─ Cria cobrança no sistema
   ├─ Vincula cobrança ao atendimento
   ├─ Define data de vencimento
   └─ Status inicial: "pending"
   ↓
7. Sistema DISPARA automaticamente:
   ├─ Email para o cliente
   ├─ Atualiza dashboard
   └─ Inclui nos relatórios
```

---

## 🔗 Integração com Sistema de Cobranças

### Como funciona a integração

O sistema **não cria um novo módulo de cobrança**, ele apenas:

✅ Reutiliza a tabela `billings` existente  
✅ Injeta uma nova cobrança via backend  
✅ Usa os campos `origem` e `referenciaId` para rastreabilidade  

### Campos especiais na cobrança

```javascript
{
  // ... campos normais da cobrança ...
  origem: "ATENDIMENTO_TEMPO",  // identifica a origem
  referenciaId: ObjectId("...") // ID do atendimento
}
```

### Rastreabilidade

```
Atendimento ←→ Cobrança
    ↓              ↓
cobrancaId    referenciaId
```

Isso permite:
- Ver qual atendimento gerou a cobrança
- Ver qual cobrança foi gerada pelo atendimento
- Auditoria completa do processo

---

## 📧 Email Automático

Quando uma cobrança é criada via atendimento, o sistema envia automaticamente:

**Assunto:** Cobrança – Atendimento Técnico

**Conteúdo:**
```
Atendimento realizado em 29/12/2025
Analista: Weder Santos
Tempo: 1h12min
Valor: R$ 144,00

Vencimento: 05/01/2026
```

Isso usa o sistema de email já existente! 🎉

---

## 📈 Relatórios e Dashboard

As cobranças geradas por atendimentos aparecem:

✅ No dashboard principal  
✅ Nos relatórios de inadimplência  
✅ Nos relatórios de receita  
✅ Na listagem de cobranças  

Você pode filtrar por origem:

```javascript
// Buscar apenas cobranças de atendimentos
db.collection('billings').find({
  origem: 'ATENDIMENTO_TEMPO'
})
```

---

## 🛡️ Segurança

### Validações no Backend

✅ Cliente e analista devem existir  
✅ Analista deve estar ativo  
✅ Não pode iniciar se já houver atendimento em andamento  
✅ Não pode pausar/finalizar se não estiver em andamento  
✅ Cálculos sempre no backend (nunca no frontend)  

### Transações

O processo de finalizar é transacional:
- Se a cobrança falhar, o atendimento não é finalizado
- Evita inconsistências no banco

---

## 🧪 Testes

### Testar criação de analistas

```bash
node scripts/criar-analistas.js
```

### Testar fluxo completo

1. Acesse `/atendimentos`
2. Inicie um atendimento
3. Aguarde alguns segundos
4. Finalize
5. Verifique:
   - Cobrança foi criada?
   - Email foi enviado?
   - Aparece nos relatórios?

---

## 🎯 Próximos Passos

Depois de testar o sistema:

1. ✅ Verificar se as cobranças aparecem no dashboard
2. ✅ Confirmar envio de emails
3. ✅ Validar cálculos de valores
4. 📊 Adicionar relatório específico de atendimentos
5. 🔐 Implementar autenticação/autorização
6. 📱 Adaptar para mobile

---

## 🤝 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs do backend
2. Teste as APIs via Postman/Insomnia
3. Verifique o banco de dados diretamente

---

## 📝 Changelog

### v1.0.0 (29/12/2025)
- ✅ Criação do sistema de atendimento por tempo
- ✅ Integração com sistema de cobranças
- ✅ Cronômetro em tempo real
- ✅ APIs completas (iniciar, pausar, retomar, finalizar)
- ✅ Interface web completa
- ✅ Histórico de atendimentos
- ✅ Criação automática de cobranças
- ✅ Rastreabilidade completa

---

**🎉 Sistema pronto para uso!**
