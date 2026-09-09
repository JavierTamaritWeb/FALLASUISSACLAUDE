const { test, expect } = require('@playwright/test');

// Desde v4.19.0 la sección Ofrenda (index.html + ofrenda.html) ya no lleva el visor
// de vídeo (#videoOfrenda + overlay #videoOfrendaFullscreen): en su lugar muestra la
// foto de la Fallera Mayor con el rótulo "Próxima Ofrenda" superpuesto. El vídeo de
// 2026 se reproduce en Historia/Archivos/Ofrendas (tests/historia-ofrendas.e2e.spec.js).
for (const pagePath of ['/index.html', '/ofrenda.html']) {
  test(`${pagePath} muestra "Próxima Ofrenda" sobre la Fallera Mayor y sin visor de vídeo`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(pagePath);

    // Sin visor: ni vídeo inline, ni overlay, ni script del reproductor
    await expect(page.locator('#videoOfrenda, #videoOfrendaFullscreen, .ofrenda .video-dron__frame')).toHaveCount(0);
    expect(await page.evaluate(() => Array.from(document.scripts).some((s) => s.src.includes('ofrenda-video.js')))).toBe(false);

    const figura = page.locator('.ofrenda .ofrenda__proxima');
    await expect(figura).toHaveCount(1);
    await figura.scrollIntoViewIfNeeded();

    const img = figura.locator('img.ofrenda__proxima-imagen');
    await expect(img).toHaveAttribute('alt', 'Lucía Gutiérrez Martín, Fallera Mayor de la Falla Suïssa 2026-2027');
    await expect(figura.locator('source[type="image/avif"]')).toHaveAttribute('srcset', /FalleraMayor-2026-27\.avif$/);
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    // Visible de verdad (sin skeleton de opacidad) y formato optimizado servido
    expect(await img.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await img.evaluate((el) => el.currentSrc)).toMatch(/FalleraMayor-2026-27\.(avif|webp)$/);

    // Rótulo grande, superpuesto sobre la imagen (misma caja)
    const texto = figura.locator('.ofrenda__proxima-texto');
    await expect(texto).toHaveText('Próxima Ofrenda');
    const fontSize = await texto.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(32);
    // Geometría de layout (offset*), no boundingBox: la sección está en la animación
    // de reveal (transform) y las cajas transformadas dan diferencias subpíxel aleatorias
    const geo = await figura.evaluate((fig) => {
      const img = fig.querySelector('img');
      const txt = fig.querySelector('.ofrenda__proxima-texto');
      return {
        figW: fig.clientWidth, figH: fig.clientHeight,
        imgTop: img.offsetTop, imgH: img.offsetHeight,
        txtTop: txt.offsetTop, txtLeft: txt.offsetLeft, txtW: txt.offsetWidth, txtH: txt.offsetHeight
      };
    });
    expect(geo.txtTop).toBeGreaterThanOrEqual(geo.imgTop);
    expect(geo.txtTop + geo.txtH).toBeLessThanOrEqual(geo.imgTop + geo.imgH);
    expect(geo.txtLeft).toBeGreaterThanOrEqual(0);
    expect(geo.txtLeft + geo.txtW).toBeLessThanOrEqual(geo.figW + 1);
    // Rótulo en color primario, centrado verticalmente sobre la foto sombreada (v4.19.1)
    const estilo = await texto.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, alignItems: cs.alignItems, inset: cs.bottom };
    });
    expect(estilo.color).toBe('rgb(255, 111, 97)');
    expect(estilo.alignItems).toBe('center');
    expect(estilo.inset).toBe('0px');
    const velo = await figura.evaluate((el) => getComputedStyle(el, '::after').backgroundImage);
    expect(velo).toContain('linear-gradient');
    expect(velo).toContain('0.72');
  });

  // v4.20.0: en Safari la galería desaparecía (alto 0) porque .ofrenda__figura
  // solo tiene hijos absolutos y WebKit ignoraba el aspect-ratio del item de
  // grid estirado. El pseudoelemento ::before reserva el alto 3:4 por padding.
  test(`${pagePath}: la galería reserva el alto 3:4 sin depender de aspect-ratio`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(pagePath);
    const figuras = page.locator('.ofrenda__galeria .ofrenda__figura');
    await expect(figuras).toHaveCount(3);
    await figuras.first().scrollIntoViewIfNeeded();
    for (let i = 0; i < 3; i += 1) {
      const geo = await figuras.nth(i).evaluate((el) => {
        const cs = getComputedStyle(el);
        const before = getComputedStyle(el, '::before');
        return {
          w: el.offsetWidth, h: el.offsetHeight, alignSelf: cs.alignSelf,
          beforeDisplay: before.display, beforePadding: parseFloat(before.paddingTop)
        };
      });
      expect(geo.h).toBeGreaterThan(100);
      expect(Math.abs(geo.h / geo.w - 4 / 3)).toBeLessThan(0.02);
      expect(geo.alignSelf).toBe('start');
      expect(geo.beforeDisplay).toBe('block');
      // padding-top del ::before = 133,333 % del ancho de la figura
      expect(Math.abs(geo.beforePadding - geo.w * 4 / 3)).toBeLessThan(1);
      const img = figuras.nth(i).locator('img.ofrenda__imagen');
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
      expect(await img.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(100);
    }
  });

  test(`/va${pagePath} pre-renderiza el rótulo en valenciano`, async ({ page }) => {
    await page.goto('/va' + pagePath);
    await expect(page.locator('.ofrenda .ofrenda__proxima-texto')).toHaveText('Pròxima Ofrena');
    await expect(page.locator('.ofrenda .ofrenda__proxima-imagen'))
      .toHaveAttribute('alt', 'Lucía Gutiérrez Martín, Fallera Major de la Falla Suïssa 2026-2027');
  });
}

test('index.html publica los iconos TikTok saneados en la CSS compilada', async ({ page }) => {
  await page.goto('/index.html');

  const cssContent = await page.evaluate(async () => {
    const mainStylesheet = Array.from(document.styleSheets)
      .map((sheet) => sheet.href)
      .find((href) => href && href.includes('/css/main.css'));

    if (!mainStylesheet) {
      return '';
    }

    const response = await fetch(mainStylesheet, { cache: 'no-store' });
    return response.text();
  });

  expect(cssContent).toContain('icono_tiktok1-v2.svg');
  expect(cssContent).toContain('icono_tiktok-v2.svg');
  expect(cssContent).toContain('.sociales__enlace[href*="tiktok.com"]:hover:before');
});
