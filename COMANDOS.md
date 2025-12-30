# 🚀 Comandos Rápidos - Sistema de Atendimento por Tempo

## Instalação

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Criar analistas de exemplo
node scripts/criar-analistas.js

# Testar integração
node scripts/testar-integracao-atendimentos.js

# Iniciar servidor
npm run dev
```

## URLs Importantes

```
# Página de Atendimentos
http://localhost:3000/atendimentos

# Página de Cobranças
http://localhost:3000/cobrancas
```

## APIs Disponíveis

```bash
# Iniciar atendimento
POST http://localhost:3000/api/atendimentos/iniciar
Body: { "customerId": "...", "analistaId": "...", "descricao": "..." }

# Pausar atendimento
POST http://localhost:3000/api/atendimentos/pausar
Body: { "atendimentoId": "..." }

# Retomar atendimento
POST http://localhost:3000/api/atendimentos/retomar
Body: { "atendimentoId": "..." }

# Finalizar atendimento (cria cobrança)
POST http://localhost:3000/api/atendimentos/finalizar
Body: { "atendimentoId": "...", "diasParaVencimento": 7 }

# Cancelar atendimento
POST http://localhost:3000/api/atendimentos/cancelar
Body: { "atendimentoId": "..." }

# Listar atendimentos
GET http://localhost:3000/api/atendimentos
GET http://localhost:3000/api/atendimentos?analistaId=...
GET http://localhost:3000/api/atendimentos?status=finalizado
```

## Queries MongoDB

```javascript
// Conectar ao MongoDB
mongosh "mongodb://localhost:27017/sistema-cobranca"

// Ver analistas
db.users.find({ role: "analista" }).pretty()

// Ver atendimentos
db.atendimentos_tempo.find().pretty()

// Ver atendimentos finalizados
db.atendimentos_tempo.find({ status: "finalizado" }).pretty()

// Ver cobranças de atendimentos
db.billings.find({ origem: "ATENDIMENTO_TEMPO" }).pretty()

// Contar atendimentos por status
db.atendimentos_tempo.aggregate([
  { $group: { _id: "$status", total: { $sum: 1 } } }
])

// Valor total gerado
db.atendimentos_tempo.aggregate([
  { $match: { status: "finalizado" } },
  { $group: { _id: null, total: { $sum: "$valorTotal" } } }
])

// Tempo total de atendimentos (em minutos)
db.atendimentos_tempo.aggregate([
  { $match: { status: "finalizado" } },
  { $group: { _id: null, totalMinutos: { $sum: "$tempoMinutos" } } }
])

// Top 5 analistas por valor gerado
db.atendimentos_tempo.aggregate([
  { $match: { status: "finalizado" } },
  { $group: { _id: "$analistaId", total: { $sum: "$valorTotal" } } },
  { $sort: { total: -1 } },
  { $limit: 5 }
])

// Limpar dados de teste
db.atendimentos_tempo.deleteMany({ descricao: /TESTE/i })
db.billings.deleteMany({ description: /TESTE/i })
```

## Troubleshooting

```bash
# Erro: Prisma Client não encontrado
npx prisma generate

# Erro: Analistas não encontrados
node scripts/criar-analistas.js

# Erro: Clientes não encontrados
# Acessar: http://localhost:3000/cadastro-cliente

# Verificar logs do backend
# Olhar no terminal onde executou 'npm run dev'

# Testar integração completa
node scripts/testar-integracao-atendimentos.js

# Verificar portas em uso
# Windows:
netstat -ano | findstr :3000

# Limpar cache do Next.js
rm -rf .next
npm run dev
```

## Criar Cliente de Teste (MongoDB)

```javascript
mongosh "mongodb://localhost:27017/sistema-cobranca"

