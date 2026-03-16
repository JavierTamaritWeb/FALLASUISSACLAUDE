const { test, expect } = require('@playwright/test');

test.describe('Banner de subvención', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('bannerSubvencionCerrado', 'false');
    });
  });

  test('index lo muestra una sola vez por sesión de navegador y no reaparece al recargar', async ({ page, context }) => {
    await page.goto('/index.html');

    const banner = page.locator('#banner-subvencion');
    await expect(banner).toBeVisible();

    await banner.locator('.banner-subvencion__cerrar').click();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.goto('/lafalla.html');
    await page.goto('/index.html');
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    const secondPage = await context.newPage();
    await secondPage.goto('/index.html');
    await expect(secondPage.locator('#banner-subvencion')).toHaveCount(0);
  });
});