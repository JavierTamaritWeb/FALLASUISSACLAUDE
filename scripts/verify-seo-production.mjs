// Verificación de solo lectura después de desplegar: no sustituye a Search Console.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://fallasuissa.es';
const version = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).version;
const results = [];
const codeAssets = new Set();
const hash = body => crypto.createHash('sha256').update(body).digest('hex');
async function request(route, headers = {}) {
  const response = await fetch(origin + route, { redirect: 'manual', headers, signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  results.push({ route, accept: headers.Accept, status: response.status, location: response.headers.get('location'), type: response.headers.get('content-type'), sha256: hash(body) });
  return { response, body };
}
async function identical(route, relative) {
  const result = await request(route);
  assert.equal(result.response.status, 200, route);
  assert.equal(result.body, await fs.readFile(path.join(root, 'dist', relative), 'utf8'), `Contenido publicado distinto de dist/: ${route}`);
  return result.body;
}

const main = await identical('/sitemap.xml', 'sitemap.xml');
for (const name of ['sitemap-index.xml', 'sitemap-google.xml', 'sitemap-ai-optimized.xml', 'sitemap-images.xml', 'sitemap-news.xml', 'sw.js', 'robots.txt', 'seo/ai-crawl.html', 'seo/ai-enhanced-schema.json', 'seo/ai-training-data.md', 'ai-discovery.json', '.well-known/agent-skills/index.json', 'data/translations.json']) await identical('/' + name, name);
const urls = [...main.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
assert.ok(urls.length > 0, 'Sitemap vacío');
assert.ok(urls.every(url => url.origin === origin), 'Origen inesperado en el sitemap');
const queue = [...urls];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const url = queue.shift();
    const route = url.pathname;
    const html = await identical(route, (route.endsWith('/') ? route + 'index.html' : route).slice(1));
    assert.ok(html.includes(`<link rel="canonical" href="${url.href}">`), `Canonical: ${route}`);
    assert.ok(!/<meta\s+name="robots"[^>]*content="[^"]*noindex/i.test(html), `Noindex: ${route}`);
    // Comprobar las mismas URL versionadas que utilizará el navegador.
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)) {
      const asset = new URL(match[1], url);
      if (asset.origin === origin) codeAssets.add(asset.pathname + asset.search);
    }
  }
}));
for (const route of codeAssets) await identical(route, new URL(route, origin).pathname.slice(1));
const markdown = await request('/', { Accept: 'text/markdown' });
assert.equal(markdown.response.status, 200);
assert.match(markdown.response.headers.get('content-type'), /text\/html/);
assert.equal(markdown.body, await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'));
for (const [route, target] of [['/index.html', '/'], ['/va/index.html', '/va/'], ['/blog', '/blog.html'], ['/?lang=ca', '/va/'], ['/?lang=es', '/'], ['/va/?lang=es', '/']]) {
  const { response } = await request(route);
  assert.equal(response.status, 301, route);
  assert.equal(new URL(response.headers.get('location'), origin).href, origin + target, route);
}
for (const [route, status] of [['/no-existe-auditoria-seo-20260913.html', 404], ['/va/no-existe-auditoria-seo-20260913.html', 404], ['/base.html', 410], ['/va/base.html', 410]]) assert.equal((await request(route)).response.status, status, route);
const fonts = JSON.parse(await fs.readFile(path.join(root, 'src/fonts/manifest.json'), 'utf8'));
const images = JSON.parse(await fs.readFile(path.join(root, 'src/data/image-variants.json'), 'utf8'));
const assets = [...fonts.map(font => `fonts/${font.file}`), ...images.map(image => image.output)];
const assetQueue = [...assets];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (assetQueue.length) {
    const file = assetQueue.shift();
    const response = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, file);
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = hash(bytes);
    assert.equal(digest, hash(await fs.readFile(path.join(root, 'dist', file))), `Recurso diferente de dist/: ${file}`);
    results.push({ route: `/${file}`, status: response.status, type: response.headers.get('content-type'), sha256: digest });
  }
}));
const report = { checkedAt: new Date().toISOString(), version, pages: urls.length, requests: results.length, results };
const outputIndex = process.argv.indexOf('--output');
if (outputIndex !== -1) {
  assert.ok(process.argv[outputIndex + 1], 'Falta la ruta de --output');
  await fs.writeFile(process.argv[outputIndex + 1], JSON.stringify(report, null, 2) + '\n');
}
console.log(`SEO producción v${version}: ${urls.length} páginas idénticas a dist/, ${results.length} respuestas verificadas; sitemaps, redirecciones y negociación correctos.`);
