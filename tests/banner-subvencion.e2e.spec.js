const { test, expect } = require('@playwright/test');

const MOBILE_VIEWPORT = { width: 360, height: 740 };
const MIN_TOUCH_TARGET_SIZE = 44;
const TOUCH_TARGET_TOLERANCE = 0.1;

async function expectBannerCanClose(page, options = {}) {
  const { openMenu = false } = options;
  const banner = page.locator('#banner-subvencion');
  const closeButton = banner.locator('.banner-subvencion__cerrar');

  await expect(banner).toBeVisible();
  await expect(closeButton).toBeVisible();

  const closeButtonBox = await closeButton.boundingBox();
  expect(closeButtonBox?.width ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - TOUCH_TARGET_TOLERANCE);
  expect(closeButtonBox?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - TOUCH_TARGET_TOLERANCE);

  if (openMenu) {
    const menuToggle = page.locator('.header__menu-toggle').first();
    const nav = page.locator('.navegacion').first();
    const backdrop = page.locator('.nav-backdrop').first();

    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await expect(nav).toHaveClass(/is-open/);
    await expect(backdrop).toHaveClass(/is-active/);
  }

  const topElementClass = await closeButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

    if (!(topElement instanceof Element)) {
      return '';
    }

    return [
      topElement.className,
      topElement.closest('.banner-subvencion__cerrar')?.className || ''
    ].join(' ').trim();
  });

  expect(topElementClass).toContain('banner-subvencion__cerrar');

  await closeButton.click();
  await expect(page.locator('#banner-subvencion')).toHaveCount(0);
}

test.describe('Banner de subvención', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('bannerSubvencionCerrado', 'false');
    });
  });

  test('index lo muestra una vez por sesión del navegador', async ({ page, context, browser }) => {
    const banner = page.locator('#banner-subvencion');

    await page.goto('/index.html');
    await expect(banner).toBeVisible();
    const cookies = await context.cookies();
    const sesion = cookies.find((c) => c.name === 'bannerSubvencionSesion');
    expect(sesion?.value).toBe('1');
    expect(sesion?.expires).toBe(-1); // cookie de sesión, sin caducidad

    // Misma sesión: ni al recargar, ni al volver, ni en otra pestaña
    await page.reload();
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);
    await page.goto('/lafalla.html');
    await page.goto('/index.html');
    await expect(page.locator('#banner-subvencion')).toHaveCount(0);
    const otraPestana = await context.newPage();
    await otraPestana.goto('/index.html');
    await expect(otraPestana.locator('#banner-subvencion')).toHaveCount(0);

    // ?forzarBanner=1 lo vuelve a mostrar
    await page.goto('/index.html?forzarBanner=1');
    await expect(page.locator('#banner-subvencion')).toBeVisible();

    // Sesión nueva (otro contexto): vuelve a salir
    const nuevo = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    await nuevo.addInitScript(() => localStorage.setItem('bannerSubvencionCerrado', 'false'));
    const p2 = await nuevo.newPage();
    await p2.goto('/index.html');
    await expect(p2.locator('#banner-subvencion')).toBeVisible();
    await nuevo.close();
  });

  test('index permite cerrar el banner con la X en móvil', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/index.html');

    await expectBannerCanClose(page);
  });

  test('index permite cerrar el banner con la X en móvil con el menú abierto', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/index.html');

    await expectBannerCanClose(page, { openMenu: true });
  });
});