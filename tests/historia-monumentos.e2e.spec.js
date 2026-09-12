// Subsección Historia/Archivos/Monumentos (v4.15.0): panel "Monumento 2025-26"
// con 4 miniaturas del monumento que se amplían en el lightbox compartido de
// Colaboraciones (sin visor propio) y botón de descarga del vídeo del dron.

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

async function abrirPanel(page) {
  const titular = page.locator('.accordion--monumentos .accordion__titular').first();
  await titular.scrollIntoViewIfNeeded();
  await expect(titular).toHaveAttribute('aria-expanded', 'false');
  await titular.click();
  await expect(titular).toHaveAttribute('aria-expanded', 'true');
  const grid = page.locator('.accordion--monumentos .monumentos-grid');
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

        const titular = page.locator('.accordion--monumentos .accordion__titular').first();
        await expect(titular).toContainText('Monumento 2025-26');
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
      await expect(imagen).toHaveAttribute('src', /falla2026-real\.(avif|webp|jpeg)$/);
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

    test('variante /va/: pre-render en valenciano y href del vídeo con ../', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/va/${pagina}`);
      const titular = page.locator('.accordion--monumentos .accordion__titular').first();
      await expect(titular).toContainText('Monument 2025-26');
      const enlace = page.locator('.accordion--monumentos a.boton[download]');
      await expect(enlace).toHaveAttribute('href', '../img/dron/dron-001-2026.mp4');
      expect(await enlace.evaluate((a) => a.href)).toMatch(/\/img\/dron\/dron-001-2026\.mp4$/);
    });

    test('toggle ES→VA en runtime traduce titular, pies y botón', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      await abrirPanel(page);
      test.skip(!(await cambiarAValenciano(page)), 'selector de idioma no disponible');

      await expect(page.locator('.accordion--monumentos .accordion__header').first()).toHaveText('Monument 2025-26');
      await expect(page.locator('.accordion--monumentos a.boton[download]')).toHaveText('Descarregar vídeo del dron');
      await expect(page.locator('.accordion--monumentos .representantes-grid__cargo').first()).toHaveText('Monument principal (esbós)');
      await expect(page.locator('.accordion--monumentos img.representantes-grid__imagen').first()).toHaveAttribute('alt', /esbós/);
    });
  });
}
