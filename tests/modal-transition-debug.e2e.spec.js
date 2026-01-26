/**
 * Test de depuración visual para la transición del modal oscuro→claro
 * Captura screenshots en cada paso para verificar visualmente
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Modal Transition Debug - Screenshots', () => {

  test('Capturar transición oscuro→claro con screenshots', async ({ page }) => {
    // Crear directorio para screenshots si no existe
    const screenshotDir = 'tests/screenshots-modal-debug';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    await page.goto('/');

    // 1. Activar modo oscuro ANTES de abrir el modal
    await page.evaluate(() => {
      localStorage.setItem('darkMode', 'true');
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Verificar que está en modo oscuro
    const isDarkMode = await page.evaluate(() => document.body.classList.contains('modo-oscuro'));
    console.log('Modo oscuro activo:', isDarkMode);
    expect(isDarkMode).toBe(true);

    // 2. Abrir el modal
    await page.click('#open-quieres-modal');
    await expect(page.locator('#modal-quieres')).toBeVisible();
    await page.waitForTimeout(300);

    // Screenshot inicial (modo oscuro)
    await page.screenshot({ path: path.join(screenshotDir, '01-modal-dark.png') });
    console.log('Screenshot 1: Modal en modo oscuro');

    // Capturar estilos computados del modal
    const stylesBeforeClick = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      const cs = window.getComputedStyle(modal);
      return {
        backgroundColor: cs.backgroundColor,
        transitionProperty: cs.transitionProperty,
        transitionDuration: cs.transitionDuration,
        transitionTimingFunction: cs.transitionTimingFunction,
      };
    });
    console.log('Estilos ANTES del click:', JSON.stringify(stylesBeforeClick, null, 2));

    // 3. Click en botón de modo (cambiar a claro)
    // Primero verificamos que la clase transicion-a-claro se aplica
    await page.evaluate(() => {
      // Escuchar el click para verificar el orden de operaciones
      window._transitionDebug = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            window._transitionDebug.push({
              time: performance.now(),
              classList: document.body.className,
            });
          }
        });
      });
      observer.observe(document.body, { attributes: true });
    });

    // Click en el botón
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      btn.click();
    });

    // Screenshot inmediatamente después del click (0ms)
    await page.screenshot({ path: path.join(screenshotDir, '02-modal-0ms.png') });
    console.log('Screenshot 2: Inmediatamente después del click');

    // Capturar color justo después del click
    const colorAt0ms = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color a 0ms:', colorAt0ms);

    // Verificar que transicion-a-claro se aplicó
    const hasTransicionAClaro = await page.evaluate(() =>
      document.body.classList.contains('transicion-a-claro')
    );
    console.log('transicion-a-claro aplicado:', hasTransicionAClaro);

    // Screenshot a 100ms
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(screenshotDir, '03-modal-100ms.png') });
    const colorAt100ms = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color a 100ms:', colorAt100ms);

    // Screenshot a 500ms
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, '04-modal-500ms.png') });
    const colorAt500ms = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color a 500ms:', colorAt500ms);

    // Screenshot a 1000ms
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '05-modal-1000ms.png') });
    const colorAt1000ms = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color a 1000ms:', colorAt1000ms);

    // Screenshot a 2000ms
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '06-modal-2000ms.png') });
    const colorAt2000ms = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color a 2000ms:', colorAt2000ms);

    // Screenshot final a 3000ms
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '07-modal-3000ms.png') });
    const colorFinal = await page.evaluate(() => {
      const modal = document.getElementById('modal-quieres-content');
      return window.getComputedStyle(modal).backgroundColor;
    });
    console.log('Color final (3000ms):', colorFinal);

    // Ver log de cambios de clase
    const debugLog = await page.evaluate(() => window._transitionDebug);
    console.log('Log de cambios de clase:', JSON.stringify(debugLog, null, 2));

    // Análisis de la transición
    console.log('\n=== ANÁLISIS ===');
    const colors = [
      { time: '0ms', color: colorAt0ms },
      { time: '100ms', color: colorAt100ms },
      { time: '500ms', color: colorAt500ms },
      { time: '1000ms', color: colorAt1000ms },
      { time: '2000ms', color: colorAt2000ms },
      { time: '3000ms', color: colorFinal },
    ];

    // Extraer valor R de cada color
    const rValues = colors.map(c => {
      const match = c.color.match(/rgb\((\d+)/);
      return match ? parseInt(match[1]) : null;
    });

    console.log('Valores R a lo largo del tiempo:', rValues);

    // Verificar si hay salto instantáneo
    if (rValues[0] === rValues[1] || Math.abs(rValues[0] - rValues[1]) < 5) {
      console.log('✓ El color NO cambió instantáneamente a 100ms');
    } else if (rValues[1] === 255 || rValues[1] > 200) {
      console.log('✗ PROBLEMA: El color saltó a blanco casi instantáneamente');
    }

    // El color debería ir aumentando gradualmente de ~51 a 255
    const isGradual = rValues.every((r, i, arr) => {
      if (i === 0) return true;
      return r >= arr[i-1]; // Cada valor debe ser >= al anterior
    });
    console.log('Transición gradual:', isGradual ? '✓ Sí' : '✗ No');

    // Guardar resumen
    const summary = {
      stylesBeforeClick,
      hasTransicionAClaro,
      colors,
      rValues,
      isGradual,
    };
    fs.writeFileSync(
      path.join(screenshotDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('\nScreenshots guardados en:', screenshotDir);
  });

  test('Verificar CSS: especificidad de transiciones', async ({ page }) => {
    await page.goto('/');

    // Cargar el CSS y buscar reglas problemáticas
    const cssAnalysis = await page.evaluate(() => {
      const results = {
        modalContentRules: [],
        transicionAClaroRules: [],
        importantDeclarations: [],
      };

      // Buscar todas las reglas que afectan al modal
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const selector = rule.selectorText || '';
            const cssText = rule.cssText || '';

            if (selector.includes('modal-quieres') || selector.includes('modal-content')) {
              results.modalContentRules.push({
                selector,
                hasTransition: cssText.includes('transition'),
                hasImportant: cssText.includes('!important'),
              });
            }

            if (selector.includes('transicion-a-claro')) {
              results.transicionAClaroRules.push(selector);
            }

            if (cssText.includes('!important') && selector.includes('modal')) {
              results.importantDeclarations.push({ selector, cssText: cssText.substring(0, 200) });
            }
          }
        } catch (e) {
          // CORS error for external stylesheets
        }
      }

      return results;
    });

    console.log('\n=== ANÁLISIS DE CSS ===');
    console.log('Reglas que afectan al modal:', cssAnalysis.modalContentRules.length);
    console.log('Reglas con transicion-a-claro:', cssAnalysis.transicionAClaroRules.length);
    console.log('Declaraciones !important en modal:', cssAnalysis.importantDeclarations.length);

    if (cssAnalysis.importantDeclarations.length > 0) {
      console.log('\n⚠️ POSIBLE PROBLEMA: Declaraciones !important encontradas:');
      cssAnalysis.importantDeclarations.forEach(d => {
        console.log(`  - ${d.selector}`);
      });
    }

    // Verificar que hay reglas de transición
    const hasTransitionRules = cssAnalysis.modalContentRules.some(r => r.hasTransition);
    console.log('\nTiene reglas de transición:', hasTransitionRules ? '✓' : '✗');
  });

  test('Simular flujo real del usuario', async ({ page }) => {
    await page.goto('/');

    // Empezar en modo claro (default)
    console.log('1. Página cargada en modo claro');

    // Abrir modal
    await page.click('#open-quieres-modal');
    await expect(page.locator('#modal-quieres')).toBeVisible();
    console.log('2. Modal abierto');

    // Capturar color inicial (modo claro)
    let color = await page.evaluate(() =>
      window.getComputedStyle(document.getElementById('modal-quieres-content')).backgroundColor
    );
    console.log('3. Color en modo claro:', color);

    // Cambiar a modo OSCURO (esto el usuario dice que funciona bien)
    await page.evaluate(() => document.getElementById('botonModoOscuro').click());
    await page.waitForTimeout(3000); // Esperar transición completa

    color = await page.evaluate(() =>
      window.getComputedStyle(document.getElementById('modal-quieres-content')).backgroundColor
    );
    console.log('4. Color después de cambiar a oscuro:', color);
    expect(color).toBe('rgb(51, 51, 51)'); // Debería ser gris oscuro

    // Ahora cambiar de vuelta a CLARO (esto es lo que NO funciona según el usuario)
    console.log('5. Cambiando de oscuro a claro...');

    // Capturar varios puntos durante la transición
    await page.evaluate(() => document.getElementById('botonModoOscuro').click());

    const measurements = [];
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(300);
      const c = await page.evaluate(() =>
        window.getComputedStyle(document.getElementById('modal-quieres-content')).backgroundColor
      );
      measurements.push({ time: (i + 1) * 300, color: c });
    }

    console.log('6. Mediciones durante transición oscuro→claro:');
    measurements.forEach(m => console.log(`   ${m.time}ms: ${m.color}`));

    // Verificar que hubo transición gradual
    const firstColor = measurements[0].color;
    const lastColor = measurements[measurements.length - 1].color;

    console.log('\n=== RESULTADO ===');
    if (firstColor === lastColor) {
      console.log('✗ PROBLEMA: El color no cambió durante 3 segundos');
    } else if (firstColor === 'rgb(255, 255, 255)') {
      console.log('✗ PROBLEMA: El color saltó a blanco instantáneamente');
    } else {
      console.log('✓ La transición parece estar funcionando');
    }
  });
});
