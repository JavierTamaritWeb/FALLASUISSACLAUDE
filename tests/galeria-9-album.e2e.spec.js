// tests/galeria-9-album.e2e.spec.js
// Galería Fallera Mayor Infantil 2026-27 (galeria_9, v4.24.0): bloc en modo
// álbum (dos páginas a partir de 1200px, una por debajo) y vídeo vertical
// nativo con botón de ampliar y descarga. Corre contra dist/ (npm run build).

const { test, expect } = require('@playwright/test');

const TOTAL = 40;
const IMG_RE = /\/img\/fallera-mayor-infantil\/fmi-2026-27\/fmi-2026-27-\d{3}\.(avif|webp|jpeg)$/;

async function abrirGaleria(page, ruta = '/galeria_9.html') {
  await page.goto(ruta);
  await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });
  // Espera a que lang.js haya cargado las traducciones (indicador traducido)
  await expect.poll(() => page.locator('.notepad__indicator').textContent()).toMatch(/Pàgin|Págin/);
}

async function estadoAlbum(page) {
  return page.evaluate(() => {
    const notepad = document.querySelector('.notepad');
    // Caja de contenido del bloc (descontando el lomo izquierdo de 30px)
    const nbRaw = notepad.getBoundingClientRect();
    const nb = { left: nbRaw.left + notepad.clientLeft, top: nbRaw.top + notepad.clientTop, width: notepad.clientWidth };
    const activas = Array.from(document.querySelectorAll('.notepad__page--active'));
    return {
      total: document.querySelectorAll('.notepad__page').length,
      activas: activas.length,
      derechas: document.querySelectorAll('.notepad__page--derecha').length,
      indicador: document.querySelector('.notepad__indicator').textContent.trim(),
      prevDisabled: document.getElementById('prevBtn').disabled,
      nextDisabled: document.getElementById('nextBtn').disabled,
      notepadWidth: nb.width,
      paginas: activas.map((a) => {
        const r = a.getBoundingClientRect();
        const img = a.querySelector('img');
        return {
          left: r.left - nb.left,
          top: r.top - nb.top,
          width: r.width,
          src: img.currentSrc || img.src,
          cargada: img.complete && img.naturalWidth > 0,
          ariaHidden: a.getAttribute('aria-hidden')
        };
      })
    };
  });
}

test.describe('galeria_9 — álbum a doble página (≥1200px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('muestra 40 páginas, dos activas lado a lado y el indicador de rango', async ({ page }) => {
    await abrirGaleria(page);
    const s = await estadoAlbum(page);
    expect(s.total).toBe(TOTAL);
    expect(s.activas).toBe(2);
    expect(s.derechas).toBe(1);
    expect(s.indicador).toBe('Páginas 1-2 de 40');
    expect(s.prevDisabled).toBe(true);
    expect(s.nextDisabled).toBe(false);
    // Izquierda en x=0, derecha en la mitad; misma línea superior; media anchura cada una
    const [izq, der] = s.paginas;
    expect(Math.abs(izq.left)).toBeLessThan(1);
    expect(Math.abs(der.left - s.notepadWidth / 2)).toBeLessThan(1.5);
    expect(Math.abs(izq.top - der.top)).toBeLessThan(1);
    expect(Math.abs(izq.width - s.notepadWidth / 2)).toBeLessThan(1.5);
    for (const p of s.paginas) {
      expect(p.src).toMatch(IMG_RE);
      expect(p.cargada).toBe(true);
      expect(p.ariaHidden).toBe('false');
    }
    // El lomo central se dibuja con ::after
    const lomo = await page.evaluate(() => getComputedStyle(document.querySelector('.notepad'), '::after').backgroundImage);
    expect(lomo).toContain('linear-gradient');
  });

  test('Siguiente/Anterior pasan de dos en dos y el último pliego deshabilita Siguiente', async ({ page }) => {
    await abrirGaleria(page);
    await page.click('#nextBtn');
    await expect.poll(() => page.locator('.notepad__indicator').textContent()).toBe('Páginas 3-4 de 40');
    let s = await estadoAlbum(page);
    expect(s.activas).toBe(2);
    expect(s.paginas[0].src).toMatch(/fmi-2026-27-003\./);
    expect(s.paginas[1].src).toMatch(/fmi-2026-27-004\./);
    expect(s.prevDisabled).toBe(false);

    await page.click('#prevBtn');
    await expect.poll(() => page.locator('.notepad__indicator').textContent()).toBe('Páginas 1-2 de 40');

    // Hasta el final: 19 pulsaciones más desde 1-2 → 39-40
    for (let i = 0; i < 19; i += 1) {
      const antes = await page.locator('.notepad__indicator').textContent();
      await page.click('#nextBtn');
      await expect.poll(() => page.locator('.notepad__indicator').textContent()).not.toBe(antes);
    }
    s = await estadoAlbum(page);
    expect(s.indicador).toBe('Páginas 39-40 de 40');
    expect(s.nextDisabled).toBe(true);
    expect(s.paginas[1].src).toMatch(/fmi-2026-27-040\./);
  });

  test('al bajar de 1200px queda una sola página activa con el índice coherente', async ({ page }) => {
    await abrirGaleria(page);
    await page.click('#nextBtn');
    await expect.poll(() => page.locator('.notepad__indicator').textContent()).toBe('Páginas 3-4 de 40');
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect.poll(() => page.locator('.notepad__page--active').count()).toBe(1);
    const s = await estadoAlbum(page);
    expect(s.derechas).toBe(0);
    expect(s.indicador).toBe('Página 3 de 40');
    expect(s.paginas[0].src).toMatch(/fmi-2026-27-003\./);
    // Y al volver a ≥1200 recupera el pliego 3-4
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(() => page.locator('.notepad__page--active').count()).toBe(2);
    expect((await estadoAlbum(page)).indicador).toBe('Páginas 3-4 de 40');
  });

  test('las fotos del álbum se amplían con el visor de fullscreen.js (fallback sin API)', async ({ page }) => {
    await abrirGaleria(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
      Object.defineProperty(document, 'webkitFullscreenEnabled', { value: false, configurable: true });
    });
    await page.locator('.notepad__page--derecha img').click();
    const overlay = page.locator('#fullscreen-fallback');
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await expect(overlay.locator('img')).toHaveAttribute('src', /fmi-2026-27-002\./);
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });
});

