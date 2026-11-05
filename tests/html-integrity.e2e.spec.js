// Guardias de integridad del HTML generado (auditoría del 10-sep-2026, v4.22.0):
//  1. Balance de etiquetas en todos los dist/*.html — un </div> sobrante en el
//     modal de contacto de index.html pasó desapercibido durante meses porque
//     los navegadores lo toleran en silencio.
//  2. Las galerías en /va/ cargan sus imágenes desde la raíz del sitio: las
//     rutas "img/..." de dataPagesN.json deben pasar por SITE_ROOT, o resolvían
//     a /va/img/... (404 en local, 301 en producción por la regla A2 del .htaccess).

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// Comprueba que cada etiqueta de cierre corresponde a la última abierta.
// Devuelve la lista de problemas (vacía si el documento está balanceado).
function tagBalanceErrors(html) {
  const errors = [];
  const stack = [];
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  let m;
  let line = 1;
  let last = 0;
  while ((m = tagRe.exec(clean)) !== null) {
    line += (clean.slice(last, m.index).match(/\n/g) || []).length;
    last = m.index;
    const name = m[1].toLowerCase();
    const closing = m[0].startsWith('</');
    if (VOID.has(name) || (!closing && m[2] === '/')) continue;
    if (!closing) {
      stack.push({ name, line });
      continue;
    }
    if (stack.length && stack[stack.length - 1].name === name) {
      stack.pop();
      continue;
    }
    const idx = stack.map((s) => s.name).lastIndexOf(name);
    if (idx === -1) {
      errors.push(`</${name}> huérfano en la línea ${line}`);
    } else {
      const dangling = stack.slice(idx + 1).map((s) => `<${s.name}> L${s.line}`).join(', ');
      errors.push(`</${name}> en la línea ${line} cierra sobre etiquetas abiertas: ${dangling}`);
      stack.length = idx;
    }
  }
  for (const s of stack) errors.push(`<${s.name}> abierto en la línea ${s.line} sin cerrar`);
  return errors;
}

test.describe('Integridad del HTML generado', () => {
  const pages = fs.readdirSync(distDir).filter((f) => f.endsWith('.html'));

  for (const page of pages) {
    test(`dist/${page} tiene las etiquetas balanceadas`, () => {
      const html = fs.readFileSync(path.join(distDir, page), 'utf8');
      expect(tagBalanceErrors(html)).toEqual([]);
    });
  }

  test('las galerías en /va/ cargan sus imágenes desde la raíz (SITE_ROOT)', async ({ page }) => {
    const badRequests = [];
    page.on('response', (res) => {
      if (/\/va\/img\//.test(res.url()) || (res.status() >= 400 && res.url().includes('/img/'))) {
        badRequests.push(`${res.status()} ${res.url()}`);
      }
    });
    await page.goto('/va/galeria_1.html');
    const firstImage = page.locator('.notepad__page img').first();
    await expect(firstImage).toBeVisible();
    await expect(firstImage).toHaveAttribute('src', /^\/img\/apunta\//);
    await expect.poll(async () => firstImage.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(badRequests).toEqual([]);
  });
});

// v4.45.0: las páginas legales, el banner de cookies y el de subvención se
// retiraron sin dejar rastro; v4.46.0: también los formularios de autorización
// de imagen de Nuevos Falleros. Solo el .htaccess los nombra (410 Gone).
test('sin rastro de las páginas legales, los banners ni las autorizaciones retiradas', () => {
  const dist = path.join(__dirname, '..', 'dist');
  const RASTRO = /aviso-legal|privacidad\.html|cookies\.html|banner-subvencion|cookie-banner|subvencion-2026|cookieConsent|bannerSubvencion|footer__legal|propiedad-intelectual|autorizacion-imagen|autorizacionImagen|contenido-legal|formulariosTitulo|formMayores|formMenores|nuevos-falleros__card|DigitalDocument/;
  const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'img' || e.name === 'pdf' || e.name === 'fonts' ? [] : recorrer(ruta);
    return /\.(html|xml|txt|json|js|css|md)$/.test(e.name) ? [ruta] : [];
  });
  const conRastro = recorrer(dist).filter((f) => RASTRO.test(fs.readFileSync(f, 'utf8')));
  expect(conRastro.map((f) => path.relative(dist, f))).toEqual([]);
  for (const f of ['aviso-legal.html', 'privacidad.html', 'cookies.html', 'va/aviso-legal.html', 'js/cookie-banner.js', 'js/banner-subvencion.js', 'img/subvenciones', 'autorizacion-imagen.html', 'autorizacion-imagen-menor.html', 'va/autorizacion-imagen.html', 'va/autorizacion-imagen-menor.html']) {
    expect(fs.existsSync(path.join(dist, f)), f).toBe(false);
  }
});
