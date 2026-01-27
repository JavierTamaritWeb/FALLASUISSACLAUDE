const { test, expect } = require('@playwright/test');

const PAGES = ['index.html', 'lafalla.html', 'eventos.html', 'meteo.html', 'blog.html'];

/**
 * Obtiene los estilos del pseudo-elemento ::before de la barra
 */
async function getBarBeforeStyles(bar) {
  return bar.evaluate((el) => {
    const styles = window.getComputedStyle(el, '::before');
    return {
      background: styles.background,
      backgroundImage: styles.backgroundImage,
      opacity: styles.opacity,
      position: styles.position
    };
  });
}

test.describe('Header bar: fondo azul translúcido en modo claro', () => {
  for (const pageName of PAGES) {
    test(`${pageName}: gradiente en ::before al cargar y al hacer scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pageName}`);

      const bar = page.locator('.header__barra, .header-inner__barra').first();
      await expect(bar).toBeVisible();

      // Verificar que ::before tiene el gradiente
      const beforeInitial = await getBarBeforeStyles(bar);
      expect(beforeInitial.backgroundImage).toContain('linear-gradient');
      expect(beforeInitial.backgroundImage.toLowerCase()).toContain('rgba(');
      expect(beforeInitial.opacity).toBe('1');

      // Hacer scroll
      await page.evaluate(() => window.scrollTo(0, 200));
      await expect
        .poll(async () => bar.evaluate((el) => el.className), { timeout: 5000 })
        .toContain('scrolled');

      // Verificar que ::before mantiene el gradiente después del scroll
      const beforeScrolled = await getBarBeforeStyles(bar);
      expect(beforeScrolled.backgroundImage).toContain('linear-gradient');
      expect(beforeScrolled.backgroundImage.toLowerCase()).toContain('rgba(');
    });
  }
});

test.describe('Header bar: transición suave entre modos', () => {
  test('La barra transiciona gradualmente de claro a oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    const bar = page.locator('.header__barra').first();
    await expect(bar).toBeVisible();

    // Verificar opacidad inicial del ::before (modo claro = 1)
    const beforeLight = await getBarBeforeStyles(bar);
    expect(beforeLight.opacity).toBe('1');

    // Activar modo oscuro
    await page.click('.header__modo-boton');

    // Verificar que la transición es gradual (no instantánea)
    // Esperamos un poco y verificamos que la opacidad ha cambiado parcialmente
    await page.waitForTimeout(500);
    const opacityMid = await bar.evaluate((el) =>
      window.getComputedStyle(el, '::before').opacity
    );
    const opMid = parseFloat(opacityMid);
    // La opacidad debería estar entre 0 y 1 durante la transición
    expect(opMid).toBeLessThan(1);
    expect(opMid).toBeGreaterThan(0);

    // Esperar a que termine la transición
    await page.waitForTimeout(2500);

    // Verificar opacidad final (modo oscuro = 0)
    const beforeDark = await getBarBeforeStyles(bar);
    expect(beforeDark.opacity).toBe('0');
  });

  test('La barra transiciona gradualmente de oscuro a claro', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    const bar = page.locator('.header__barra').first();
    await expect(bar).toBeVisible();

    // Activar modo oscuro primero
    await page.click('.header__modo-boton');
    await page.waitForTimeout(2500); // Esperar transición completa

    // Verificar que estamos en modo oscuro
    const beforeDark = await getBarBeforeStyles(bar);
    expect(beforeDark.opacity).toBe('0');

    // Volver a modo claro
    await page.click('.header__modo-boton');

    // Verificar transición gradual
    await page.waitForTimeout(500);
    const opacityMid = await bar.evaluate((el) =>
      window.getComputedStyle(el, '::before').opacity
    );
    const opMid = parseFloat(opacityMid);
    expect(opMid).toBeGreaterThan(0);
    expect(opMid).toBeLessThan(1);

    // Esperar a que termine la transición
    await page.waitForTimeout(2500);

    // Verificar opacidad final (modo claro = 1)
    const beforeLight = await getBarBeforeStyles(bar);
    expect(beforeLight.opacity).toBe('1');
  });
});
