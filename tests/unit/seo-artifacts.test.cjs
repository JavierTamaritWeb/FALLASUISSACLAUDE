const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildNewsSitemap, updateHistory } = require('../../scripts/seo-artifacts.cjs');

test('el inventario excluye HTML retirado y noindex sin depender del orden de atributos', async t => {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const os = require('node:os');
  const { generateSeoArtifacts } = require('../../scripts/seo-artifacts.cjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'falla-seo-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const folder of ['src/data', 'dist/data', 'dist/va']) await fs.mkdir(path.join(root, folder), { recursive: true });
  const page = name => `<head><link rel="canonical" href="https://fallasuissa.es/${name}"><link hreflang="x-default"></head>`;
  for (const name of ['index.html', 'privada.html']) await fs.writeFile(path.join(root, 'src', name), 'fuente');
  await fs.writeFile(path.join(root, 'dist/index.html'), page(''));
  await fs.writeFile(path.join(root, 'dist/privada.html'), page('privada.html') + '<meta content="noindex, follow" name="robots">');
  await fs.writeFile(path.join(root, 'dist/retirada.html'), page('retirada.html'));
  assert.equal((await generateSeoArtifacts({ root })).pages, 1);
  const main = await fs.readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
  assert.doesNotMatch(main, /privada|retirada/);
  assert.equal(await fs.readFile(path.join(root, 'dist/sitemap-ai-optimized.xml'), 'utf8'), main);
});

test('noticias: excluye fechas futuras, inválidas y artículos de hace 48 horas', () => {
  const now = new Date('2026-09-13T12:00:00Z');
  const articles = ['2026-09-11T12:00:00Z', '2026-09-11T12:00:01Z', '2026-09-14', 'inválida'].map((datePublished, i) => ({ url: `https://example.com/${i}`, datePublished, headline: 'Falla & cultura', lang: 'ca' }));
  const xml = buildNewsSitemap(articles, now);
  assert.equal((xml.match(/<news:news>/g) || []).length, 1);
  assert.match(xml, /https:\/\/example.com\/1</);
  assert.match(xml, /Falla &amp; cultura/);
  assert.match(xml, /<news:language>ca</);
});

test('un sitemap de noticias sin artículos recientes sigue siendo XML vacío válido', () => {
  const xml = buildNewsSitemap([{ url: 'https://example.com/archivo', datePublished: '2025-03-01' }], new Date('2026-09-13'));
  assert.match(xml, /<urlset[^>]*>\s*<\/urlset>/);
  assert.doesNotMatch(xml, /<url>/);
});

test('lastmod conserva la fecha en rebuilds y cambia al modificar el contenido traducido', () => {
  const page = { url: 'https://fallasuissa.es/va/', html: '<h1>Inici</h1><script src="js/a.js?v=123456abcdef"></script><p>© 2026</p>' };
  const initial = updateHistory({}, [page], new Date('2026-09-13'));
  const rebuilt = updateHistory(initial, [{ ...page, html: page.html.replace('123456abcdef', 'abcdef987654').replace('© 2026', '© 2027') }], new Date('2027-01-01'));
  assert.equal(rebuilt[page.url].modified, '2026-09-13');
  const changed = updateHistory(rebuilt, [{ ...page, html: page.html.replace('Inici', 'Nova informació') }], new Date('2027-01-02'));
  assert.equal(changed[page.url].modified, '2027-01-02');
});
