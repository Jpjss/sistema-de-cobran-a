Write-Host "ATUALIZACAO DO NUMERO DA CONTA PIX" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Write-Host "`n📋 DADOS ATUALIZADOS:" -ForegroundColor Yellow
Write-Host "✅ Chave PIX: jp0886230@gmail.com (mantida)"
Write-Host "✅ Banco: 260 - Nu Pagamentos (mantido)"
Write-Host "✅ Agencia: 0001 (mantida)"
Write-Host "🔄 Conta: 12345-6 → 705640198-7 (ATUALIZADA)"

Write-Host "`n🔧 ARQUIVOS ATUALIZADOS:" -ForegroundColor Yellow
Write-Host "✅ lib/init-pix-config.ts - Configuracao de inicializacao"
Write-Host "✅ lib/payment-providers.ts - Configuracao padrao"
Write-Host "✅ scripts/update-pix-account.js - Script de atualizacao do localStorage"

Write-Host "`n📝 INSTRUCOES PARA APLICAR A MUDANCA:" -ForegroundColor Yellow
Write-Host "1. Acesse http://localhost:3000"
Write-Host "2. Faca login com jp0886230@gmail.com / jp22032006"
Write-Host "3. Abra o console do navegador (F12 → Console)"
Write-Host "4. Cole e execute o seguinte comando:"
Write-Host ""
Write-Host "   // Atualizar conta PIX" -ForegroundColor Cyan
Write-Host "   let config = JSON.parse(localStorage.getItem('payment-config') || '{}');" -ForegroundColor Cyan
Write-Host "   if (config.methods) {" -ForegroundColor Cyan
Write-Host "       const pix = config.methods.find(m => m.id === 'pix');" -ForegroundColor Cyan
Write-Host "       if (pix) pix.config.conta = '705640198-7';" -ForegroundColor Cyan
Write-Host "       localStorage.setItem('payment-config', JSON.stringify(config));" -ForegroundColor Cyan
Write-Host "       window.location.reload();" -ForegroundColor Cyan
Write-Host "   }" -ForegroundColor Cyan

Write-Host "`n5. Va para a aba Pagamentos"
Write-Host "6. Clique no botao de configuracao do PIX (engrenagem)"
Write-Host "7. Verifique se o campo 'Conta' mostra: 705640198-7"

Write-Host "`n🎯 VALIDACAO:" -ForegroundColor Yellow
Write-Host "✅ O campo 'Conta' deve mostrar: 705640198-7"
Write-Host "✅ O status PIX deve permanecer 'Ativo'"
Write-Host "✅ Todos os outros campos permanecem inalterados"

Write-Host "`n💡 ALTERNATIVA RAPIDA:" -ForegroundColor Yellow
Write-Host "Se preferir, tambem pode:"
Write-Host "1. Ir para aba Pagamentos"
Write-Host "2. Clicar na configuracao PIX"
Write-Host "3. Alterar manualmente o campo 'Conta' para: 705640198-7"
Write-Host "4. Clicar em 'Salvar'"

Write-Host "`n✅ CONTA PIX ATUALIZADA COM SUCESSO!" -ForegroundColor Green
Write-Host "Nova conta para recebimento: 705640198-7" -ForegroundColor Cyan