/**
 * Tests para el menú desplegable móvil
 * Verifica que el menú se despliega correctamente y tiene los estilos adecuados
 *
 * Reglas críticas documentadas en docs/navigation-bar.md:
 * 1. NO usar overflow:hidden en .header__barra (recorta el menú)
 * 2. .navegacion debe tener position:absolute en móvil
 * 3. El selector > * debe excluir .navegacion con :not(.navegacion)
 */

const { test, expect } = require('@playwright/test');

test.describe('Menú móvil: estructura y posicionamiento', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
  });

  test('.navegacion tiene position:absolute cuando está abierto', async ({ page }) => {
    // Abrir menú
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const position = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).position;
    });

    expect(position).toBe('absolute');
  });

  test('.navegacion tiene top correcto (debajo de la barra)', async ({ page }) => {
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const styles = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      const computed = window.getComputedStyle(nav);
      return {
        top: computed.top,
        left: computed.left,
        right: computed.right
      };
    });

    // El top debe ser un valor positivo (debajo de la barra)
    const topValue = parseInt(styles.top);
    expect(topValue).toBeGreaterThan(0);

    // Debe ocupar todo el ancho
    expect(styles.left).toBe('0px');
    expect(styles.right).toBe('0px');
  });

  test('.header__barra NO tiene overflow:hidden', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return window.getComputedStyle(bar).overflow;
    });

    // overflow:hidden recortaría el menú desplegable
    expect(overflow).not.toBe('hidden');
  });

  test('.navegacion tiene fondo translúcido azul en modo claro', async ({ page }) => {
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const bgColor = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backgroundColor;
    });

    // Debe ser azul translúcido rgba(2, 66, 122, 0.85)
    expect(bgColor).toMatch(/rgba\(2,\s*66,\s*122,\s*0\.85\)/);
  });

  test('.navegacion tiene fondo translúcido oscuro en modo oscuro', async ({ page }) => {
    // Activar modo oscuro
    await page.click('.header__modo-boton');
    await page.waitForTimeout(500);

    // Abrir menú
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const bgColor = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backgroundColor;
    });

    // Debe ser negro translúcido rgba(0, 0, 0, 0.85)
    expect(bgColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.85\)/);
  });

  test('.navegacion tiene backdrop-filter blur', async ({ page }) => {
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    const backdropFilter = await page.evaluate(() => {
      const nav = document.querySelector('.navegacion');
      return window.getComputedStyle(nav).backdropFilter;
    });

    expect(backdropFilter).toContain('blur');
  });

  test('El menú es visible y no está recortado', async ({ page }) => {
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);

    // Verificar que todos los enlaces son visibles
    const enlaces = page.locator('.navegacion__enlace');
    const count = await enlaces.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(enlaces.nth(i)).toBeVisible();
    }
  });
});

test.describe('Menú móvil: enlace activo', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.click('.header__menu-toggle');
    await page.waitForTimeout(300);
  });

  test('Solo el enlace de la página actual tiene fondo blanco', async ({ page }) => {
    const enlacesInfo = await page.evaluate(() => {
      const enlaces = document.querySelectorAll('.navegacion__enlace');
      return Array.from(enlaces).map(enlace => ({
        text: enlace.textContent.trim(),
        isActive: enlace.classList.contains('active'),
        ariaCurrent: enlace.getAttribute('aria-current'),
        backgroundColor: window.getComputedStyle(enlace).backgroundColor
      }));
    });

    // Debe haber exactamente un enlace activo
    const activos = enlacesInfo.filter(e => e.isActive);
    expect(activos.length).toBe(1);

    // El activo debe tener fondo blanco translúcido
    const activo = activos[0];
    expect(activo.backgroundColor).toMatch(/rgba\(255,\s*255,\s*255/);

    // Los no activos deben tener fondo transparente
    const noActivos = enlacesInfo.filter(e => !e.isActive);
    for (const enlace of noActivos) {
      expect(enlace.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
  });
});

test.describe('Barra de navegación: patrón overlay translúcido', () => {
  test('::before tiene opacity 1 en modo claro (gradiente visible)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    const opacity = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return window.getComputedStyle(bar, '::before').opacity;
    });

    // El ::before debe estar visible (opacity: 1) para mostrar el gradiente
    expect(opacity).toBe('1');
  });

  test('::before tiene opacity 0 en modo oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    // Activar modo oscuro
    await page.click('.header__modo-boton');
    await page.waitForTimeout(2500); // Esperar transición

    const opacity = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return window.getComputedStyle(bar, '::before').opacity;
    });

    expect(opacity).toBe('0');
  });

  test('Elemento tiene fondo transparente en modo claro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    const bgColor = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return window.getComputedStyle(bar).backgroundColor;
    });

    // Debe ser transparente o muy cercano a transparente
    expect(bgColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
  });

  test('Elemento tiene fondo gris translúcido en modo oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    await page.click('.header__modo-boton');
    await page.waitForTimeout(2500);

    const bgColor = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return window.getComputedStyle(bar).backgroundColor;
    });

    // Debe ser gris translúcido rgba(51, 51, 51, 0.7)
    expect(bgColor).toMatch(/rgba\(51,\s*51,\s*51/);
  });
});

test.describe('Barra de navegación: transiciones', () => {
  test('Transición gradual de claro a oscuro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    // Verificar opacidad inicial
    const opacityBefore = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return parseFloat(window.getComputedStyle(bar, '::before').opacity);
    });
    expect(opacityBefore).toBe(1);

    // Activar modo oscuro
    await page.click('.header__modo-boton');

    // Verificar que hay transición (opacidad intermedia)
    await page.waitForTimeout(500);
    const opacityMid = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return parseFloat(window.getComputedStyle(bar, '::before').opacity);
    });
    expect(opacityMid).toBeLessThan(1);
    expect(opacityMid).toBeGreaterThan(0);

    // Esperar fin de transición
    await page.waitForTimeout(2500);
    const opacityAfter = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return parseFloat(window.getComputedStyle(bar, '::before').opacity);
    });
    expect(opacityAfter).toBe(0);
  });

  test('Transición gradual de oscuro a claro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    // Primero activar modo oscuro
    await page.click('.header__modo-boton');
    await page.waitForTimeout(2500);

    // Volver a modo claro
    await page.click('.header__modo-boton');

    // Verificar transición gradual
    await page.waitForTimeout(500);
    const opacityMid = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return parseFloat(window.getComputedStyle(bar, '::before').opacity);
    });
    expect(opacityMid).toBeGreaterThan(0);
    expect(opacityMid).toBeLessThan(1);

    // Esperar fin
    await page.waitForTimeout(2500);
    const opacityFinal = await page.evaluate(() => {
      const bar = document.querySelector('.header__barra');
      return parseFloat(window.getComputedStyle(bar, '::before').opacity);
    });
    expect(opacityFinal).toBe(1);
  });
});
