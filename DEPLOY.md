# 🚀 Deploy na Vercel - Sistema de Cobrança FynApp

## 📋 Pré-requisitos

1. **Conta na Vercel**: https://vercel.com
2. **MongoDB Atlas**: https://cloud.mongodb.com (gratuito)
3. **Repositório GitHub**: Já configurado ✅

## 🎯 Passos para Deploy

### 1. Configurar MongoDB Atlas (se ainda não tiver)

1. Acesse https://cloud.mongodb.com
2. Crie uma conta gratuita
3. Crie um novo cluster (M0 Sandbox - FREE)
4. Configure acesso de rede (IP 0.0.0.0/0 para Vercel)
5. Crie um usuário do banco
6. Obtenha a string de conexão

### 2. Deploy na Vercel

#### Opção A: Via GitHub (Recomendado)
1. Acesse https://vercel.com
2. Conecte sua conta GitHub
3. Importe o repositório `sistema-de-cobran-a`
4. Configure as variáveis de ambiente (ver seção abaixo)
5. Clique em "Deploy"

#### Opção B: Via CLI Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Variáveis de Ambiente Obrigatórias

Configure no painel da Vercel → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.mongodb.net/fynapp?retryWrites=true&w=majority
JWT_SECRET=sua-chave-jwt-super-secreta-de-32-caracteres-ou-mais
NEXTAUTH_URL=https://seu-app.vercel.app
```

### 4. Variáveis Opcionais (para funcionalidades completas)

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-aplicativo-google
PIX_KEY=jp0886230@gmail.com
PIX_BANCO=260
PIX_AGENCIA=0001
PIX_CONTA=705640198-7
```

## ✅ Após o Deploy

1. **Teste o login**: Use as credenciais padrão
2. **Configure email**: Para envio de cobranças
3. **Teste PIX**: Gere um código de pagamento
4. **Configure domínio**: (opcional) domínio personalizado

## 🔧 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Certifique-se que não há imports de arquivos que não existem

### Erro de Conexão MongoDB
- Verifique a string de conexão `MONGODB_URI`
- Confirme que o IP da Vercel está liberado (use 0.0.0.0/0)

### Erro 500 nas APIs
- Verifique se `JWT_SECRET` está configurado
- Confirme se todas as variáveis obrigatórias estão definidas

## 📊 Monitoramento

- **Logs**: Vercel Dashboard → Functions → View Function Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Performance**: Vercel Dashboard → Speed Insights

## 🎉 Pronto!

Seu sistema estará disponível em: `https://seu-app.vercel.app`

---

**Desenvolvido por:** João Paulo  
**Sistema:** FynApp - Gestão de Cobranças  
**Tecnologias:** Next.js, MongoDB, Tailwind CSS, PIX EMV