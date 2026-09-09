// Subsección Historia/Archivos/Ofrendas (v4.18.0): panel "Ofrenda 2026" con el
// vídeo de la Ofrenda reproducido por el <video controls> nativo del navegador
// (sin visor .video-dron__*, sin JS propio), preload="none" por los 30 MB.

const { test, expect } = require('@playwright/test');

const PAGINAS = ['index.html', 'lafalla.html'];
const VIEWPORTS = [
  { nombre: 'desktop', width: 1280, height: 800 },
  { nombre: 'móvil', width: 375, height: 667 }
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

async function abrirPanel(page, pagina) {
  const sufijo = pagina.replace('.html', '');
  const titular = page.locator('.accordion--ofrendas .accordion__titular').first();
  const panel = page.locator(`#ofrenda-2026-${sufijo}`);
  await titular.scrollIntoViewIfNeeded();
  await expect(titular).toHaveAttribute('aria-expanded', 'false');
  // Cerrado: el acordeón colapsa con max-height 0 + overflow hidden (medir alto)
  expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await titular.click();
  await expect(titular).toHaveAttribute('aria-expanded', 'true');
  const figura = panel.locator('.ofrendas-video');
  await expect(figura).toBeVisible();
  return { titular, panel, figura };
}

for (const pagina of PAGINAS) {
  test.describe(`Historia/Archivos/Ofrendas — ${pagina}`, () => {
    for (const vp of VIEWPORTS) {
      test(`${vp.nombre}: panel cerrado, abre con el vídeo nativo (sin visor)`, async ({ page, request }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${pagina}`);

        const subtitulo = page.locator('h5.historia__archivos-subtitulo', { hasText: 'Ofrendas' });
        await expect(subtitulo).toHaveCount(1);

        const titular = page.locator('.accordion--ofrendas .accordion__titular').first();
        await expect(titular).toContainText('Ofrenda 2026');
        const panel = page.locator('#ofrenda-2026-' + pagina.replace('.html', ''));
        await expect(panel).toHaveAttribute('role', 'region');

        const { figura } = await abrirPanel(page, pagina);

        const video = figura.locator('video.ofrendas-video__video');
        await expect(video).toHaveCount(1);
        await expect(video).toBeVisible();
        await expect(video).toHaveAttribute('controls', '');
        await expect(video).toHaveAttribute('preload', 'none');
        await expect(video).toHaveAttribute('poster', /ofrenda-2026-001\.jpeg$/);
        await expect(video).toHaveAttribute('aria-label', 'Vídeo de la Ofrenda de la Falla Suïssa, marzo de 2026');
        await expect(figura.locator('.ofrendas-video__pie'))
          .toHaveText('Ofrenda a la Mare de Déu dels Desamparats, marzo de 2026');

        // Solo el vídeo: nada del visor .video-dron__*, ni Swiper, ni botones propios
        await expect(panel.locator('[class*="video-dron"]')).toHaveCount(0);
        await expect(panel.locator('.swiper, button, [id^="videoOfrenda"]')).toHaveCount(0);

        // El MP4 se sirve como video/mp4 y no se ha descargado (preload="none")
        const src = await video.locator('source[type="video/mp4"]').getAttribute('src');
        expect(src).toMatch(/ofrenda-2026\.mp4$/);
        const head = await request.head(new URL(src, page.url()).href);
        expect(head.status()).toBe(200);
        expect(head.headers()['content-type']).toContain('video/mp4');
        expect(await video.evaluate((el) => el.readyState)).toBe(0);

        // No desborda el panel y respeta el ancho máximo (64rem = 640px)
        const cajaVideo = await video.boundingBox();
        const cajaInner = await panel.locator('.accordion__content-inner').boundingBox();
        expect(cajaVideo.width).toBeLessThanOrEqual(640.5);
        expect(cajaVideo.x).toBeGreaterThanOrEqual(cajaInner.x - 0.5);
        expect(cajaVideo.x + cajaVideo.width).toBeLessThanOrEqual(cajaInner.x + cajaInner.width + 0.5);
        expect(Math.abs(cajaVideo.width / cajaVideo.height - 16 / 9)).toBeLessThan(0.05);

        // Botón de descarga del MP4 bajo la figura (v4.20.0): enlace .boton con
        // `download`, apunta al mismo archivo que el <source> y queda centrado
        const enlace = panel.locator('.ofrendas-video__descarga a.boton[download]');
        await expect(enlace).toHaveCount(1);
        await expect(enlace).toBeVisible();
        await expect(enlace).toHaveText('Descargar vídeo de la Ofrenda');
        await expect(enlace).toHaveAttribute('download', 'falla-suissa-ofrenda-2026.mp4');
        await expect(enlace).toHaveAttribute('aria-label', 'Descargar el vídeo de la Ofrenda 2026 (MP4, 30 MB)');
        const hrefEnlace = await enlace.getAttribute('href');
        expect(new URL(hrefEnlace, page.url()).href).toBe(new URL(src, page.url()).href);
        const headEnlace = await request.head(new URL(hrefEnlace, page.url()).href);
        expect(headEnlace.status()).toBe(200);
        expect(headEnlace.headers()['content-type']).toContain('video/mp4');
        // Geometría relativa (ambas cajas comparten la misma transformación de
        // la animación reveal, así que la diferencia de centros no se ve afectada)
        const geo = await enlace.evaluate((el) => {
          const caja = el.getBoundingClientRect();
          const contenedor = el.parentElement.getBoundingClientRect();
          const figura = el.closest('.accordion__content-inner').querySelector('.ofrendas-video').getBoundingClientRect();
          return {
            desvioCentro: (caja.left + caja.width / 2) - (contenedor.left + contenedor.width / 2),
            top: caja.top,
            finFigura: figura.bottom
          };
        });
        expect(Math.abs(geo.desvioCentro)).toBeLessThan(2);
        expect(geo.top).toBeGreaterThanOrEqual(geo.finFigura - 0.5);
      });
    }

    test('variante /va/: titular, aria-label del vídeo, pie y botón de descarga pre-renderizados en valenciano', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/va/${pagina}`);
      const sufijo = pagina.replace('.html', '');
      const titular = page.locator(`.accordion__titular[aria-controls="ofrenda-2026-${sufijo}"]`);
      await expect(titular).toContainText('Ofrena 2026');
      const panel = page.locator(`#ofrenda-2026-${sufijo}`);
      await expect(panel.locator('video.ofrendas-video__video'))
        .toHaveAttribute('aria-label', "Vídeo de l'Ofrena de la Falla Suïssa, març de 2026");
      await expect(panel.locator('.ofrendas-video__pie'))
        .toHaveText('Ofrena a la Mare de Déu dels Desamparats, març de 2026');
      // El poster y el mp4 se sirven desde la raíz (../img/) en /va/
      const poster = await panel.locator('video').getAttribute('poster');
      expect(poster.startsWith('../img/')).toBe(true);
      const enlace = panel.locator('.ofrendas-video__descarga a.boton[download]');
      await expect(enlace).toHaveText("Descarregar vídeo de l'Ofrena");
      await expect(enlace).toHaveAttribute('aria-label', "Descarregar el vídeo de l'Ofrena 2026 (MP4, 30 MB)");
      expect((await enlace.getAttribute('href')).startsWith('../img/')).toBe(true);
    });

    test('toggle ES→VA en runtime traduce titular, pie y botón de descarga', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pagina}`);
      const { titular, figura } = await abrirPanel(page, pagina);
      test.skip(!(await cambiarAValenciano(page)), 'selector de idioma no disponible');

      await expect(titular).toContainText('Ofrena 2026');
      await expect(figura.locator('.ofrendas-video__pie'))
        .toHaveText('Ofrena a la Mare de Déu dels Desamparats, març de 2026');
      await expect(page.locator('.accordion--ofrendas a.boton[download]'))
        .toHaveText("Descarregar vídeo de l'Ofrena");
    });
  });
}
