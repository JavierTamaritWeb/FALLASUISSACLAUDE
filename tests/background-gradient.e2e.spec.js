// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Tests para verificar que el fondo gradiente funciona correctamente
 * en todos los navegadores (Chrome, Safari desktop, Safari iOS)
 */

test.describe('Background Gradient - Modo Claro', () => {
  test.beforeEach(async ({ page }) => {
    // Asegurar modo claro
    await page.addInitScript(() => {
      localStorage.removeItem('darkMode');
    });
  });

  test('El fondo debe tener el color azul corporativo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Obtener el color de fondo del body o html
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      // Verificar body primero
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const htmlBg = window.getComputedStyle(html).backgroundColor;

      // También verificar si hay un pseudo-elemento
      const bodyBefore = window.getComputedStyle(body, '::before').backgroundColor;

      return {
        body: bodyBg,
        html: htmlBg,
        bodyBefore: bodyBefore,
        // Obtener el color en un punto específico de la página
        bodyBgImage: window.getComputedStyle(body).backgroundImage,
        htmlBgImage: window.getComputedStyle(html).backgroundImage
      };
    });

    console.log('Background colors:', bgColor);

    // El fondo debe contener el gradiente o el color azul corporativo #0a4b8d
    const hasGradient = bgColor.bodyBgImage.includes('gradient') ||
                        bgColor.htmlBgImage.includes('gradient');
    const hasBlueColor = bgColor.body.includes('10, 75, 141') || // rgb de #0a4b8d
                         bgColor.html.includes('10, 75, 141') ||
                         bgColor.bodyBefore.includes('10, 75, 141');

    expect(hasGradient || hasBlueColor).toBeTruthy();
  });

  test('El fondo debe cubrir todo el viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Tomar screenshot del viewport para verificar visualmente
    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot).toBeTruthy();

    // Verificar que no hay espacios blancos en la parte superior
    const topPixelColor = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');

      // No podemos obtener el color de pixel directamente, pero podemos verificar
      // que el html/body tienen altura completa
      const htmlHeight = document.documentElement.scrollHeight;
      const bodyHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;

      return {
        htmlHeight,
        bodyHeight,
        viewportHeight,
        bodyMinHeight: window.getComputedStyle(document.body).minHeight
      };
    });

    console.log('Heights:', topPixelColor);

    // El body debe tener al menos la altura del viewport
    expect(topPixelColor.bodyHeight).toBeGreaterThanOrEqual(topPixelColor.viewportHeight - 10);
  });

  test('El fondo debe mantenerse al hacer scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Hacer scroll hacia abajo
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);

    // Verificar que el fondo sigue visible (no hay huecos blancos)
    const bgAfterScroll = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        bodyBgImage: window.getComputedStyle(body).backgroundImage,
        htmlBg: window.getComputedStyle(html).backgroundColor,
        htmlBgImage: window.getComputedStyle(html).backgroundImage
      };
    });

    console.log('Background after scroll:', bgAfterScroll);

    // Debe seguir teniendo el gradiente o color azul
    const hasBackground = bgAfterScroll.bodyBgImage.includes('gradient') ||
                          bgAfterScroll.htmlBgImage.includes('gradient') ||
                          bgAfterScroll.bodyBg.includes('10, 75, 141') ||
                          bgAfterScroll.htmlBg.includes('10, 75, 141');

    expect(hasBackground).toBeTruthy();
  });
});

test.describe('Background Gradient - Modo Oscuro', () => {
  test.beforeEach(async ({ page }) => {
    // Activar modo oscuro
    await page.addInitScript(() => {
      localStorage.setItem('darkMode', 'true');
    });
  });

  test('El fondo debe ser negro en modo oscuro', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Esperar a que se complete la transición CSS (2.4s + margen)
    await page.waitForTimeout(3000);

    const bgColor = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        htmlBg: window.getComputedStyle(html).backgroundColor,
        bodyBgImage: window.getComputedStyle(body).backgroundImage,
        htmlBgImage: window.getComputedStyle(html).backgroundImage,
        bodyHasDarkClass: body.classList.contains('modo-oscuro'),
        htmlHasDarkClass: html.classList.contains('modo-oscuro')
      };
    });

    console.log('Dark mode background:', bgColor);

    // Verificar que la clase modo-oscuro está aplicada
    expect(bgColor.bodyHasDarkClass || bgColor.htmlHasDarkClass).toBeTruthy();

    // En modo oscuro, debe tener fondo negro (rgb(0, 0, 0)) o muy oscuro
    const isBlack = bgColor.bodyBg.includes('0, 0, 0') ||
                    bgColor.htmlBg.includes('0, 0, 0') ||
                    bgColor.bodyBg.includes('17, 17, 17') || // #111
                    bgColor.htmlBg.includes('17, 17, 17');

    expect(isBlack).toBeTruthy();
  });
});

test.describe('Background Gradient - CSS compilado', () => {
  test('El CSS debe contener las reglas de fondo necesarias', async ({ page }) => {
    // Leer el CSS compilado
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '..', 'dist', 'css', 'main.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verificar que existe el gradiente
    expect(cssContent).toMatch(/linear-gradient.*#0a4b8d|#0a4b8d.*linear-gradient/i);

    // Verificar que existe regla para modo oscuro
    expect(cssContent).toMatch(/modo-oscuro/);
  });
});