test.describe('galeria_9 — móvil (<1200px): bloc de una página', () => {
  test('una sola página activa, indicador clásico y sin página derecha', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await abrirGaleria(page);
    const s = await estadoAlbum(page);
    expect(s.total).toBe(TOTAL);
    expect(s.activas).toBe(1);
    expect(s.derechas).toBe(0);
    expect(s.indicador).toBe('Página 1 de 40');
    expect(Math.abs(s.paginas[0].width - s.notepadWidth)).toBeLessThan(1.5);
    await page.click('#nextBtn');
    await expect.poll(() => page.locator('.notepad__indicator').textContent()).toBe('Página 2 de 40');
  });
});

test.describe('galeria_9 — vídeo vertical nativo', () => {
  test('<video controls preload="none"> 9:16 con póster, ampliar y descarga', async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abrirGaleria(page);
    const video = page.locator('video.galeria-video__video');
    await expect(video).toHaveCount(1);
    await video.scrollIntoViewIfNeeded();
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).toHaveAttribute('poster', /(^|\/)img\/fallera-mayor-infantil\/fmi-2026-27\/fmi-2026-27-poster\.jpeg$/);
    await expect(video).toHaveAttribute('aria-label', 'Vídeo de la proclamación de Sofía Gómez Medina como Fallera Mayor Infantil 2026-27 de la Falla Suïssa');
    // Ningún elemento de la plantilla de visor
    await expect(page.locator('[class*="video-dron"], [id^="videoDron"], [id^="videoOfrenda"]')).toHaveCount(0);

    // Proporción retrato y ancho acotado (36rem)
    const box = await video.boundingBox();
    expect(Math.abs(box.width / box.height - 9 / 16)).toBeLessThan(0.05);
    expect(box.width).toBeLessThanOrEqual(360.5);

    // Sin precarga y MP4 servido con su MIME
    expect(await video.evaluate((el) => el.readyState)).toBe(0);
    const src = await video.locator('source').getAttribute('src');
    expect(src).toMatch(/(^|\/)img\/fallera-mayor-infantil\/fmi-2026-27\/video\/fmi-2026-27\.mp4$/);
    const head = await request.head(src);
    expect(head.status()).toBe(200);
    expect(head.headers()['content-type']).toContain('video/mp4');

    // Botón ampliar (Fullscreen API disponible en Chromium) y descarga
    const ampliar = page.locator('#galeriaVideoAmpliar');
    await expect(ampliar).toBeVisible();
    await expect(ampliar).toHaveText('Ampliar vídeo');
    const descarga = page.locator('.galeria-video__acciones a.boton[download]');
    await expect(descarga).toHaveCount(1);
    await expect(descarga).toHaveAttribute('download', 'falla-suissa-fallera-mayor-infantil-2026-27.mp4');
    await expect(descarga).toHaveAttribute('aria-label', /MP4, 19 MB/);
    expect(await descarga.evaluate((a) => a.href)).toBe(await video.locator('source').evaluate((s) => s.src));

    // El pie es el de la proclamación
    await expect(page.locator('.galeria-video__pie')).toHaveText('Proclamación de Sofía Gómez Medina, Fallera Mayor Infantil 2026-27');
  });
});

test.describe('galeria_9 — /va/ pre-renderizado', () => {
  test('textos en valenciano, assets desde ../img/ y sin peticiones a /va/img/', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const malas = [];
    page.on('request', (req) => {
      if (/\/va\/(img|data|js|css)\//.test(req.url())) malas.push(req.url());
    });
    await page.goto('/va/galeria_9.html');
    await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });
    await expect(page.locator('h1.heading-inner')).toContainText('Fallera Major Infantil 2026-27');
    await expect(page.locator('.galeria-video__titulo')).toHaveText('Vídeo de la proclamació');
    await expect(page.locator('#galeriaVideoAmpliar')).toHaveText('Ampliar vídeo');
    await expect(page.locator('.galeria-video__acciones a.boton[download]')).toHaveText('Descarregar vídeo');
    const poster = await page.locator('video.galeria-video__video').getAttribute('poster');
    expect(poster).toMatch(/^\.\.\/img\//);
    const src = await page.locator('video.galeria-video__video source').getAttribute('src');
    expect(src).toMatch(/^\.\.\/img\//);
    await expect.poll(() => page.locator('.notepad__indicator').textContent()).toBe('Pàgines 1-2 de 40');
    const s = await estadoAlbum(page);
    expect(s.paginas.every((p) => p.cargada && IMG_RE.test(p.src))).toBe(true);
    expect(malas).toEqual([]);
  });
});
