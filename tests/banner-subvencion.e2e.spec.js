const { test, expect } = require('@playwright/test');

test.describe('Banner de subvención', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('bannerSubvencionCerrado', 'false');
    });
  });

  test('index lo muestra en cada carga de la home', async ({ page, context }) => {
    const banner = page.locator('#banner-subvencion');

    await page.goto('/index.html');
    await expect(banner).toBeVisible();

    await banner.locator('.banner-subvencion__cerrar').click();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.goto('/lafalla.html');
    await page.goto('/index.html');
    await expect(banner).toBeVisible();

    await banner.locator('.banner-subvencion__cerrar').click();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);

    await page.reload();
    await expect(banner).toBeVisible();

    const secondPage = await context.newPage();
    await secondPage.goto('/index.html');
    await expect(secondPage.locator('#banner-subvencion')).toBeVisible();
  });
});