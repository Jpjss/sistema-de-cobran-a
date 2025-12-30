# 🚀 Guia de Instalação Rápida - Sistema de Atendimento por Tempo

## ⚡ Instalação em 5 minutos

### 1️⃣ Instalar dependências (se ainda não instalou)

```bash
npm install
# ou
pnpm install
```

### 2️⃣ Gerar o Prisma Client com os novos modelos

```bash
npx prisma generate
```

### 3️⃣ Criar analistas no banco de dados

```bash
node scripts/criar-analistas.js
```

Isso criará:
- ✅ Weder Santos (analista, R$ 150/h)
- ✅ João Silva (analista, R$ 120/h)  
- ✅ Maria Oliveira (analista, R$ 180/h)
- ✅ Administrador (admin, R$ 200/h)

**Credenciais:**
- Email: `weder@empresa.com` | Senha: `senha123`
- Email: `admin@empresa.com` | Senha: `admin123`

### 4️⃣ Iniciar o servidor

```bash
npm run dev
# ou
pnpm dev
```

### 5️⃣ Acessar o sistema

```
http://localhost:3000/atendimentos
```

---

## ✅ Testar o Fluxo Completo

### Teste 1: Iniciar e Finalizar Atendimento

1. Acesse: `http://localhost:3000/atendimentos`
2. Selecione um **Cliente** (deve ter clientes cadastrados)
3. Selecione um **Analista** (ex: Weder Santos)
4. Clique em **"Iniciar Atendimento"**
5. Aguarde alguns segundos (ex: 1 minuto)
6. Clique em **"Finalizar e Gerar Cobrança"**

**Resultado esperado:**
```
✅ Atendimento finalizado!
✅ Cobrança de R$ X.XX criada automaticamente
✅ Email enviado para o cliente
```

### Teste 2: Verificar Cobrança Criada

1. Acesse a aba **"Cobranças"** do sistema
2. Verifique se a nova cobrança aparece
3. Descrição deve conter:
   - Nome do analista
   - Data do atendimento
   - Tempo total
   - Nome do cliente

**Exemplo:**
```
Atendimento técnico – Weder Santos – 29/12/2025
Tempo: 0h02min
Cliente: João Silva
```

### Teste 3: Verificar Histórico

1. Na página de atendimentos, clique na aba **"Histórico"**
2. Verifique se o atendimento finalizado aparece
3. Deve mostrar:
   - ✅ Cliente
   - ✅ Analista
   - ✅ Tempo total
   - ✅ Valor cobrado
   - ✅ Link para a cobrança
   - ✅ Status da cobrança

---

## 🔍 Verificar no Banco de Dados

### MongoDB Compass ou MongoDB CLI

```javascript
// Ver atendimentos criados
db.atendimentos_tempo.find().pretty()

// Ver cobranças de atendimentos
db.billings.find({ origem: "ATENDIMENTO_TEMPO" }).pretty()

// Ver analistas
db.users.find({ role: "analista" }).pretty()
```

---

## 🐛 Troubleshooting

### Erro: "Cliente não encontrado"

**Solução:** Você precisa ter clientes cadastrados no sistema.

```bash
# Criar cliente de teste
node scripts/criar-cliente-teste.js
```

Ou acesse: `http://localhost:3000/cadastro-cliente`

---

### Erro: "Analista não encontrado"

**Solução:** Execute novamente:

```bash
node scripts/criar-analistas.js
```

---

### Erro: Prisma Client não encontrado

**Solução:**

```bash
npx prisma generate
```

---

### A cobrança não aparece no sistema

**Verificar:**

1. Olhar os logs do backend (terminal)
2. Verificar se a cobrança foi criada no banco:
   ```javascript
   db.billings.find().sort({ createdAt: -1 }).limit(1)
   ```
3. Verificar se há erros no console do navegador

---

### Email não foi enviado

**Isso é normal!** O sistema cria a cobrança, mas o envio de email depende da configuração do seu serviço de email.

Verifique:
- ✅ A cobrança foi criada? (SIM)
- ✅ Aparece nos relatórios? (SIM)
- ✅ Aparece no dashboard? (SIM)

Para configurar o email, veja a documentação do sistema de emails.

---

## 📊 Estrutura Criada

### Arquivos Criados

```
prisma/
  schema.prisma                     ← Atualizado com novos modelos

pages/api/atendimentos/
  iniciar.ts                        ← Iniciar atendimento
  finalizar.ts                      ← Finalizar + criar cobrança
  pausar.ts                         ← Pausar atendimento
  retomar.ts                        ← Retomar atendimento
  cancelar.ts                       ← Cancelar atendimento
  index.ts                          ← Listar atendimentos

hooks/
  use-atendimentos.ts               ← Hook customizado React

components/
  cronometro-atendimento.tsx        ← Interface do cronômetro
  listagem-atendimentos.tsx         ← Histórico de atendimentos

app/atendimentos/
  page.tsx                          ← Página principal

scripts/
  criar-analistas.js                ← Script para criar analistas

ATENDIMENTOS-README.md              ← Documentação completa
INSTALACAO-RAPIDA.md                ← Este arquivo
```

---

## 🎯 Checklist de Validação

Após a instalação, valide:

- [ ] ✅ Página `/atendimentos` carrega sem erros
- [ ] ✅ Consigo selecionar cliente e analista
- [ ] ✅ Consigo iniciar o cronômetro
- [ ] ✅ O tempo é contado em tempo real
- [ ] ✅ Consigo pausar e retomar
- [ ] ✅ Consigo finalizar o atendimento
- [ ] ✅ A cobrança é criada automaticamente
- [ ] ✅ A cobrança aparece na lista de cobranças
- [ ] ✅ O atendimento aparece no histórico
- [ ] ✅ Os valores calculados estão corretos

---

## 📞 Próximos Passos

Depois de validar o sistema:

1. **Customizar valores/hora** dos analistas
2. **Configurar envio de emails** (se ainda não configurado)
3. **Adicionar mais analistas** conforme necessário
4. **Treinar a equipe** no uso do sistema
5. **Monitorar** os primeiros atendimentos

---

## 💡 Dicas de Uso

### Pausar vs Finalizar

- **Pausar**: Use quando precisar interromper temporariamente (ex: almoço, outra tarefa urgente)
- **Finalizar**: Use quando o atendimento estiver completo e você quiser gerar a cobrança

### Descrição do Atendimento

Adicione uma descrição clara para facilitar:
- Identificação posterior
- Justificativa para o cliente
- Auditoria

**Exemplo:**
```
Suporte técnico - Configuração de email no Outlook
Problema: Cliente não conseguia enviar emails
Solução: Reconfigurar servidor SMTP
```

### Dias para Vencimento

Configure conforme sua política:
- **7 dias**: Padrão (recomendado)
- **15 dias**: Clientes com mais prazo
- **30 dias**: Contratos mensais

---

## 🎉 Pronto!

Seu sistema de atendimento por tempo está **100% operacional**!

Qualquer dúvida, consulte o arquivo `ATENDIMENTOS-README.md` para documentação completa.

---

**Desenvolvido em 29/12/2025** ⚡
