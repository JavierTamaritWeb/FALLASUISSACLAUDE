// Guardia de coherencia del color del navegador (v4.41.5): las metas
// theme-color / msapplication-* de todas las páginas publicadas, los dos
// manifests y THEME_COLORS de js/dark.js deben llevar la misma pareja de
// colores (blanco en claro, negro en oscuro). Nació de las metas en #0a4b8d,
// el azul institucional que el hero dejó de usar en 4.30.45. Corre contra dist/.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const dist = path.join(root, 'dist');
// Páginas standalone sin metas de color (fuera del glob de htmlTask) y el
// Llibret histórico, que conserva su propio tema azul marino.
const EXCLUIDAS = new Set(['ai-info.html', 'mantenimiento.html', 'google-site-verification.html', 'llibret_2026.html']);

function coloresDeDarkJs() {
  const js = fs.readFileSync(path.join(root, 'src/js/dark.js'), 'utf8');
  const m = js.match(/const THEME_COLORS = \{ claro: '(#[0-9a-f]{6})', oscuro: '(#[0-9a-f]{6})' \}/);
  assert.ok(m, 'js/dark.js debe declarar THEME_COLORS = { claro, oscuro } con dos colores hex en minúscula');
  return { claro: m[1], oscuro: m[2] };
}

function paginas(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.html') && !EXCLUIDAS.has(f))
    .map((f) => path.join(dir, f));
}

test('todas las páginas de dist/ llevan las metas de color con los valores de dark.js', () => {
  const { claro, oscuro } = coloresDeDarkJs();
  const ficheros = [...paginas(dist), ...paginas(path.join(dist, 'va'))];
  assert.ok(ficheros.length >= 60, `se esperaban al menos 60 páginas, hay ${ficheros.length}`);
  const esperadas = [
    `<meta name="theme-color" content="${claro}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${claro}">`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${oscuro}">`,
    `<meta name="msapplication-navbutton-color" content="${claro}">`,
    `<meta name="msapplication-TileColor" content="${claro}">`
  ];
  const fallos = [];
  for (const f of ficheros) {
    const html = fs.readFileSync(f, 'utf8');
    for (const meta of esperadas) if (!html.includes(meta)) fallos.push(`${path.relative(dist, f)}: falta ${meta}`);
    if (/theme-color"[^>]*content="#0a4b8d"/i.test(html)) fallos.push(`${path.relative(dist, f)}: theme-color aún en #0a4b8d`);
    if (html.includes('black-translucent')) fallos.push(`${path.relative(dist, f)}: apple-mobile-web-app-status-bar-style black-translucent (texto blanco sobre hero claro)`);
  }
  assert.deepEqual(fallos, []);
});

test('manifest.json y site.webmanifest comparten theme_color con dark.js', () => {
  const { claro } = coloresDeDarkJs();
  for (const rel of ['manifest.json', 'img/favicon/site.webmanifest']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, rel), 'utf8'));
    assert.equal(manifest.theme_color, claro, `${rel}: theme_color`);
    assert.equal(manifest.background_color, claro, `${rel}: background_color`);
  }
});

test('_theme-compatibility.scss declara la misma pareja de colores', () => {
  const css = fs.readFileSync(path.join(dist, 'css/main.css'), 'utf8');
  const { claro, oscuro } = coloresDeDarkJs();
  // cssnano abrevia #ffffff a #fff y #000000 a #000
  const corto = (hex) => (hex[1] === hex[2] && hex[3] === hex[4] && hex[5] === hex[6] ? `#${hex[1]}${hex[3]}${hex[5]}` : hex);
  assert.match(css, new RegExp(`--theme-color-light:\\s*(${claro}|${corto(claro)})\\b`, 'i'));
  assert.match(css, new RegExp(`--theme-color-dark:\\s*(${oscuro}|${corto(oscuro)})\\b`, 'i'));
});
