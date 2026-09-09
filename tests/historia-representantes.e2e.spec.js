// Miniaturas ampliables de Historia/Archivos/Representantes (v4.15.2): las 8
// fotos de los paneles 2026-27 y 2025-26 van dentro de un trigger del lightbox
// compartido de Colaboraciones (sin visor propio), con badge "+" y oscurecido
// en hover. El panel 2024-25 sigue siendo un placeholder sin imágenes.

const { test, expect } = require('@playwright/test');

const PAGINAS = ['index.html', 'lafalla.html'];
const EDICIONES = [
  { id: 'representantes-2026-27', titulo: 'Representantes 2026-27', tituloVa: 'Representants 2026-27' },
  { id: 'representantes-2025-26', titulo: 'Representantes 2025-26', tituloVa: 'Representants 2025-26' }
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

// Abre el panel de una edición. El acordeón cierra el resto de secciones del
// documento, así que se abre de una en una.
async function abrirPanel(page, pagina, edicion) {
  const sufijo = pagina.replace('.html', '');
  const panel = page.locator(`#${edicion.id}-${sufijo}`);
  const titular = page.locator(`.accordion__titular[aria-controls="${edicion.id}-${sufijo}"]`);
  await titular.scrollIntoViewIfNeeded();
  // Cerrado: el acordeón colapsa con max-height 0 + overflow hidden, así que
  // Playwright sigue viendo el contenido recortado como "visible" (medir alto)
  expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await titular.click();
  await expect(titular).toHaveAttribute('aria-expanded', 'true');
  const grid = panel.locator('.representantes-grid');
  await expect(grid).toBeVisible();
  return { titular, panel, grid };
}

for (const pagina of PAGINAS) {
  test.describe(`Historia/Archivos/Representantes — ${pagina}`, () => {
    for (const edicion of EDICIONES) {
      test(`${edicion.titulo}: 4 miniaturas ampliables con badge "+"`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/${pagina}`);

        const { grid } = await abrirPanel(page, pagina, edicion);
        const triggers = grid.locator('button.colaboraciones-mosaic__trigger.representantes-grid__trigger');
        await expect(triggers).toHaveCount(4);
        // No hay visor propio: solo el lightbox compartido
        await expect(grid.locator('.swiper')).toHaveCount(0);

        for (let i = 0; i < 4; i += 1) {
          const img = triggers.nth(i).locator('img.representantes-grid__imagen');
          await img.scrollIntoViewIfNeeded();
          await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
          expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
        }

        // Badge "+" dibujado con dos barras (background-image), no con el glifo
        const badge = await triggers.first().evaluate((el) => {
          const cs = getComputedStyle(el, '::after');
          return { content: cs.content, size: cs.backgroundSize, position: cs.backgroundPosition };
        });
        expect(badge.content.replace(/["']/g, '')).toBe('');
        expect(badge.size.split(',').length).toBe(2);
        expect(badge.position).toContain('50%');
      });
    }

    test('hover oscurece la miniatura', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { grid } = await abrirPanel(page, pagina, EDICIONES[0]);

      const trigger = grid.locator('button.representantes-grid__trigger').first();
      const img = trigger.locator('img.representantes-grid__imagen');
      expect(await img.evaluate((el) => getComputedStyle(el).filter)).toBe('none');

      // Centrar en el viewport y mover el ratón al centro de la caja: el
      // hover() de Playwright vuelve a hacer scroll y, mientras la animación
      // max-height del acordeón sigue, puede acabar sobre otro elemento
      await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(200);
      const caja = await trigger.boundingBox();
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await expect.poll(() => img.evaluate((el) => getComputedStyle(el).filter)).toContain('brightness(0.72)');
    });

    test('la miniatura abre el lightbox compartido con su pie y cierra con Escape', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { grid } = await abrirPanel(page, pagina, EDICIONES[0]);

      const lightbox = page.locator('#colaboracionesLightbox');
      await expect(lightbox).toHaveCount(1);
      const imagen = lightbox.locator('.colaboraciones-lightbox__image');

      const trigger = grid.locator('button.representantes-grid__trigger').nth(2);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(lightbox).toHaveClass(/open/);
      await expect(imagen).toHaveAttribute('src', /FalleraMayorInfantil-2026-27\.(avif|webp|jpg)$/);
      // El pie del lightbox es el alt de la miniatura
      await expect(lightbox.locator('.colaboraciones-lightbox__caption'))
        .toHaveText('Sofía Gómez Medina, Fallera Mayor Infantil 2026-27');

      await page.keyboard.press('Escape');
      await expect(lightbox).not.toHaveClass(/open/);
      await expect(trigger).toBeFocused();

      await grid.locator('button.representantes-grid__trigger').first().click();
      await expect(lightbox).toHaveClass(/open/);
      await expect(imagen).toHaveAttribute('src', /FalleraMayor-2026-27\.(avif|webp|jpg)$/);
      await lightbox.locator('.colaboraciones-lightbox__close').click();
      await expect(lightbox).not.toHaveClass(/open/);
    });

    test('variante /va/: el alt (pie del lightbox) está pre-renderizado en valenciano', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/va/${pagina}`);
      const titular = page.locator(`.accordion__titular[aria-controls="${EDICIONES[0].id}-${pagina.replace('.html', '')}"]`);
      await expect(titular).toContainText(EDICIONES[0].tituloVa);

      const img = page.locator(`#${EDICIONES[0].id}-${pagina.replace('.html', '')} img.representantes-grid__imagen`).first();
      await expect(img).toHaveAttribute('alt', 'Lucía Gutiérrez Martín, Fallera Major 2026-27');
    });

    test('toggle ES→VA en runtime traduce el alt de la miniatura', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { grid } = await abrirPanel(page, pagina, EDICIONES[0]);
      test.skip(!(await cambiarAValenciano(page)), 'selector de idioma no disponible');

      await expect(grid.locator('img.representantes-grid__imagen').first())
        .toHaveAttribute('alt', 'Lucía Gutiérrez Martín, Fallera Major 2026-27');
    });
  });
}
