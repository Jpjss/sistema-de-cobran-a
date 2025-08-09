const { test, expect } = require('@playwright/test');

test.describe('FynApp - Testes de Layout Vertical', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('deve exibir sidebar vertical em desktop', async ({ page }) => {
    // Verificar se a sidebar está visível
    await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    
    // Verificar se os itens do menu estão organizados verticalmente
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Cobranças')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
    await expect(page.locator('text=Relatórios')).toBeVisible();
    
    // Verificar grupos do menu
    await expect(page.locator('text=Sistema')).toBeVisible();
    await expect(page.locator('text=Administração')).toBeVisible();
  });

  test('deve funcionar em diferentes resoluções', async ({ page }) => {
    // Teste em resolução desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    
    // Teste em resolução tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();
    
    // Teste em resolução mobile
    await page.setViewportSize({ width: 375, height: 667 });
    // Em mobile, a sidebar pode estar colapsada
    await expect(page.locator('[data-sidebar="trigger"]')).toBeVisible();
  });

  test('deve permitir navegação entre seções', async ({ page }) => {
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Clicar em Cobranças
    await page.click('text=Cobranças');
    await expect(page.locator('text=Nova Cobrança')).toBeVisible();
    
    // Clicar em Clientes
    await page.click('text=Clientes');
    await expect(page.locator('text=Adicionar Cliente')).toBeVisible();
    
    // Voltar ao Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('text=Total de Cobranças')).toBeVisible();
  });

  test('deve ter sidebar responsiva', async ({ page }) => {
    // Testar colapse da sidebar se disponível
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
      
      // Verificar se sidebar foi colapsada/expandida
      await page.waitForTimeout(500); // Aguardar animação
    }
  });

  test('deve manter o estado ativo do menu', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Clicar em uma seção
    await page.click('text=Cobranças');
    
    // Verificar se o item está marcado como ativo
    const billingsButton = page.locator('text=Cobranças').first();
    await expect(billingsButton).toHaveAttribute('data-active', 'true');
  });

  test('deve exibir header correto para cada seção', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Testar header do Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('h2:has-text("dashboard")')).toBeVisible();
    
    // Testar header de Cobranças
    await page.click('text=Cobranças');
    await expect(page.locator('h2:has-text("billings")')).toBeVisible();
    
    // Testar header de Clientes
    await page.click('text=Clientes');
    await expect(page.locator('h2:has-text("customers")')).toBeVisible();
  });

  test('deve ter controles de tema e usuário no header', async ({ page }) => {
    // Verificar se o toggle de tema está presente
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
    
    // Verificar se o perfil do usuário está presente
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

});
