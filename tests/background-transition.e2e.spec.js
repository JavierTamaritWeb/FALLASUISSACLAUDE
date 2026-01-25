const { test, expect } = require('@playwright/test');

test.describe('Debug Body & Falla Background Transition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lafalla.html'); 
  });

  test('El pseudo-elemento body::before debe tener el gradiente y transición correcta', async ({ page }) => {
    const initialState = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body, '::before');
      return {
        content: style.content,
        backgroundImage: style.backgroundImage,
        transition: style.transition
      };
    });
    expect(initialState.content).not.toBe('none');
    expect(initialState.backgroundImage).toContain('linear-gradient');
    expect(initialState.transition).toContain('opacity');
  });

  test('El componente .falla debe usar ::before para overlay y soportar transición', async ({ page }) => {
    const fallaState = await page.evaluate(() => {
        const el = document.querySelector('.falla');
        if (!el) return null;
        const style = window.getComputedStyle(el);
        const beforeStyle = window.getComputedStyle(el, '::before');
        const firstChild = el.firstElementChild; 
        const childZ = firstChild ? window.getComputedStyle(firstChild).zIndex : 'auto';

        return {
            bgImage: style.backgroundImage,
            beforeContent: beforeStyle.content,
            beforeBgColor: beforeStyle.backgroundColor,
            beforeTransition: beforeStyle.transition,
            beforeZIndex: beforeStyle.zIndex,
            contentZIndex: childZ
        };
    });

    // .falla debe tener imagen pero NO gradiente
    expect(fallaState.bgImage).not.toContain('linear-gradient');
    expect(fallaState.bgImage).toContain('fondo_traje.png');

    // ::before debe tener overlay claro
    // Playwright/Chrome normalize colors to rgb/rgba
    expect(fallaState.beforeContent).not.toBe('none');
    expect(fallaState.beforeBgColor).toMatch(/245/); // Light gray
    expect(fallaState.beforeTransition).toContain('background-color');

    // Stacking context: beforeZIndex (0) < contentZIndex (1)
    expect(parseInt(fallaState.beforeZIndex)).toBe(0);
    expect(parseInt(fallaState.contentZIndex)).toBe(1);
  });

  test('El overlay de .falla debe cambiar de color gradualmente en modo oscuro', async ({ page }) => {
    const botonModo = page.locator('#botonModoOscuro');
    await botonModo.click();
    await expect(page.locator('body')).toHaveClass(/modo-oscuro/);

    // Verificar que .falla::before cambia a oscuro (rgba 0,0,0...)
    await expect.poll(async () => {
        return await page.evaluate(() => {
            const el = document.querySelector('.falla');
            return window.getComputedStyle(el, '::before').backgroundColor;
        });
    }, { timeout: 5000 }).toMatch(/rgba\(0, 0, 0, 0\.85\)/);
  });
});