db.customers.insertOne({
  name: "Empresa Teste Ltda",
  email: "teste@empresa.com",
  phone: "(11) 98765-4321",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Criar Analista Manualmente (MongoDB)

```javascript
mongosh "mongodb://localhost:27017/sistema-cobranca"

// Primeiro, gerar hash da senha
// No Node.js:
const bcrypt = require('bcryptjs')
const hash = bcrypt.hashSync('senha123', 10)
console.log(hash)

// Depois, no MongoDB:
db.users.insertOne({
  name: "Novo Analista",
  email: "novo@empresa.com",
  password: "$2a$10$...",  // Cole o hash aqui
  role: "analista",
  valorHora: 150.0,
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Verificar Status do Sistema

```bash
# Status do servidor
curl http://localhost:3000/api/health

# Listar atendimentos
curl http://localhost:3000/api/atendimentos

# Listar cobranças
curl http://localhost:3000/api/cobrancas
```

## Logs Úteis

```bash
# Ver logs em tempo real (Linux/Mac)
tail -f .next/server/logs/app.log

# Ver logs no Windows PowerShell
Get-Content .next/server/logs/app.log -Wait

# Filtrar logs de erro
grep "ERROR" .next/server/logs/app.log
```

## Backup e Restore

```bash
# Backup do MongoDB
mongodump --uri="mongodb://localhost:27017/sistema-cobranca" --out=./backup

# Restore do MongoDB
mongorestore --uri="mongodb://localhost:27017/sistema-cobranca" ./backup/sistema-cobranca

# Backup apenas de atendimentos
mongodump --uri="mongodb://localhost:27017/sistema-cobranca" --collection=atendimentos_tempo --out=./backup

# Backup apenas de cobranças de atendimentos
mongoexport --uri="mongodb://localhost:27017/sistema-cobranca" \
  --collection=billings \
  --query='{"origem":"ATENDIMENTO_TEMPO"}' \
  --out=./cobrancas_atendimentos.json
```

## Variáveis de Ambiente

```env
# .env.local

# MongoDB
DATABASE_URL="mongodb://localhost:27017/sistema-cobranca"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Email (opcional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="sua-senha-app"
```

## Atalhos de Desenvolvimento

```bash
# Modo desenvolvimento com logs detalhados
DEBUG=* npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm run start

# Lint
npm run lint

# Testes E2E
npm run test:e2e

# Testes E2E com UI
npm run test:e2e:ui

# Seed do banco de dados
npm run seed
```

## Exemplos de Teste com curl

```bash
# Iniciar atendimento
curl -X POST http://localhost:3000/api/atendimentos/iniciar \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "64abc123...",
    "analistaId": "64def456...",
    "descricao": "Suporte técnico"
  }'

# Finalizar atendimento
curl -X POST http://localhost:3000/api/atendimentos/finalizar \
  -H "Content-Type: application/json" \
  -d '{
    "atendimentoId": "64xyz789...",
    "diasParaVencimento": 7
  }'

# Listar atendimentos finalizados
curl "http://localhost:3000/api/atendimentos?status=finalizado"
```

## Monitoramento em Tempo Real

```bash
# Watch nas mudanças do banco (MongoDB 4.0+)
mongosh

use sistema-cobranca

// Watch em atendimentos
db.atendimentos_tempo.watch()

// Watch em cobranças
db.billings.watch()
```

## Exportar Relatórios

```bash
# Exportar atendimentos para CSV (via MongoDB)
mongoexport --uri="mongodb://localhost:27017/sistema-cobranca" \
  --collection=atendimentos_tempo \
  --type=csv \
  --fields=_id,customerId,analistaId,inicio,fim,tempoMinutos,valorTotal,status \
  --out=atendimentos.csv

# Exportar cobranças de atendimentos para JSON
mongoexport --uri="mongodb://localhost:27017/sistema-cobranca" \
  --collection=billings \
  --query='{"origem":"ATENDIMENTO_TEMPO"}' \
  --out=cobrancas_atendimentos.json
```

## Comandos Git (para versionar)

```bash
# Adicionar arquivos do sistema de atendimentos
git add prisma/schema.prisma
git add pages/api/atendimentos/
git add hooks/use-atendimentos.ts
git add components/cronometro-atendimento.tsx
git add components/listagem-atendimentos.tsx
git add app/atendimentos/
git add scripts/criar-analistas.js
git add scripts/testar-integracao-atendimentos.js
git add *.md

# Commit
git commit -m "feat: Sistema de atendimento por tempo integrado"

# Push
git push origin main
```

## Checklist Pré-Deploy

```bash
# 1. Build com sucesso
npm run build

# 2. Testes passando
npm run test:e2e

# 3. Lint sem erros
npm run lint

# 4. Variáveis de ambiente configuradas
cat .env.production

# 5. Backup do banco
mongodump --uri="$DATABASE_URL" --out=./backup-pre-deploy

# 6. Testar integração
node scripts/testar-integracao-atendimentos.js

# 7. Deploy
# Vercel/AWS/Azure/etc
```

---

**💡 Dica:** Salve este arquivo como `COMANDOS.md` para referência rápida!
