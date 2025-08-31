Write-Host "ATUALIZACAO DO NUMERO DA CONTA PIX" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Write-Host ""
Write-Host "DADOS ATUALIZADOS:" -ForegroundColor Yellow
Write-Host "Chave PIX: jp0886230@gmail.com (mantida)"
Write-Host "Banco: 260 - Nu Pagamentos (mantido)"
Write-Host "Agencia: 0001 (mantida)"
Write-Host "Conta: 12345-6 -> 705640198-7 (ATUALIZADA)"

Write-Host ""
Write-Host "ARQUIVOS ATUALIZADOS:" -ForegroundColor Yellow
Write-Host "lib/init-pix-config.ts - Configuracao de inicializacao"
Write-Host "lib/payment-providers.ts - Configuracao padrao"
Write-Host "scripts/update-pix-account.js - Script de atualizacao"

Write-Host ""
Write-Host "INSTRUCOES:" -ForegroundColor Yellow
Write-Host "1. Acesse http://localhost:3000"
Write-Host "2. Faca login com jp0886230@gmail.com / jp22032006"
Write-Host "3. Va para a aba Pagamentos"
Write-Host "4. Clique no botao de configuracao do PIX"
Write-Host "5. Altere o campo 'Conta' para: 705640198-7"
Write-Host "6. Clique em 'Salvar'"

Write-Host ""
Write-Host "VALIDACAO:" -ForegroundColor Yellow
Write-Host "O campo 'Conta' deve mostrar: 705640198-7"
Write-Host "O status PIX deve permanecer 'Ativo'"

Write-Host ""
Write-Host "CONTA PIX ATUALIZADA COM SUCESSO!" -ForegroundColor Green
Write-Host "Nova conta para recebimento: 705640198-7" -ForegroundColor Cyan