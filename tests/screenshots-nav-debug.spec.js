const { test } = require('@playwright/test');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots-nav-debug');

test.describe('Debug: Navegación desktop', () => {
  test.beforeAll(async () => {
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('Capturar navegación en modo claro y oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.waitForTimeout(1000);

    // 1. Modo claro - página completa
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-claro-pagina.png'),
      fullPage: false
    });

    // 2. Modo claro - solo barra
    const barClaro = page.locator('.header__barra');
    await barClaro.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-claro-barra.png')
    });

    // 3. Debug: obtener estilos
    const estilosClaro = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      const beforeStyle = window.getComputedStyle(bar, '::before');
      const enlaces = document.querySelectorAll('.navegacion__enlace');

      return {
        barBackground: window.getComputedStyle(bar).background,
        beforeBackground: beforeStyle.background,
        beforeOpacity: beforeStyle.opacity,
        enlaces: Array.from(enlaces).map(e => ({
          text: e.textContent.trim(),
          color: window.getComputedStyle(e).color,
          opacity: window.getComputedStyle(e).opacity
        }))
      };
    });
    console.log('MODO CLARO:', JSON.stringify(estilosClaro, null, 2));

    // 4. Activar modo oscuro
    await page.click('.header__modo-boton');
    await page.waitForTimeout(3000);

    // 5. Modo oscuro - página completa
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-oscuro-pagina.png'),
      fullPage: false
    });

    // 6. Modo oscuro - solo barra
    const barOscuro = page.locator('.header__barra');
    await barOscuro.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-oscuro-barra.png')
    });

    // 7. Debug: obtener estilos en oscuro
    const estilosOscuro = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      const beforeStyle = window.getComputedStyle(bar, '::before');
      const enlaces = document.querySelectorAll('.navegacion__enlace');

      return {
        barBackground: window.getComputedStyle(bar).background,
        beforeBackground: beforeStyle.background,
        beforeOpacity: beforeStyle.opacity,
        enlaces: Array.from(enlaces).map(e => ({
          text: e.textContent.trim(),
          color: window.getComputedStyle(e).color,
          opacity: window.getComputedStyle(e).opacity
        }))
      };
    });
    console.log('MODO OSCURO:', JSON.stringify(estilosOscuro, null, 2));
  });
});
