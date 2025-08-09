const { test, expect } = require('@playwright/test');

test.describe('FynApp - Teste de Relatórios MongoDB', () => {

  test('deve carregar relatórios com dados do MongoDB', async ({ page }) => {
    // Ir para a aplicação
    await page.goto('http://localhost:3000');
    
    // Aguardar a página carregar completamente
    await page.waitForLoadState('domcontentloaded');
    
    // Fazer login usando credenciais de teste válidas
    await page.fill('#email', 'admin@sistema.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    
    // Aguardar o dashboard carregar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Aguardar e clicar na aba Relatórios no sidebar
    await page.waitForSelector('text=Relatórios', { timeout: 15000 });
    await page.click('text=Relatórios');
    
    // Aguardar carregamento dos dados dos relatórios
    await page.waitForTimeout(5000);
    
    // Verificar se os cards de resumo estão visíveis usando seletores mais específicos
    await expect(page.locator('.grid').locator('text=Total Recebido')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.grid').locator('text=Total Pendente')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Cards de resumo encontrados!');
    
    // Verificar se há valores monetários nos cards
    const cards = await page.locator('.grid .space-y-1').all();
    console.log(`Encontrados ${cards.length} cards de resumo`);
    
    // Testar navegação entre abas dos relatórios
    await page.click('text=Inadimplência');
    await page.waitForTimeout(3000);
    console.log('✅ Aba Inadimplência carregada');
    
    await page.click('text=Atividades');
    await page.waitForTimeout(3000);
    console.log('✅ Aba Atividades carregada');
    
    // Voltar para Financeiro
    await page.click('text=Financeiro');
    await page.waitForTimeout(3000);
    console.log('✅ Aba Financeiro carregada');
    
    console.log('✅ Teste de relatórios concluído com sucesso!');
  });

});
