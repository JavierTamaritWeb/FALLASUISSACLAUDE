const { test, expect } = require('@playwright/test');

const PAGES = [
  'index.html',
  'lafalla.html',
  'eventos.html',
  'meteo.html',
  'blog.html',
  'galerias.html',
  'calendario.html',
  'mapa.html',
  'organigrama.html',
  'galeria_1.html',
  'galeria_2.html',
  'galeria_3.html',
  'galeria_4.html'
];

test.describe('Navbar responsive + idioma', () => {
  for (const pageName of PAGES) {
    test(`${pageName} (desktop): nav visible y label idioma`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pageName}`);

      const nav = page.locator('nav.navegacion');
      await expect(nav).toBeVisible();

      const toggle = page.locator('button.header__menu-toggle');
      await expect(toggle).toBeHidden();

      const lang = page.locator('#langSwitcher');
      await expect(lang).toBeVisible();
      await expect(lang).toHaveText(/IDIOMA · /);
    });

    test(`${pageName} (mobile): toggle visible y nav cerrada por defecto`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(`/${pageName}`);

      const toggle = page.locator('button.header__menu-toggle');
      await expect(toggle).toBeVisible();

      const nav = page.locator('nav.navegacion');
      await expect(nav).toBeHidden();

      const lang = page.locator('#langSwitcher');
      await expect(lang).toBeVisible();
      await expect(lang).toHaveAttribute('aria-label', /Cambiar idioma/);
      await expect(lang).toHaveCSS('font-size', '0px');
    });
  }

  test('mobile: abre/cierra con toggle, Escape y click fuera', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/index.html');

    const toggle = page.locator('button.header__menu-toggle');
    const nav = page.locator('nav.navegacion');

    await toggle.click();
    await expect(nav).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(nav).toBeVisible();

    // Click fuera usando el backdrop - disparamos el evento directamente
    // porque el backdrop es transparente y tiene z-index menor que la barra
    await page.evaluate(() => {
      document.querySelector('.nav-backdrop').click();
    });
    await expect(nav).toBeHidden();
  });

  test('mobile: al clicar un enlace navega y el menú queda cerrado', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/index.html');

    const toggle = page.locator('button.header__menu-toggle');
    const nav = page.locator('nav.navegacion');

    await toggle.click();
    await expect(nav).toBeVisible();

    await Promise.all([
      page.waitForURL(/lafalla\.html$/),
      page.locator('nav.navegacion a[href="lafalla.html"]').click()
    ]);

    await expect(page.locator('nav.navegacion')).toBeHidden();
  });
});
