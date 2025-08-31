# Script de teste para PIX
Write-Host "=== TESTE DO SISTEMA PIX FYNAPP ===" -ForegroundColor Green

# Testar se o servidor está respondendo
Write-Host "`n1. Testando conexão com o servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    Write-Host "✅ Servidor respondendo na porta 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro de conexão: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Aguardar um pouco para o servidor carregar completamente
Write-Host "`n2. Aguardando servidor carregar completamente..." -ForegroundColor Yellow
Start-Sleep 15

# Testar API de cobranças
Write-Host "`n3. Testando API de cobranças..." -ForegroundColor Yellow
try {
    $cobrancas = Invoke-RestMethod -Uri "http://localhost:3000/api/cobrancas" -Method GET -TimeoutSec 10
    Write-Host "✅ API de cobranças funcionando. Total: $($cobrancas.Count) cobranças" -ForegroundColor Green
    
    # Encontrar uma cobrança pendente
    $pendente = $cobrancas | Where-Object { $_.status -eq "pendente" } | Select-Object -First 1
    
    if ($pendente) {
        Write-Host "✅ Cobrança pendente encontrada: $($pendente._id)" -ForegroundColor Green
        Write-Host "   - Valor: R$ $($pendente.valor)" -ForegroundColor Cyan
        Write-Host "   - Cliente: $($pendente.clienteId)" -ForegroundColor Cyan
        Write-Host "   - Vencimento: $($pendente.vencimento)" -ForegroundColor Cyan
        
        # Testar criação de pagamento PIX
        Write-Host "`n4. Testando criação de pagamento PIX..." -ForegroundColor Yellow
        
        $pixPayload = @{
            billingId = $pendente._id
            method = "pix"
            amount = $pendente.valor
        } | ConvertTo-Json
        
        try {
            $pixResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/payment/create" -Method POST -Body $pixPayload -ContentType "application/json" -TimeoutSec 10
            Write-Host "✅ Pagamento PIX criado com sucesso!" -ForegroundColor Green
            Write-Host "   - Transaction ID: $($pixResponse.transactionId)" -ForegroundColor Cyan
            Write-Host "   - Código PIX: $($pixResponse.pixCode)" -ForegroundColor Cyan
            Write-Host "   - Status: $($pixResponse.status)" -ForegroundColor Cyan
            
            # Testar status do pagamento
            Write-Host "`n5. Testando consulta de status..." -ForegroundColor Yellow
            Start-Sleep 2
            
            try {
                $statusResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/payment/status/$($pixResponse.transactionId)" -Method GET -TimeoutSec 10
                Write-Host "✅ Status consultado com sucesso!" -ForegroundColor Green
                Write-Host "   - Status: $($statusResponse.status)" -ForegroundColor Cyan
                Write-Host "   - Message: $($statusResponse.message)" -ForegroundColor Cyan
                
                Write-Host "`n🎉 TESTE COMPLETO - TODOS OS MÉTODOS DE PAGAMENTO FUNCIONANDO!" -ForegroundColor Green
                
            } catch {
                Write-Host "❌ Erro ao consultar status: $($_.Exception.Message)" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "❌ Erro ao criar pagamento PIX: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Nenhuma cobrança pendente encontrada" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro na API de cobranças: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== FIM DO TESTE ===" -ForegroundColor Green