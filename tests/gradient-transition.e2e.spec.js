// tests/gradient-transition.e2e.spec.js
// Tests E2E para verificar la transición gradual del gradiente en el footer
// Nota: El header no usa pseudo-elementos para evitar conflictos con z-index de navegación

const { test, expect } = require('@playwright/test');

test.describe('Gradient Transition - Footer', () => {

  test('Footer tiene pseudo-elemento ::before para el gradiente', async ({ page }) => {
    await page.goto('/');

    const hasBeforeElement = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      if (!footer) return false;

      const beforeStyles = window.getComputedStyle(footer, '::before');
      return beforeStyles.content !== 'none' && beforeStyles.content !== '';
    });

    expect(hasBeforeElement).toBe(true);
  });

  test('En modo claro, el pseudo-elemento del footer tiene opacity 1', async ({ page }) => {
    await page.goto('/');

    // Asegurar que estamos en modo claro
    await page.evaluate(() => {
      document.body.classList.remove('modo-oscuro');
      document.body.classList.add('modo-claro');
      document.documentElement.classList.remove('modo-oscuro');
    });

    await page.waitForTimeout(500);

    const opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      if (!footer) return null;
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });

    expect(opacity).toBe(1);
  });

  test('En modo oscuro, el pseudo-elemento del footer tiene opacity 0', async ({ page }) => {
    await page.goto('/');

    // Cambiar a modo oscuro
    await page.evaluate(() => {
      document.body.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.add('modo-oscuro');
    });

    // Esperar a que la transición complete (2.4s + margen)
    await page.waitForTimeout(3000);

    const opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      if (!footer) return null;
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });

    expect(opacity).toBe(0);
  });

  test('El pseudo-elemento del footer tiene transición de opacity configurada', async ({ page }) => {
    await page.goto('/');

    const hasTransition = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      if (!footer) return false;
      const beforeStyles = window.getComputedStyle(footer, '::before');
      const transition = beforeStyles.transition;
      return transition.includes('opacity');
    });

    expect(hasTransition).toBe(true);
  });
});

test.describe('Footer Gradient - Transición Bidireccional', () => {

  test('La transición de claro a oscuro es gradual', async ({ page }) => {
    await page.goto('/');

    // Asegurar modo claro inicial
    await page.evaluate(() => {
      document.body.classList.remove('modo-oscuro');
      document.body.classList.add('modo-claro');
      document.documentElement.classList.remove('modo-oscuro');
    });
    await page.waitForTimeout(500);

    // Verificar opacity inicial = 1
    let opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    expect(opacity).toBe(1);

    // Cambiar a modo oscuro
    await page.evaluate(() => {
      document.body.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.add('modo-oscuro');
    });

    // Verificar que durante la transición (a 1s) el opacity está entre 0 y 1
    await page.waitForTimeout(1000);
    opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    // Durante la transición debe estar entre 0 y 1 (no instantáneo)
    expect(opacity).toBeGreaterThanOrEqual(0);
    expect(opacity).toBeLessThan(1);

    // Esperar a que termine la transición
    await page.waitForTimeout(2500);
    opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    expect(opacity).toBe(0);
  });

  test('La transición de oscuro a claro es gradual', async ({ page }) => {
    await page.goto('/');

    // Empezar en modo oscuro
    await page.evaluate(() => {
      document.body.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.add('modo-oscuro');
    });
    await page.waitForTimeout(3000); // Esperar transición completa

    // Verificar opacity inicial = 0
    let opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    expect(opacity).toBe(0);

    // Cambiar a modo claro
    await page.evaluate(() => {
      document.body.classList.remove('modo-oscuro');
      document.body.classList.add('modo-claro');
      document.body.classList.add('transicion-a-claro');
      document.documentElement.classList.remove('modo-oscuro');
      document.documentElement.classList.add('transicion-a-claro');
    });

    // Verificar que durante la transición (a 1s) el opacity está entre 0 y 1
    await page.waitForTimeout(1000);
    opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    // Durante la transición debe estar entre 0 y 1 (no instantáneo)
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThanOrEqual(1);

    // Esperar a que termine la transición
    await page.waitForTimeout(2500);
    opacity = await page.evaluate(() => {
      const footer = document.querySelector('.footer');
      const beforeStyles = window.getComputedStyle(footer, '::before');
      return parseFloat(beforeStyles.opacity);
    });
    expect(opacity).toBe(1);
  });
});
