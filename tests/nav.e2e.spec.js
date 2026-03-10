const { test, expect } = require('@playwright/test');

const PAGES = [
  'index.html',
  'colaboraciones.html',
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

  test('mobile: el dropdown conserva la estructura crítica y no recorta enlaces', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const navState = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      const bar = document.querySelector('.header__barra');
      const activeLinks = Array.from(document.querySelectorAll('.navegacion__enlace')).filter((link) =>
        link.classList.contains('active')
      );

      return {
        activeBackgroundColor: activeLinks[0] ? window.getComputedStyle(activeLinks[0]).backgroundColor : '',
        activeLinks: activeLinks.length,
        backdropFilter: window.getComputedStyle(nav).backdropFilter,
        backgroundColor: window.getComputedStyle(nav).backgroundColor,
        left: window.getComputedStyle(nav).left,
        overflow: window.getComputedStyle(bar).overflow,
        position: window.getComputedStyle(nav).position,
        right: window.getComputedStyle(nav).right,
        top: window.getComputedStyle(nav).top,
        visibleLinkCount: Array.from(document.querySelectorAll('.navegacion__enlace')).filter((link) => {
          const rect = link.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
      };
    });

    expect(navState.position).toBe('absolute');
    expect(parseInt(navState.top, 10)).toBeGreaterThan(0);
    expect(navState.left).toBe('0px');
    expect(navState.right).toBe('0px');
    expect(navState.overflow).not.toBe('hidden');
    expect(navState.backgroundColor).toMatch(/rgba\(2,\s*66,\s*122,\s*0\.85\)/);
    expect(navState.backdropFilter).toContain('blur');
    expect(navState.visibleLinkCount).toBeGreaterThan(0);
    expect(navState.activeLinks).toBe(1);
    expect(navState.activeBackgroundColor).toMatch(/rgba\(255,\s*255,\s*255/);
  });

  test('mobile: el dropdown adapta el fondo en modo oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    await page.click('.header__modo-boton');
    await page.waitForTimeout(500);
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const backgroundColor = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backgroundColor;
    });

    expect(backgroundColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.85\)/);
  });
});
