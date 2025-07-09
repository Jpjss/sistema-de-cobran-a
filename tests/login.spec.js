const { test, expect } = require('@playwright/test');

test.describe('FynApp - Testes de Login', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve carregar a página de login', async ({ page }) => {
    await expect(page).toHaveTitle(/login|entrar|fynapp/i);
    
    // Verifica se os elementos de login estão presentes
    await expect(page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name*="senha"], input[name*="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")')).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Tenta diferentes combinações de seletores comuns
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="senha"], input[name*="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

    await emailInput.fill('admin@teste.com');
    await passwordInput.fill('123456');
    await loginButton.click();

    // Verifica redirecionamento após login bem-sucedido
    await expect(page).toHaveURL(/dashboard|home|principal/i);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="senha"], input[name*="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

    await emailInput.fill('usuario@invalido.com');
    await passwordInput.fill('senhaerrada');
    await loginButton.click();

    // Verifica se aparece mensagem de erro
    await expect(page.locator('text=/erro|inválido|incorreto|falhou/i')).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

    // Tenta fazer login sem preencher campos
    await loginButton.click();

    // Verifica validação HTML5 ou mensagens de erro customizadas
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="senha"], input[name*="password"]').first();
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('deve testar diferentes tipos de usuários', async ({ page }) => {
    const testUsers = [
      { email: 'admin@sistema.com', password: 'admin123' },
      { email: 'user@sistema.com', password: 'user123' },
      { email: 'gerente@sistema.com', password: 'gerente123' }
    ];

    for (const user of testUsers) {
      await page.goto('/');
      
      const emailInput = page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]').first();
      const passwordInput = page.locator('input[type="password"], input[name*="senha"], input[name*="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();

      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      await loginButton.click();

      // Aguarda resposta do servidor
      await page.waitForLoadState('networkidle');
      
      // Faz logout se login foi bem-sucedido
      const logoutButton = page.locator('button:has-text("Sair"), a:has-text("Logout"), a:has-text("Sair")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
    }
  });

  test('deve verificar funcionalidade "Esqueci minha senha"', async ({ page }) => {
    const forgotPasswordLink = page.locator('a:has-text("Esqueci"), a:has-text("Recuperar"), a:has-text("Forgot")');
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/recuperar|forgot|senha/i);
    }
  });

  test('deve verificar responsividade do login', async ({ page }) => {
    // Teste em diferentes tamanhos de tela
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await expect(page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await expect(page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]')).toBeVisible();
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await expect(page.locator('input[type="email"], input[name*="email"], input[name*="usuario"]')).toBeVisible();
  });
});
