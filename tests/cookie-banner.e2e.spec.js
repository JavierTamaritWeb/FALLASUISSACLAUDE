const { test, expect } = require('@playwright/test');

const MOBILE_VIEWPORT = { width: 360, height: 740 };

test.describe('Banner de Cookies', () => {
  test.beforeEach(async ({ page }) => {
    // Asegurarse de que el localStorage esté limpio antes de cada test
    await page.goto('/index.html');
    await page.evaluate(() => {
      localStorage.removeItem('cookieConsent');
    });
    await page.reload();
  });

  test('aparece al cargar la página por primera vez y se puede aceptar todo', async ({ page }) => {
    await page.goto('/index.html');

    const banner = page.locator('#cookie-banner');
    
    // Verificar que el banner es visible
    await expect(banner).toBeVisible();

    // Verificar que contiene los botones correctos
    const btnAcceptAll = banner.locator('#cookieAcceptAll');
    await expect(btnAcceptAll).toBeVisible();
    
    // Clic en aceptar todas
    await btnAcceptAll.click();

    // El banner debe desaparecer (podría tener transición, así que esperamos a que no sea visible o no esté en el DOM)
    await expect(banner).not.toBeVisible();

    // Recargar la página y verificar que ya no aparece
    await page.reload();
    await expect(page.locator('#cookie-banner')).toHaveCount(0);
  });

  test('aparece al cargar la página por primera vez y se puede aceptar solo las necesarias', async ({ page }) => {
    await page.goto('/index.html');

    const banner = page.locator('#cookie-banner');
    
    // Verificar que el banner es visible
    await expect(banner).toBeVisible();

    // Verificar que contiene los botones correctos
    const btnNecessary = banner.locator('#cookieNecessary');
    await expect(btnNecessary).toBeVisible();
    
    // Clic en necesarias
    await btnNecessary.click();

    // El banner debe desaparecer
    await expect(banner).not.toBeVisible();

    // Recargar la página y verificar que no vuelve a aparecer
    await page.reload();
    await expect(page.locator('#cookie-banner')).toHaveCount(0);
  });

  test('aparece y se ve bien en terminales móviles', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/index.html');

    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();
  });
});
