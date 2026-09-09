// Miniaturas ampliables de Nosotros/Plana Mayor (v4.15.3): las 4 fotos de los
// paneles Fallera Mayor, Presidente, Fallera Mayor Infantil y Presidente
// Infantil van dentro de un trigger del lightbox compartido de Colaboraciones
// (sin visor propio), con badge "+" y oscurecido en hover.

const { test, expect } = require('@playwright/test');

const PAGINAS = ['index.html', 'lafalla.html'];
const CARGOS = [
  { src: 'FalleraMayor-2026-27', alt: 'Lucía Gutiérrez Martín, Fallera Mayor de la Falla Suïssa 2026-2027', altVa: 'Lucía Gutiérrez Martín, Fallera Major de la Falla Suïssa 2026-2027' },
  { src: 'Presidente', alt: 'José Santos Quiles, Presidente de la Falla Suïssa', altVa: 'José Santos Quiles, President de la Falla Suïssa' },
  { src: 'FalleraMayorInfantil-2026-27', alt: 'Sofía Gómez Medina, Fallera Mayor Infantil de la Falla Suïssa 2026-2027', altVa: 'Sofía Gómez Medina, Fallera Major Infantil de la Falla Suïssa 2026-2027' },
  { src: 'PresidenteInfantil-2026-27', alt: 'Diego Gómez Medina, Presidente Infantil de la Falla Suïssa 2026-2027', altVa: 'Diego Gómez Medina, President Infantil de la Falla Suïssa 2026-2027' }
];

async function cambiarAValenciano(page) {
  const langSwitcher = page.locator('#langSwitcher');
  if (!(await langSwitcher.isVisible())) return false;
  await langSwitcher.click();
  const vaOption = page.locator('.header__lang-option[data-lang="va"]');
  if (!(await vaOption.isVisible())) return false;
  await vaOption.click();
  await page.waitForTimeout(300);
  return true;
}

// Los titulares de este acordeón son <div> (no migrados a <button>), así que
// el estado abierto se comprueba por la clase .active de la sección y por la
// altura real del panel: colapsado usa max-height 0 + overflow hidden y
// Playwright sigue considerando "visible" el contenido recortado.
function seccion(page, i) {
  return page.locator('.accordion__section:has(.accordion__planamayor-trigger)').nth(i);
}

async function abrirPanel(page, i) {
  const sec = seccion(page, i);
  const panel = sec.locator('.accordion__content').first();
  await sec.scrollIntoViewIfNeeded();
  expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await sec.locator('.accordion__titular').first().click();
  await expect(sec).toHaveClass(/active/);
  await expect.poll(() => panel.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(0);
  return { sec, panel, trigger: sec.locator('.accordion__planamayor-trigger').first() };
}

for (const pagina of PAGINAS) {
  test.describe(`Nosotros/Plana Mayor — ${pagina}`, () => {
    test('las 4 fotos son triggers del lightbox con badge "+" dibujado', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);

      const triggers = page.locator('button.colaboraciones-mosaic__trigger.accordion__planamayor-trigger');
      await expect(triggers).toHaveCount(4);

      for (let i = 0; i < CARGOS.length; i += 1) {
        const { trigger } = await abrirPanel(page, i);
        const img = trigger.locator('img.accordion__planamayor');
        await expect(img).toHaveAttribute('src', new RegExp(`${CARGOS[i].src}\\.jpg$`));
        await expect(img).toHaveAttribute('alt', CARGOS[i].alt);
        await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
        // El trigger base fuerza object-fit: contain; aquí debe quedar cover
        expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');

        // Badge "+" dibujado con dos barras (background-image), no con el glifo
        const badge = await trigger.evaluate((el) => {
          const cs = getComputedStyle(el, '::after');
          return { content: cs.content, size: cs.backgroundSize, position: cs.backgroundPosition };
        });
        expect(badge.content.replace(/["']/g, '')).toBe('');
        expect(badge.size.split(',').length).toBe(2);
        expect(badge.position).toContain('50%');
      }
    });

    test('hover oscurece la foto', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { trigger } = await abrirPanel(page, 0);
      const img = trigger.locator('img.accordion__planamayor');
      expect(await img.evaluate((el) => getComputedStyle(el).filter)).toBe('none');

      // Centrar y mover el ratón al centro de la caja medida: hover() vuelve a
      // hacer scroll y, mientras corre la animación max-height del acordeón,
      // puede acabar sobre otro elemento
      await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(400);
      const caja = await trigger.boundingBox();
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await expect.poll(() => img.evaluate((el) => getComputedStyle(el).filter)).toContain('brightness(0.72)');
    });

    test('la foto abre el lightbox compartido con su pie y cierra con Escape', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);

      const lightbox = page.locator('#colaboracionesLightbox');
      await expect(lightbox).toHaveCount(1);
      const imagen = lightbox.locator('.colaboraciones-lightbox__image');

      const { trigger } = await abrirPanel(page, 2);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(lightbox).toHaveClass(/open/);
      await expect(imagen).toHaveAttribute('src', /FalleraMayorInfantil-2026-27\.(avif|webp|jpg)$/);
      await expect(lightbox.locator('.colaboraciones-lightbox__caption')).toHaveText(CARGOS[2].alt);

      await page.keyboard.press('Escape');
      await expect(lightbox).not.toHaveClass(/open/);
      await expect(trigger).toBeFocused();

      // El botón de cerrar también cierra
      await trigger.click();
      await expect(lightbox).toHaveClass(/open/);
      await lightbox.locator('.colaboraciones-lightbox__close').click();
      await expect(lightbox).not.toHaveClass(/open/);
    });

    test('variante /va/: el alt (pie del lightbox) está pre-renderizado en valenciano', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/va/${pagina}`);
      const img = page.locator('.accordion__planamayor-trigger img.accordion__planamayor');
      for (let i = 0; i < CARGOS.length; i += 1) {
        await expect(img.nth(i)).toHaveAttribute('alt', CARGOS[i].altVa);
      }
    });

    test('toggle ES→VA en runtime traduce el alt de la foto', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      await abrirPanel(page, 0);
      test.skip(!(await cambiarAValenciano(page)), 'selector de idioma no disponible');

      await expect(page.locator('.accordion__planamayor-trigger img.accordion__planamayor').first())
        .toHaveAttribute('alt', CARGOS[0].altVa);
    });
  });
}
