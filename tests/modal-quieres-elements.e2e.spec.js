/**
 * Tests diagnósticos para la transición oscuro→claro del modal "quieres"
 * Verifica que TODOS los elementos del modal transicionen suavemente
 */
import { test, expect } from '@playwright/test';

test.describe('Modal Quieres - Diagnóstico de transición oscuro→claro', () => {

  // Elementos a verificar
  const elementos = [
    { selector: '#modal-quieres-content', nombre: 'Modal Content', propiedad: 'backgroundColor' },
    { selector: '#modal-quieres .modal-title', nombre: 'Modal Title', propiedad: 'color' },
    { selector: '#modal-quieres .close-modal', nombre: 'Close Button', propiedad: 'color' },
    { selector: '#quieres-form label', nombre: 'Form Label', propiedad: 'color' },
    { selector: '#quieres-nombre', nombre: 'Input Nombre', propiedad: 'backgroundColor' },
    { selector: '#quieres-email', nombre: 'Input Email', propiedad: 'backgroundColor' },
    { selector: '#quieres-telefono', nombre: 'Input Telefono', propiedad: 'backgroundColor' },
    { selector: '#quieres-mensaje', nombre: 'Textarea Mensaje', propiedad: 'backgroundColor' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Forzar modo oscuro inmediatamente
    await page.evaluate(() => {
      document.body.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.add('modo-oscuro');
      document.documentElement.classList.remove('modo-claro');
    });
    // Abrir modal
    await page.click('#open-quieres-modal');
    await expect(page.locator('#modal-quieres')).toBeVisible();
    // Esperar a que el modal esté completamente renderizado
    await page.waitForTimeout(100);
  });

  test('Verificar propiedades de transición en modo oscuro', async ({ page }) => {
    const resultados = [];

    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        const styles = await locator.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            transitionProperty: cs.transitionProperty,
            transitionDuration: cs.transitionDuration,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
          };
        });
        resultados.push({ ...elem, styles });
      }
    }

    console.log('\n=== PROPIEDADES DE TRANSICIÓN EN MODO OSCURO ===');
    for (const r of resultados) {
      console.log(`\n${r.nombre} (${r.selector}):`);
      console.log(`  transition-property: ${r.styles.transitionProperty}`);
      console.log(`  transition-duration: ${r.styles.transitionDuration}`);
      console.log(`  background-color: ${r.styles.backgroundColor}`);
      console.log(`  color: ${r.styles.color}`);

      // Verificar que tiene transición configurada
      const hasTransition = r.styles.transitionDuration !== '0s' &&
                           r.styles.transitionProperty !== 'none';
      expect(hasTransition, `${r.nombre} debe tener transición configurada`).toBe(true);
    }
  });

  test('Verificar que transicion-a-claro aplica las transiciones', async ({ page }) => {
    // Aplicar la clase transicion-a-claro (como lo hace dark.js)
    await page.evaluate(() => {
      document.body.classList.add('transicion-a-claro');
      document.documentElement.classList.add('transicion-a-claro');
    });

    const resultados = [];

    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        const styles = await locator.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            transitionProperty: cs.transitionProperty,
            transitionDuration: cs.transitionDuration,
          };
        });
        resultados.push({ ...elem, styles });
      }
    }

    console.log('\n=== PROPIEDADES DE TRANSICIÓN CON transicion-a-claro ===');
    for (const r of resultados) {
      console.log(`\n${r.nombre}:`);
      console.log(`  transition-property: ${r.styles.transitionProperty}`);
      console.log(`  transition-duration: ${r.styles.transitionDuration}`);
    }
  });

  test('Transición completa oscuro→claro: capturar valores intermedios', async ({ page }) => {
    console.log('\n=== TRANSICIÓN OSCURO → CLARO ===');

    // Capturar valores iniciales (modo oscuro)
    const valoresIniciales = {};
    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        valoresIniciales[elem.nombre] = await locator.evaluate((el, prop) => {
          return window.getComputedStyle(el)[prop];
        }, elem.propiedad);
      }
    }

    console.log('\n--- Valores iniciales (modo oscuro) ---');
    for (const [nombre, valor] of Object.entries(valoresIniciales)) {
      console.log(`${nombre}: ${valor}`);
    }

    // Activar transición a claro (simular click en botón)
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      if (btn) btn.click();
    });

    // Capturar a los 500ms
    await page.waitForTimeout(500);
    const valores500ms = {};
    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        valores500ms[elem.nombre] = await locator.evaluate((el, prop) => {
          return window.getComputedStyle(el)[prop];
        }, elem.propiedad);
      }
    }

    console.log('\n--- Valores a 500ms ---');
    for (const [nombre, valor] of Object.entries(valores500ms)) {
      const inicial = valoresIniciales[nombre];
      const cambio = valor !== inicial ? '✓ CAMBIANDO' : '✗ SIN CAMBIO';
      console.log(`${nombre}: ${valor} ${cambio}`);
    }

    // Capturar a los 1500ms
    await page.waitForTimeout(1000);
    const valores1500ms = {};
    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        valores1500ms[elem.nombre] = await locator.evaluate((el, prop) => {
          return window.getComputedStyle(el)[prop];
        }, elem.propiedad);
      }
    }

    console.log('\n--- Valores a 1500ms ---');
    for (const [nombre, valor] of Object.entries(valores1500ms)) {
      const inicial = valoresIniciales[nombre];
      const cambio = valor !== inicial ? '✓ CAMBIANDO' : '✗ SIN CAMBIO';
      console.log(`${nombre}: ${valor} ${cambio}`);
    }

    // Capturar valores finales (después de 3s)
    await page.waitForTimeout(1500);
    const valoresFinales = {};
    for (const elem of elementos) {
      const locator = page.locator(elem.selector).first();
      if (await locator.count() > 0) {
        valoresFinales[elem.nombre] = await locator.evaluate((el, prop) => {
          return window.getComputedStyle(el)[prop];
        }, elem.propiedad);
      }
    }

    console.log('\n--- Valores finales (después de 3s) ---');
    for (const [nombre, valor] of Object.entries(valoresFinales)) {
      const inicial = valoresIniciales[nombre];
      const transicionCompleta = valor !== inicial ? '✓ TRANSICIONÓ' : '✗ NO TRANSICIONÓ';
      console.log(`${nombre}: ${valor} ${transicionCompleta}`);
    }

    // Verificar que todos los elementos transicionaron
    console.log('\n=== RESUMEN ===');
    let todosTransicionaron = true;
    for (const elem of elementos) {
      const inicial = valoresIniciales[elem.nombre];
      const final = valoresFinales[elem.nombre];
      const transiciono = inicial !== final;
      if (!transiciono) {
        console.log(`❌ ${elem.nombre} NO transicionó: ${inicial} → ${final}`);
        todosTransicionaron = false;
      } else {
        console.log(`✅ ${elem.nombre} transicionó: ${inicial} → ${final}`);
      }
    }

    expect(todosTransicionaron, 'Todos los elementos deben transicionar').toBe(true);
  });

  test('Verificar CSS compilado tiene reglas de transición para modal', async ({ page }) => {
    // Leer el CSS compilado
    const cssContent = await page.evaluate(async () => {
      const response = await fetch('/css/styles.css');
      return await response.text();
    });

    // Verificar reglas específicas
    const reglas = [
      { patron: /transicion-a-claro.*#modal-quieres-content/s, descripcion: 'transicion-a-claro para modal-content' },
      { patron: /transicion-a-claro.*#quieres-nombre/s, descripcion: 'transicion-a-claro para input nombre' },
      { patron: /#quieres-nombre.*transition/s, descripcion: 'transition en input nombre' },
    ];

    console.log('\n=== VERIFICACIÓN DE CSS COMPILADO ===');
    for (const regla of reglas) {
      const existe = regla.patron.test(cssContent);
      console.log(`${existe ? '✓' : '✗'} ${regla.descripcion}`);
    }
  });
});

test.describe('Modal Quieres - Test de regresión visual de transición', () => {

  test('La transición debe ser gradual, no instantánea', async ({ page }) => {
    await page.goto('/');

    // Forzar modo oscuro
    await page.evaluate(() => {
      document.body.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.add('modo-oscuro');
    });

    // Abrir modal
    await page.click('#open-quieres-modal');
    await expect(page.locator('#modal-quieres')).toBeVisible();
    await page.waitForTimeout(100);

    // Obtener color inicial del contenido del modal
    const modalContent = page.locator('#modal-quieres-content');
    const colorInicial = await modalContent.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log('Color inicial (oscuro):', colorInicial);

    // Cambiar a modo claro
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      if (btn) btn.click();
    });

    // Capturar color inmediatamente (50ms)
    await page.waitForTimeout(50);
    const color50ms = await modalContent.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Si la transición es gradual, el color a 50ms debe ser muy cercano al inicial
    // No debe haber saltado directamente al color final (blanco)
    console.log('Color a 50ms:', color50ms);

    // El color NO debe ser blanco todavía (rgb(255, 255, 255))
    expect(color50ms).not.toBe('rgb(255, 255, 255)');

    // Y debe estar todavía cerca del color oscuro (no haber cambiado drásticamente)
    // Extraer componente R del RGB
    const matchInicial = colorInicial.match(/rgb\((\d+)/);
    const match50ms = color50ms.match(/rgb\((\d+)/);

    if (matchInicial && match50ms) {
      const rInicial = parseInt(matchInicial[1]);
      const r50ms = parseInt(match50ms[1]);
      const diferencia = Math.abs(r50ms - rInicial);

      console.log(`Diferencia de R a 50ms: ${diferencia} (inicial: ${rInicial}, 50ms: ${r50ms})`);

      // A 50ms no debería haber cambiado más de ~20 unidades si la transición es de 2.4s
      expect(diferencia).toBeLessThan(50);
    }

    // Esperar a que termine la transición
    await page.waitForTimeout(3000);
    const colorFinal = await modalContent.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log('Color final:', colorFinal);

    // Debe ser blanco al final
    expect(colorFinal).toBe('rgb(255, 255, 255)');
  });
});
