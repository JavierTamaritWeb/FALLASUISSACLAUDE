// Subsección Historia/Archivos/Monumentos (v4.15.0): panel "Monumento 2025-26"
// con 4 miniaturas del monumento que se amplían en el lightbox compartido de
// Colaboraciones (sin visor propio) y botón de descarga del vídeo del dron.
// Desde v4.32.0 le acompañan "Monumento 2026-27" (2 bocetos, antes) y
// "Monumento 2024-25" (2 fotos apaisadas, después).

const { test, expect } = require('@playwright/test');

const PAGINAS = ['index.html', 'lafalla.html'];
const VIEWPORTS = [
  { nombre: 'desktop', width: 1280, height: 800, columnas: 4 },
  { nombre: 'móvil', width: 375, height: 667, columnas: 2 }
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

// Abre el panel "Monumento 2025-26" (el segundo desde v4.32.0)
async function abrirPanel(page, edicion = '2025-26') {
  const titular = page.locator(`.accordion--monumentos .accordion__titular[aria-controls^="monumento-${edicion}-"]`);
  await titular.scrollIntoViewIfNeeded();
  await expect(titular).toHaveAttribute('aria-expanded', 'false');
  await titular.click();
  await expect(titular).toHaveAttribute('aria-expanded', 'true');
  const grid = page.locator(`.accordion--monumentos [id^="monumento-${edicion}-"] .monumentos-grid`);
  await expect(grid).toBeVisible();
  return { titular, grid };
}

for (const pagina of PAGINAS) {
  test.describe(`Historia/Archivos/Monumentos — ${pagina}`, () => {
    for (const vp of VIEWPORTS) {
      test(`${vp.nombre}: panel cerrado, abre con 4 miniaturas en ${vp.columnas} columnas`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${pagina}`);

        const subtitulo = page.locator('h5.historia__archivos-subtitulo', { hasText: 'Monumentos' });
        await expect(subtitulo).toHaveCount(1);

        const titulares = page.locator('.accordion--monumentos .accordion__titular');
        await expect(titulares).toContainText(['Monumento 2026-27', 'Monumento 2025-26', 'Monumento 2024-25']);
        const titular = titulares.nth(1);
        const panel = page.locator('#monumento-2025-26-' + pagina.replace('.html', ''));
        await expect(panel).toHaveAttribute('role', 'region');
        // Cerrado: el panel colapsa a max-height 0 con overflow hidden (acordeón base)
        expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);

        const { grid } = await abrirPanel(page);
        const items = grid.locator('.representantes-grid__item');
        await expect(items).toHaveCount(4);

        const columnas = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columnas).toBe(vp.columnas);

        const imagenes = grid.locator('img.representantes-grid__imagen');
        for (let i = 0; i < 4; i += 1) {
          const img = imagenes.nth(i);
          await img.scrollIntoViewIfNeeded();
          await expect(img).toBeVisible();
          await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
          expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
        }

        // Los triggers son botones del lightbox compartido (no hay visor propio)
        await expect(grid.locator('button.colaboraciones-mosaic__trigger')).toHaveCount(4);
        await expect(page.locator('.accordion--monumentos .swiper')).toHaveCount(0);
      });
    }

    test('desktop: la miniatura abre el lightbox compartido y cierra con Escape y botón', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { grid } = await abrirPanel(page);

      const lightbox = page.locator('#colaboracionesLightbox');
      await expect(lightbox).toHaveCount(1);
      const imagen = lightbox.locator('.colaboraciones-lightbox__image');

      const trigger = grid.locator('button.colaboraciones-mosaic__trigger').nth(2);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(lightbox).toHaveClass(/open/);
      await expect(lightbox).toHaveAttribute('aria-hidden', 'false');
      await expect(imagen).toHaveAttribute('src', /monumento-falla-2025-26-real\.(avif|webp|jpeg)$/);
      await expect(lightbox.locator('.colaboraciones-lightbox__caption')).toContainText('Monumento principal');

      await page.keyboard.press('Escape');
      await expect(lightbox).not.toHaveClass(/open/);
      await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
      await expect(trigger).toBeFocused();

      await grid.locator('button.colaboraciones-mosaic__trigger').first().click();
      await expect(lightbox).toHaveClass(/open/);
      await expect(imagen).toHaveAttribute('src', /boceto-falla-2025-26-Web\.(avif|webp|jpg)$/);
      await lightbox.locator('.colaboraciones-lightbox__close').click();
      await expect(lightbox).not.toHaveClass(/open/);
    });

    test('el botón de descarga apunta al MP4 del dron y el archivo se sirve', async ({ page, request }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      await abrirPanel(page);

      const enlace = page.locator('.accordion--monumentos a.boton[download]');
      await expect(enlace).toBeVisible();
      await expect(enlace).toContainText('Descargar vídeo del dron');
      await expect(enlace).toHaveAttribute('download', /\.mp4$/);
      const href = await enlace.evaluate((a) => a.href);
      expect(href).toMatch(/\/img\/dron\/dron-001-2026\.mp4$/);

      const res = await request.head(href);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type'] || '').toContain('video/mp4');
    });

    // Guardia v4.30.18: en móvil el .boton global (white-space: nowrap) desbordaba
    // el panel y el texto del botón de descarga quedaba cortado.
    for (const ancho of [320, 390]) {
      test(`móvil ${ancho} px: el botón de descarga del dron no se corta`, async ({ page }) => {
        await page.setViewportSize({ width: ancho, height: 800 });
        await page.goto(`/${pagina}`);
        await abrirPanel(page);
        const enlace = page.locator('.accordion--monumentos a.boton[download]').first();
        await enlace.scrollIntoViewIfNeeded();
        await expect(enlace).toBeVisible();
        // El puntero queda donde se pulsó el titular y, tras el scroll, puede caer
        // sobre el botón: en hover el brillo ::before del .boton se desliza fuera
        // de la caja y hace crecer scrollWidth. Se aparta el ratón antes de medir.
        await page.mouse.move(0, 0);
        // Se reintenta mientras terminan la apertura del acordeón y la animación
        // reveal (bajo carga la primera medida puede caer a mitad de transición)
        await expect(async () => {
          const geo = await enlace.evaluate((el) => {
            const b = el.getBoundingClientRect();
            const p = el.closest('.accordion__content').getBoundingClientRect();
            return { bl: b.left, br: b.right, pl: p.left, pr: p.right, scroll: el.scrollWidth, client: el.clientWidth };
          });
          expect(geo.bl).toBeGreaterThanOrEqual(geo.pl - 0.5);
          expect(geo.br).toBeLessThanOrEqual(geo.pr + 0.5);
          expect(geo.scroll).toBeLessThanOrEqual(geo.client + 1);
        }).toPass({ timeout: 5000 });
      });
    }

    test('variante /va/: pre-render en valenciano y href del vídeo con ../', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/va/${pagina}`);
      await expect(page.locator('.accordion--monumentos .accordion__titular'))
        .toContainText(['Monument 2026-27', 'Monument 2025-26', 'Monument 2024-25']);
      const enlace = page.locator('.accordion--monumentos a.boton[download]');
      await expect(enlace).toHaveAttribute('href', '../img/dron/dron-001-2026.mp4');
      expect(await enlace.evaluate((a) => a.href)).toMatch(/\/img\/dron\/dron-001-2026\.mp4$/);
    });

    test('toggle ES→VA en runtime traduce titular, pies y botón', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      await abrirPanel(page);
      test.skip(!(await cambiarAValenciano(page)), 'selector de idioma no disponible');

      await expect(page.locator('.accordion--monumentos .accordion__header').nth(1)).toHaveText('Monument 2025-26');
      await expect(page.locator('.accordion--monumentos a.boton[download]')).toHaveText('Descarregar vídeo del dron');
      await expect(page.locator('.accordion--monumentos .representantes-grid__cargo').first()).toHaveText('Monument principal (esbós)');
      await expect(page.locator('.accordion--monumentos img.representantes-grid__imagen').first()).toHaveAttribute('alt', /esbós/);
    });

    // v4.32.0: paneles 2026-27 (2 bocetos) y 2024-25 (2 fotos apaisadas)
    for (const ed of [
      { edicion: '2026-27', src: /monumento-falla-2026-27-boceto\.(avif|webp|jpg)$/, pie: 'Monumento principal (boceto)', ratio: 0.75, descarga: 0 },
      { edicion: '2024-25', src: /monumento-real-foto_2024-25_01\.(avif|webp|jpg)$/, pie: 'Monumento plantado', ratio: 4 / 3, descarga: 0 }
    ]) {
      test(`Monumento ${ed.edicion}: 2 miniaturas en 2 columnas que abren el lightbox`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`/${pagina}`);
        const { grid } = await abrirPanel(page, ed.edicion);
        const triggers = grid.locator('button.colaboraciones-mosaic__trigger');
        await expect(triggers).toHaveCount(2);
        expect(await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
        await expect(grid.locator('..').locator('a.boton[download]')).toHaveCount(ed.descarga);

        const img = triggers.first().locator('img.representantes-grid__imagen');
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
        const caja = await img.boundingBox();
        expect(caja.width / caja.height).toBeCloseTo(ed.ratio, 1);
        await expect(grid.locator('.representantes-grid__cargo').first()).toHaveText(ed.pie);

        await triggers.first().click();
        const lightbox = page.locator('#colaboracionesLightbox');
        await expect(lightbox).toHaveClass(/open/);
        await expect(lightbox.locator('.colaboraciones-lightbox__image')).toHaveAttribute('src', ed.src);
        await page.keyboard.press('Escape');
        await expect(lightbox).not.toHaveClass(/open/);
      });
    }
  });
}
