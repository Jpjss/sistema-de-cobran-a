# Page snapshot

```yaml
- alert
- text: Sistema de Cobrança Faça login para acessar o sistema Email
- textbox "Email": usuario@inexistente.com
- text: Senha
- textbox "Senha": senhaincorreta123
- button:
  - img
- alert: Cannot read properties of undefined (reading 'getAllUsers')
- button "Entrar":
  - img
  - text: Entrar
- paragraph: "Contas de teste:"
- paragraph:
  - strong: "Admin:"
  - text: admin@sistema.com
- paragraph:
  - strong: "Financeiro:"
  - text: financeiro@sistema.com
- paragraph:
  - strong: "Suporte:"
  - text: suporte@sistema.com
- paragraph:
  - strong: "Senha:"
  - text: password
```