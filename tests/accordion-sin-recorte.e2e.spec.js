// tests/accordion-sin-recorte.e2e.spec.js
// Guardia de v4.23.1: ningún panel de acordeón puede quedar recortado. El alto
// de apertura lo calcula js/acc.js (scrollHeight → max-height: none); antes un
// tope fijo `max-height: 100rem` cortaba HOPE en colaboraciones.html (hasta
// 2131 px reales), Organigrama y Plana Mayor en móvil.
const { test, expect } = require('@playwright/test');

const PAGINAS = ['colaboraciones.html', 'va/colaboraciones.html', 'index.html', 'lafalla.html'];
const ANCHOS = [375, 768, 1280];

async function esperarAccJs(page) {
  // En index.html acc.js llega diferido vía home-deferred.js: al inicializar
  // marca aria-expanded en los titulares <div>.
  await expect
    .poll(() => page.locator('.accordion__titular').first().getAttribute('aria-expanded'), { timeout: 15000 })
    .not.toBeNull();
}

for (const ancho of ANCHOS) {
  for (const pagina of PAGINAS) {
    test(`${pagina} @ ${ancho}px: todos los paneles se ven completos`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto(`/${pagina}`, { waitUntil: 'load' });
      await esperarAccJs(page);

      const total = await page.locator('.accordion__section').count();
      expect(total).toBeGreaterThan(0);

      for (let i = 0; i < total; i++) {
        const seccion = page.locator('.accordion__section').nth(i);
        const titular = seccion.locator('.accordion__titular').first();
        const panel = seccion.locator('.accordion__content').first();
        const nombre = (await titular.innerText()).replace(/\s+/g, ' ').trim();

        // Cerrado: colapsa a 0 (max-height 0 + overflow hidden)
        await titular.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        expect(await panel.evaluate((el) => el.getBoundingClientRect().height), `${nombre} cerrado`).toBe(0);

        // Abierto: tras la transición acc.js deja max-height: none y no queda
        // contenido oculto
        await titular.click({ force: true });
        await expect(seccion).toHaveClass(/active/);
        await expect
          .poll(() => panel.evaluate((el) => getComputedStyle(el).maxHeight), { timeout: 5000 })
          .toBe('none');
        // Alto real = alto de layout del interior (offsetHeight ignora el
        // translateY de los bloques `.reveal` aún no revelados, que inflaría
        // scrollHeight sin ser recorte). El panel no lleva padding propio.
        const medir = () => panel.evaluate((el) => ({ visible: el.clientHeight, real: el.firstElementChild.offsetHeight }));
        await expect
          .poll(async () => { const m = await medir(); return m.real - m.visible; }, { message: `${nombre} abierto recortado`, timeout: 5000 })
          .toBeLessThanOrEqual(1);
        expect((await medir()).visible, `${nombre} abierto sin alto`).toBeGreaterThan(0);

        // Vuelve a cerrar a 0
        await titular.click({ force: true });
        await expect(seccion).not.toHaveClass(/active/);
        await expect
          .poll(() => panel.evaluate((el) => el.getBoundingClientRect().height), { timeout: 5000 })
          .toBe(0);
      }
    });
  }
}
