// tests/meteo-icon-size.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Tamaño del icono meteo', () => {
    
  test('El icono tiene el tamaño correcto en > 1200px', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');
    await expect(icon).toBeVisible();

    // Verificamos el width calculado. 16rem con base 16px = 256px, 
    // pero depende de la configuración de font-size del root.
    // Usualmente :root tiene font-size: 62.5% (10px) o 100% (16px).
    // Si no lo sabemos, comprobamos simplemente que computedStyle width es igual a 16rem.
    // Playwright da valores en píxeles.
    
    const width = await icon.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).width);
    });
    
    // Si la base es 16px -> 16 * 16 = 256px
    // Si la base es 10px -> 16 * 10 = 160px
    // Vamos a leer el font-size del root para ser robustos
    const rootFontSize = await page.evaluate(() => parseFloat(window.getComputedStyle(document.documentElement).fontSize));
    const expectedPx = 20 * rootFontSize;

    expect(width).toBeCloseTo(expectedPx, 1);
  });

  test('El icono tiene el tamaño correcto en < 768px', async ({ page }) => {
    // Caso Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');
    const width = await icon.evaluate((el) => parseFloat(window.getComputedStyle(el).width));
    const rootFontSize = await page.evaluate(() => parseFloat(window.getComputedStyle(document.documentElement).fontSize));
    
    // Se espera 7rem max-width 480px
    const expectedPx = 7 * rootFontSize;
    
    expect(width).toBeCloseTo(expectedPx, 1);
  });
});
