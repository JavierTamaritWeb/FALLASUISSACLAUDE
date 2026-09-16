// Guardia de desbordamiento horizontal (v4.41.1). Ninguna página publicable
// (ES y /va/) puede ser más ancha que la ventana en ningún ancho de la matriz:
// ni scroll horizontal del documento ni un elemento visible que sobresalga.
// Nació del título del hero interior («Festividad del Santísimo Cristo de
// Nazaret 2026», «Autorización de derechos de imagen»), que desbordaba en 8
// páginas con `white-space: nowrap !important` y ninguna prueba lo medía: el
// harness de estilos computados compara valores entre versiones y las capturas
// visuales solo cubren páginas con títulos cortos. Corre contra dist/.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const EXCLUIDAS = new Set(['mantenimiento.html', 'ai-info.html', 'ai-crawl.html', 'base.html']);
const ANCHOS = [320, 390, 768, 1024, 1280];
const TOLERANCIA = 1; // px de redondeo

const listar = (dir) => fs.readdirSync(path.join(root, 'dist', dir))
  .filter((f) => f.endsWith('.html') && !EXCLUIDAS.has(f))
  .map((f) => (dir ? `/${dir}/${f}` : `/${f}`));
const paginas = [...listar(''), ...listar('va')];

test.describe('ninguna página desborda en horizontal', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('bannerSubvencionCerrado', 'true');
      localStorage.setItem('cookieConsent', 'necessary');
    });
  });

  for (const ancho of ANCHOS) {
    test(`${paginas.length} páginas a ${ancho} px`, async ({ page }) => {
      test.setTimeout(240000);
      await page.setViewportSize({ width: ancho, height: 900 });
      const fallos = [];
      for (const url of paginas) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => document.fonts.ready);
        const resultado = await page.evaluate((tol) => {
          const ancho = document.documentElement.clientWidth;
          const sobresalen = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= ancho + tol) continue;
            const cs = getComputedStyle(el);
            // Se ignoran los elementos que no se ven (ocultos o transparentes,
            // también por herencia de un ancestro), los fijos (no generan scroll
            // del documento; si sobresalen, la ventana los recorta) y los
            // recortados por un ancestro con overflow distinto de visible.
            if (cs.position === 'fixed') continue;
            let oculto = cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0;
            let recortado = false;
            for (let p = el.parentElement; p && p !== document.body && !oculto && !recortado; p = p.parentElement) {
              const pcs = getComputedStyle(p);
              if (Number(pcs.opacity) === 0 || pcs.visibility === 'hidden' || pcs.position === 'fixed') oculto = true;
              else if (pcs.overflowX !== 'visible' && p.getBoundingClientRect().right <= ancho + tol) recortado = true;
            }
            if (oculto || recortado) continue;
            sobresalen.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} → ${Math.round(r.right)} px`);
          }
          return { scrollWidth: document.documentElement.scrollWidth, ancho, sobresalen: sobresalen.slice(0, 5) };
        }, TOLERANCIA);
        if (resultado.scrollWidth > resultado.ancho + TOLERANCIA || resultado.sobresalen.length) {
          fallos.push(`${url}: documento ${resultado.scrollWidth} px en ${resultado.ancho} px; ${resultado.sobresalen.join(', ') || 'sin elemento visible identificado'}`);
        }
      }
      expect(fallos, fallos.join('\n')).toEqual([]);
    });
  }
});
