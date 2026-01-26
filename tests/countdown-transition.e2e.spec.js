/**
 * Test para la transición del fondo de .countdown__contenedor entre modos claro y oscuro
 */
import { test, expect } from '@playwright/test';

test.describe('Countdown Contenedor Background Transition', () => {

  test('El fondo debe transicionar gradualmente de claro a oscuro', async ({ page }) => {
    await page.goto('/');

    // Scroll hasta el countdown
    await page.locator('.countdown__contenedor').scrollIntoViewIfNeeded();

    // Verificar que estamos en modo claro (opacity del gradiente = 1)
    const opacityLight = await page.evaluate(() => {
      const el = document.querySelector('.countdown__contenedor');
      const before = window.getComputedStyle(el, '::before');
      return before.opacity;
    });
    console.log('Opacity del gradiente en modo claro:', opacityLight);
    expect(opacityLight).toBe('1');

    // Cambiar a modo oscuro
    await page.evaluate(() => {
      document.getElementById('botonModoOscuro').click();
    });

    // Capturar opacity a intervalos
    const measurements = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(300);
      const opacity = await page.evaluate(() => {
        const el = document.querySelector('.countdown__contenedor');
        return parseFloat(window.getComputedStyle(el, '::before').opacity);
      });
      measurements.push({ time: (i + 1) * 300, opacity });
    }

    console.log('\nTransición claro→oscuro:');
    measurements.forEach(m => console.log(`  ${m.time}ms: ${m.opacity.toFixed(3)}`));

    // Verificar transición gradual
    expect(measurements[0].opacity).toBeGreaterThan(0.5);
    expect(measurements[measurements.length - 1].opacity).toBeLessThan(0.1);
  });

  test('El fondo debe transicionar gradualmente de oscuro a claro', async ({ page }) => {
    await page.goto('/');

    await page.locator('.countdown__contenedor').scrollIntoViewIfNeeded();

    // Primero ir a modo oscuro
    await page.evaluate(() => document.getElementById('botonModoOscuro').click());
    await page.waitForTimeout(2500);

    const opacityDark = await page.evaluate(() => {
      const el = document.querySelector('.countdown__contenedor');
      return parseFloat(window.getComputedStyle(el, '::before').opacity);
    });
    console.log('Opacity en modo oscuro:', opacityDark);
    expect(opacityDark).toBeLessThan(0.1);

    // Cambiar a modo claro
    await page.evaluate(() => document.getElementById('botonModoOscuro').click());

    // Capturar transición
    const measurements = [];
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(300);
      const opacity = await page.evaluate(() => {
        const el = document.querySelector('.countdown__contenedor');
        return parseFloat(window.getComputedStyle(el, '::before').opacity);
      });
      measurements.push({ time: (i + 1) * 300, opacity });
    }

    console.log('\nTransición oscuro→claro:');
    measurements.forEach(m => console.log(`  ${m.time}ms: ${m.opacity.toFixed(3)}`));

    expect(measurements[0].opacity).toBeLessThan(0.5);
    expect(measurements[measurements.length - 1].opacity).toBeGreaterThan(0.9);
  });
});
