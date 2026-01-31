const { test, expect } = require('@playwright/test');

test.describe('Cenefa (Frieze) - Dark Mode & Transition', () => {
    
  test.beforeEach(async ({ page }) => {
    // Ir a la home donde la cenefa es visible
    await page.goto('/');
  });

  test('Debe tener el color de fondo correcto en modo claro', async ({ page }) => {
    const frieze = page.locator('.frieze').first();
    // $blanco-hueso: #F5F5F5 -> rgb(245, 245, 245)
    await expect(frieze).toHaveCSS('background-color', 'rgb(245, 245, 245)');
  });

  test('Debe tener la propiedad transition configurada correctamente', async ({ page }) => {
    const frieze = page.locator('.frieze').first();
    // transition: background-color var(--theme-transition), ...
    // Esperamos ver 'background-color' en la propiedad transition
    const transition = await frieze.evaluate(el => window.getComputedStyle(el).transition);
    expect(transition).toContain('background-color');
  });

  test('Debe cambiar al color oscuro cuando se activa el modo oscuro', async ({ page }) => {
    const frieze = page.locator('.frieze').first();

    // Activar modo oscuro manualmente en el body
    await page.evaluate(() => document.body.classList.add('modo-oscuro'));

    // $gris-muy-oscuro: #444 -> rgb(68, 68, 68)
    // Usamos un timeout mayor porque la transición es de 2.4s
    await expect(frieze).toHaveCSS('background-color', 'rgb(68, 68, 68)', { timeout: 5000 });
  });
});
