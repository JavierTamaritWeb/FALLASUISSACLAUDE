const { test, expect } = require('@playwright/test');

test.describe('Banner de subvención', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bannerSubvencionCerrado', 'false');
    });
  });

  test('index lo muestra solo en la primera carga de la pestaña y reaparece al recargar', async ({ page }) => {
    await page.goto('/index.html');

    const banner = page.locator('#banner-subvencion');
    await expect(banner).toBeVisible();

    await banner.locator('.banner-subvencion__cerrar').click();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.goto('/lafalla.html');
    await page.goto('/index.html');
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('#banner-subvencion')).toBeVisible();
  });
});