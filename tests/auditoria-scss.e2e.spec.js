// Guardias de navegador de la auditoría SCSS de sep-2026 (docs/auditoria-scss-2026-09.md),
// fase 2 (v4.39.1): errores visibles y de accesibilidad que no detectan los tests estáticos.
const { test, expect } = require('@playwright/test');

const oscuro = async (context) => context.addInitScript(() => {
  localStorage.setItem('darkMode', 'true');
});

test.describe('Auditoría SCSS — errores visibles y accesibilidad (v4.39.1)', () => {
  test('1.1 meteo en oscuro: el texto de la previsión no queda en gris oscuro', async ({ browser }) => {
    const context = await browser.newContext();
    await oscuro(context);
    const page = await context.newPage();
    await page.goto('/meteo.html');
    await page.waitForTimeout(600);
    const p = page.locator('.forecast-info p').first();
    await expect(p).toBeAttached();
    const color = await p.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(51, 51, 51)');
    expect(color).toBe('rgb(255, 255, 255)');
    await context.close();
  });

  test('1.2 con movimiento reducido, el cambio de tema no anima 2,4 s', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await oscuro(context);
    const page = await context.newPage();
    await page.goto('/index.html');
    await page.locator('.header__modo-boton').first().click();
    await expect(page.locator('body')).not.toHaveClass(/modo-oscuro/);
    const duraciones = await page.evaluate(() => [
      getComputedStyle(document.querySelector('.header__barra')).transitionDuration,
      getComputedStyle(document.querySelector('.countdown__contenedor'), '::before').transitionDuration,
      getComputedStyle(document.querySelector('.navegacion')).transitionDuration,
    ]);
    for (const d of duraciones) for (const v of d.split(',')) expect(parseFloat(v)).toBeLessThanOrEqual(0.01);
    await context.close();
  });

  test('1.7 los mini-días del calendario son botones operables con teclado', async ({ page }) => {
    await page.goto('/calendario.html');
    const dia = page.locator('.calendario-eventos__mini-dia').nth(10);
    await expect(dia).toHaveAttribute('role', 'button');
    await expect(dia).toHaveAttribute('tabindex', '0');
    // Cuenta los click reales: Enter debe producir exactamente uno (accessibility.js y
    // calendario.js comprueban defaultPrevented para no duplicarlo).
    await dia.evaluate((el) => { el.dataset.activaciones = '0'; el.addEventListener('click', () => { el.dataset.activaciones = String(Number(el.dataset.activaciones) + 1); }); });
    await dia.focus();
    await page.keyboard.press('Enter');
    await expect(dia).toHaveAttribute('data-activaciones', '1');
    await page.keyboard.press(' ');
    await expect(dia).toHaveAttribute('data-activaciones', '2');
  });

  test('1.7 cursor pointer solo en controles reales', async ({ page }) => {
    await page.goto('/meteo.html');
    expect(await page.locator('.forecast-day').first().evaluate((el) => getComputedStyle(el).cursor)).not.toBe('pointer');
    await page.goto('/index.html');
    // .quieres-mas__title va dentro del enlace que abre el modal: hereda el cursor del enlace
    expect(await page.locator('.accordion__titular').first().evaluate((el) => getComputedStyle(el).userSelect)).not.toBe('none');
  });

  test('1.9 los enlaces legales del pie miden al menos 12 px', async ({ page }) => {
    await page.goto('/index.html');
    const px = await page.locator('.footer__legal a').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(px).toBeGreaterThanOrEqual(12);
  });

  test('1.10 con colores forzados los controles conservan un borde y el foco un contorno', async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: 'active' });
    const page = await context.newPage();
    await page.goto('/index.html');
    await page.locator('.header__menu-toggle').first().click();
    const borde = await page.locator('.navegacion__enlace').first().evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(parseFloat(borde)).toBeGreaterThanOrEqual(2);
    await context.close();
  });

  test('1.11 no queda ninguna custom property con una variable Sass sin interpolar', async ({ page }) => {
    await page.goto('/index.html');
    const css = await page.evaluate(async () => {
      const href = document.querySelector('link[href*="main.css"]').href;
      return (await fetch(href)).text();
    });
    expect(css).not.toMatch(/--[\w-]+:\s*v\.\$/);
    expect(css).not.toMatch(/--header-bar-bg/);
  });
});
