# FynApp - Sistema de Cobrança

## Descrição
FynApp é um sistema completo para gerenciamento de cobranças, clientes e envio automático de e-mails de lembrete. O sistema foi desenvolvido com Next.js, TypeScript, MongoDB (via Prisma) e integrações modernas de UI/UX.

## Funcionalidades
- Cadastro e gerenciamento de clientes
- Cadastro, edição e exclusão de cobranças
- Envio automático de e-mails de lembrete diário até a cobrança ser paga
- Envio de e-mails de confirmação de pagamento
- Painel de controle com filtros, busca e status das cobranças
- Log de auditoria de ações
- Sistema de autenticação
- Responsividade e design moderno

## Tecnologias Utilizadas
- Next.js 14+
- TypeScript
- Prisma ORM (MongoDB)
- Nodemailer (envio de e-mails)
- TailwindCSS
- React Hooks
- Playwright (testes automatizados)

## Estrutura de Pastas
```
├── app/                # App Router do Next.js (páginas, layout, estilos globais)
├── components/         # Componentes reutilizáveis de UI e lógica
├── hooks/              # React hooks customizados (ex: useBillings, useAuth)
├── lib/                # Lógica de negócio, integração com banco, e-mail, agendadores
├── pages/api/          # Endpoints de API (REST)
├── prisma/             # Schema do Prisma
├── public/             # Imagens e arquivos estáticos
├── styles/             # Estilos globais
```

## Como rodar o projeto
1. **Clone o repositório:**
   ```
   git clone <url-do-repo>
   cd sistema-de-cobranca
   ```
2. **Instale as dependências:**
   ```
   npm install
   ```
3. **Configure o banco de dados:**
   - Crie um arquivo `.env` na raiz com:
     ```
     DATABASE_URL="mongodb://localhost:27017/cobranca"
     # Configurações SMTP para envio de e-mails
     GMAIL_SMTP_HOST=smtp.gmail.com
     GMAIL_SMTP_PORT=587
     GMAIL_SMTP_SECURE=false
     GMAIL_SMTP_USER=seu-email@gmail.com
     GMAIL_SMTP_PASSWORD=sua-senha-ou-app-password
     GMAIL_FROM_EMAIL=seu-email@gmail.com
     GMAIL_FROM_NAME=FynApp
     ```
4. **Gere o cliente Prisma:**
   ```
   npx prisma generate
   ```
5. **Inicie o servidor de desenvolvimento:**
   ```
   npm run dev
   ```

## Testes automatizados
- Os testes E2E estão em `tests/` e `__tests__/`.
- Para rodar os testes Playwright:
  ```
  npx playwright test
  ```

## Agendamento de e-mails
- O sistema envia lembretes diários automáticos para cobranças pendentes.
- O envio é controlado para garantir apenas 1 e-mail por dia por cobrança.
- O agendamento é feito via `lib/daily-reminder-scheduler.ts` e a fila de e-mails via `lib/email-queue.ts`.

## Estrutura do banco de dados (Prisma)
- O schema está em `prisma/schema.prisma`.
- Principais modelos:
  - `Customer`: clientes
  - `Billing`: cobranças (com controle de lembretes enviados)

## Observações
- O sistema é totalmente responsivo.
- O envio de e-mails depende de configuração SMTP válida.
- Logs de auditoria são registrados para ações críticas.

## Contribuição
Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro para discutir o que você gostaria de mudar.

## Licença
MIT
