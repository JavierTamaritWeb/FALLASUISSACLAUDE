/**
 * Test para la transición del fondo de .quieres-mas entre modos claro y oscuro
 */
import { test, expect } from '@playwright/test';

test.describe('Quieres-mas Background Transition', () => {

  test('El fondo de .quieres-mas debe transicionar gradualmente de oscuro a claro', async ({ page }) => {
    await page.goto('/');

    // Scroll hasta la sección quieres-mas para asegurarnos de que está visible
    await page.locator('.quieres-mas').scrollIntoViewIfNeeded();

    // 1. Activar modo oscuro usando el botón (simula el flujo real)
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      if (btn) btn.click();
    });
    // Esperar a que la transición a oscuro termine
    await page.waitForTimeout(2500);

    // 2. Verificar que estamos en modo oscuro
    // En modo oscuro, el ::before tiene opacity: 0
    const opacityDark = await page.evaluate(() => {
      const el = document.querySelector('.quieres-mas');
      const before = window.getComputedStyle(el, '::before');
      return parseFloat(before.opacity);
    });
    console.log('Opacity del gradiente en modo oscuro:', opacityDark);
    expect(opacityDark).toBeLessThan(0.1); // Debe ser cercano a 0

    // 3. Cambiar a modo claro (simular click en botón)
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      if (btn) btn.click();
    });

    // 4. Capturar opacity a intervalos durante la transición
    const measurements = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(300);
      const opacity = await page.evaluate(() => {
        const el = document.querySelector('.quieres-mas');
        const before = window.getComputedStyle(el, '::before');
        return parseFloat(before.opacity);
      });
      measurements.push({ time: (i + 1) * 300, opacity });
    }

    console.log('\nMediciones de opacity durante transición oscuro→claro:');
    measurements.forEach(m => console.log(`  ${m.time}ms: ${m.opacity.toFixed(3)}`));

    // 5. Verificar que hubo transición gradual
    // La opacity debe ir aumentando gradualmente de 0 a 1
    const firstOpacity = measurements[0].opacity;
    const lastOpacity = measurements[measurements.length - 1].opacity;

    console.log(`\nOpacity inicial: ${firstOpacity.toFixed(3)}`);
    console.log(`Opacity final: ${lastOpacity.toFixed(3)}`);

    // Verificar que empezó cerca de 0 y terminó cerca de 1
    expect(firstOpacity).toBeLessThan(0.5); // Debe estar aún en transición al inicio
    expect(lastOpacity).toBeGreaterThan(0.9); // Debe estar casi completo al final

    // Verificar que fue gradual (cada medición >= anterior)
    let isGradual = true;
    for (let i = 1; i < measurements.length; i++) {
      if (measurements[i].opacity < measurements[i-1].opacity - 0.01) {
        isGradual = false;
        break;
      }
    }
    console.log(`Transición gradual: ${isGradual ? '✓ Sí' : '✗ No'}`);
    expect(isGradual).toBe(true);
  });

  test('El fondo de .quieres-mas debe transicionar gradualmente de claro a oscuro', async ({ page }) => {
    await page.goto('/');

    // Scroll hasta la sección
    await page.locator('.quieres-mas').scrollIntoViewIfNeeded();

    // Verificar que estamos en modo claro (opacity del gradiente = 1)
    const opacityLight = await page.evaluate(() => {
      const el = document.querySelector('.quieres-mas');
      const before = window.getComputedStyle(el, '::before');
      return before.opacity;
    });
    console.log('Opacity del gradiente en modo claro:', opacityLight);
    expect(opacityLight).toBe('1');

    // Cambiar a modo oscuro
    await page.evaluate(() => {
      const btn = document.getElementById('botonModoOscuro');
      if (btn) btn.click();
    });

    // Capturar opacity a intervalos
    const measurements = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(300);
      const opacity = await page.evaluate(() => {
        const el = document.querySelector('.quieres-mas');
        const before = window.getComputedStyle(el, '::before');
        return parseFloat(before.opacity);
      });
      measurements.push({ time: (i + 1) * 300, opacity });
    }

    console.log('\nMediciones de opacity durante transición claro→oscuro:');
    measurements.forEach(m => console.log(`  ${m.time}ms: ${m.opacity.toFixed(3)}`));

    const firstOpacity = measurements[0].opacity;
    const lastOpacity = measurements[measurements.length - 1].opacity;

    console.log(`\nOpacity inicial: ${firstOpacity.toFixed(3)}`);
    console.log(`Opacity final: ${lastOpacity.toFixed(3)}`);

    // Verificar que empezó cerca de 1 y terminó cerca de 0
    expect(firstOpacity).toBeGreaterThan(0.5);
    expect(lastOpacity).toBeLessThan(0.1);
  });

  test('Verificar estructura CSS del pseudo-elemento', async ({ page }) => {
    await page.goto('/');

    const styles = await page.evaluate(() => {
      const el = document.querySelector('.quieres-mas');
      const elStyles = window.getComputedStyle(el);
      const beforeStyles = window.getComputedStyle(el, '::before');

      return {
        element: {
          position: elStyles.position,
          backgroundColor: elStyles.backgroundColor,
        },
        before: {
          content: beforeStyles.content,
          position: beforeStyles.position,
          opacity: beforeStyles.opacity,
          backgroundImage: beforeStyles.backgroundImage,
          transition: beforeStyles.transition,
          transitionProperty: beforeStyles.transitionProperty,
          transitionDuration: beforeStyles.transitionDuration,
        }
      };
    });

    console.log('\n=== Estructura CSS de .quieres-mas ===');
    console.log('Elemento:');
    console.log(`  position: ${styles.element.position}`);
    console.log(`  background-color: ${styles.element.backgroundColor}`);
    console.log('\nPseudo-elemento ::before:');
    console.log(`  content: ${styles.before.content}`);
    console.log(`  position: ${styles.before.position}`);
    console.log(`  opacity: ${styles.before.opacity}`);
    console.log(`  background-image: ${styles.before.backgroundImage.substring(0, 50)}...`);
    console.log(`  transition-property: ${styles.before.transitionProperty}`);
    console.log(`  transition-duration: ${styles.before.transitionDuration}`);

    // Verificaciones
    expect(styles.element.position).toBe('relative');
    expect(styles.before.content).not.toBe('none');
    expect(styles.before.position).toBe('absolute');
    expect(styles.before.backgroundImage).toContain('linear-gradient');
    expect(styles.before.transitionDuration).not.toBe('0s');
  });
});
