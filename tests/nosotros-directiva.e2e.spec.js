// Panel "La Directiva" del acordeón Nosotros (v4.23.0): tarjetas por cargo con
// icono, cargo traducido y nombres como chips, en index.html y lafalla.html.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PAGES = ['/index.html', '/lafalla.html'];
const NOMBRES = [
  'José Santos Quiles',
  'Maite Cabezuelo', 'Prados Ramos', 'Pablo Cortés',
  'Paula Peiró',
  'David Gómez', 'Miguel Ángel Pallardó',
  'Sara Medina'
];

async function abrirDirectiva(page, url) {
  await page.goto(url);
  const titular = page.locator('.accordion__titular').filter({ hasText: /La Directiva/ }).first();
  await titular.scrollIntoViewIfNeeded();
  await titular.click();
  const directiva = page.locator('.directiva').first();
  await expect(directiva).toBeVisible();
  return directiva;
}

for (const url of PAGES) {
  test.describe(`La Directiva — ${url}`, () => {
    test('cinco tarjetas con icono, cargo y los ocho nombres en orden', async ({ page }) => {
      const directiva = await abrirDirectiva(page, url);
      const cards = directiva.locator('.directiva__card');
      await expect(cards).toHaveCount(5);
      await expect(directiva.locator('.directiva__cargo svg.directiva__icono')).toHaveCount(5);
      await expect(cards.first()).toHaveClass(/directiva__card--presidente/);
      await expect(directiva.locator('.directiva__nombre')).toHaveText(NOMBRES);
      // Los cargos salen de translations.json (ES)
      await expect(directiva.locator('.directiva__cargo span')).toHaveText([
        'Presidente', 'Vicepresidentes', 'Secretaría', 'Área Económica', 'Delegación Infantil'
      ]);
    });

    test('los chips no llevan viñeta y el presidente va en coral', async ({ page }) => {
      const directiva = await abrirDirectiva(page, url);
      const lista = directiva.locator('.directiva__nombres').first();
      await expect(lista).toHaveCSS('list-style-type', 'none');
      const chipPresidente = directiva.locator('.directiva__card--presidente .directiva__nombre');
      await expect(chipPresidente).toHaveCSS('background-color', 'rgb(255, 111, 97)');
      await expect(chipPresidente).toHaveCSS('color', 'rgb(255, 255, 255)');
    });

    test('grid responsivo: 1 columna en móvil, 3 en escritorio', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      let directiva = await abrirDirectiva(page, url);
      const columnas = async () => (await directiva.evaluate((el) => getComputedStyle(el).gridTemplateColumns)).trim().split(/\s+/).length;
      expect(await columnas()).toBe(1);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(300);
      expect(await columnas()).toBe(3);
      // Vicepresidentes ocupa dos columnas para que sus tres chips vayan en fila
      const vice = directiva.locator('.directiva__card--vicepresidentes');
      const presidente = directiva.locator('.directiva__card--presidente');
      const [bVice, bPres, bDir] = await Promise.all([vice.boundingBox(), presidente.boundingBox(), directiva.boundingBox()]);
      expect(bPres.width).toBeGreaterThan(bDir.width * 0.95);
      expect(bVice.width).toBeGreaterThan(bDir.width * 0.55);
    });

    test('modo oscuro: tarjeta oscura con texto claro legible', async ({ page }) => {
      await page.goto(url);
      await page.click('#botonModoOscuro');
      await page.waitForTimeout(2600);
      const titular = page.locator('.accordion__titular').filter({ hasText: /La Directiva/ }).first();
      await titular.scrollIntoViewIfNeeded();
      await titular.click();
      const card = page.locator('.directiva__card--vicepresidentes').first();
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS('background-color', 'rgb(17, 17, 17)');
      const chip = card.locator('.directiva__nombre').first();
      await expect(chip).toHaveCSS('color', 'rgb(245, 245, 245)');
      await expect(chip).toHaveCSS('background-color', 'rgb(68, 68, 68)');
    });
  });
}

test('el pre-render VA hornea los cargos en valenciano', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'dist', 'va', 'index.html'), 'utf8');
  expect(html).toMatch(/data-i18n="directiva\.vicepresidentes">Vicepresidents</);
  expect(html).toMatch(/data-i18n="directiva\.dinfantil">Delegació Infantil</);
  expect(html).not.toContain('accordion__directiva');
});
