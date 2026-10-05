// Artefactos SEO derivados de las páginas publicables, no de listas paralelas.
// Genera los sitemaps, el historial de fechas por contenido y llms-full.txt.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ORIGIN = 'https://fallasuissa.es';
const SITE_NAME = "Falla Suïssa - L'Alqueria del Favero";
// Los seis sitemaps que publica el build (robots.txt y los tests los referencian).
const SITEMAP_FILES = ['sitemap.xml', 'sitemap-google.xml', 'sitemap-ai-optimized.xml', 'sitemap-images.xml', 'sitemap-news.xml', 'sitemap-index.xml'];
const escapeXml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xml = body => '<?xml version="1.0" encoding="UTF-8"?>\n' + body + '\n';
const decodeEntities = value => String(value)
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function buildNewsSitemap(articles, now = new Date()) {
  const recent = articles.filter(article => {
    const published = Date.parse(article.datePublished);
    return Number.isFinite(published) && published <= now.getTime() && now.getTime() - published < 48 * 60 * 60 * 1000;
  });
  return xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + recent.map(article =>
    `  <url><loc>${escapeXml(article.url)}</loc><news:news><news:publication><news:name>${SITE_NAME}</news:name><news:language>${article.lang === 'ca' ? 'ca' : 'es'}</news:language></news:publication><news:publication_date>${escapeXml(article.datePublished)}</news:publication_date><news:title>${escapeXml(article.headline)}</news:title></news:news></url>`
  ).join('\n') + '\n</urlset>');
}

function contentHash(html) {
  // Una recompilación de CSS/JS, el año del copyright o las fechas que el propio
  // build escribe en el JSON-LD (dateModified/datePublished del nodo de página,
  // v4.43.0) no rejuvenecen la página: si no se neutralizaran, cada build
  // cambiaría la fecha, la fecha cambiaría el hash y el hash volvería a cambiar la fecha.
  // Se retira la clave entera (no solo el valor) para que una URL recién entrada en el
  // historial, aún sin fechas en su primera pasada, dé el mismo hash que en la segunda.
  const stable = html.replace(/([?&]v=)[a-f0-9]{12}(?![a-f0-9])/gi, '$1ASSET')
    .replace(/(?:&copy;|©)\s*\d{4}/g, '© YEAR')
    .replace(/\s*"(?:dateModified|datePublished)":\s*"\d{4}-\d{2}-\d{2}",?/g, '');
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function updateHistory(previous, pages, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const history = {};
  for (const page of pages) {
    const hash = contentHash(page.html);
    const prior = previous[page.url];
    const modified = prior?.hash === hash ? prior.modified : today;
    // `published` se fija la primera vez que la URL entra en el historial y no cambia.
    history[page.url] = { hash, modified, published: prior?.published || prior?.modified || modified };
  }
  return history;
}

// Lista de páginas con título y descripción para modelos de lenguaje (llmstxt.org).
// El resumen curado vive en src/llms.txt; este inventario se regenera en cada build.
function buildLlmsFull(pages, aiContext = '') {
  const lines = [`# ${SITE_NAME}`, ''];
  const index = pages.find(page => page.lang === 'es' && page.file === 'index.html');
  if (index?.description) lines.push(`> ${index.description}`, '');
  lines.push('Inventario generado por el build a partir de las páginas publicadas (canonical, título y descripción de cada una). El resumen curado del sitio está en https://fallasuissa.es/llms.txt.', '');
  const order = (a, b) => (a.file === 'index.html' ? -1 : b.file === 'index.html' ? 1 : a.file.localeCompare(b.file, 'es', { numeric: true }));
  for (const [lang, heading] of [['es', '## Páginas (español)'], ['ca', '## Pàgines (valencià)']]) {
    const subset = pages.filter(page => page.lang === lang).sort(order);
    if (!subset.length) continue;
    lines.push(heading, '');
    for (const page of subset) lines.push(`- [${page.title || page.url}](${page.url})${page.description ? `: ${page.description}` : ''}`);
    lines.push('');
  }
  const context = String(aiContext).replace(/^#[^\n]*\n/, '').trim();
  if (context) lines.push('## Contexto', '', context, '');
  return lines.join('\n');
}

function readHead(html) {
  // <title> puede llevar atributos (data-i18n) y la meta description lleva también
  // data-i18n-content: el atributo buscado es exactamente ` content=`.
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const description = html.match(/<meta\b(?=[^>]*\sname="description")(?=[^>]*\scontent="([^"]*)")[^>]*>/i)?.[1] || '';
  return { title: decodeEntities(title.replace(/\s+/g, ' ').trim()), description: decodeEntities(description.trim()) };
}

async function generateSeoArtifacts({ root = process.cwd(), now = new Date() } = {}) {
  const dist = path.join(root, 'dist');
  const historyPath = path.join(root, 'src/data/seo-history.json');
  const pages = [];
  // Un HTML residual de una página retirada no debe volver al sitemap.
  const sources = new Set(await fs.readdir(path.join(root, 'src')));
  for (const prefix of ['', 'va/']) {
    for (const file of (await fs.readdir(path.join(dist, prefix))).filter(file => file.endsWith('.html') && sources.has(file)).sort()) {
      const html = await fs.readFile(path.join(dist, prefix, file), 'utf8');
      if (/<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*noindex)[^>]*>/i.test(html)) continue;
      const url = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      if (!url || !html.includes('hreflang="x-default"')) continue;
      const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || '{}')['@graph'] || [];
      pages.push({ url, html, graph, lang: prefix ? 'ca' : 'es', file, ...readHead(html) });
    }
  }
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(historyPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const history = updateHistory(previous, pages, now);
  const historyText = JSON.stringify(history, null, 2) + '\n';
  if (JSON.stringify(previous) !== JSON.stringify(history)) await fs.writeFile(historyPath, historyText);
  await fs.writeFile(path.join(dist, 'data/seo-history.json'), historyText);
  const latest = list => list.map(url => history[url]?.modified).filter(Boolean).sort().pop();
  const urlMap = xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + pages.map(page => {
    const suffix = page.file === 'index.html' ? '' : page.file;
    const alternates = [['es', `${ORIGIN}/${suffix}`], ['ca', `${ORIGIN}/va/${suffix}`], ['x-default', `${ORIGIN}/${suffix}`]];
    return `  <url><loc>${page.url}</loc><lastmod>${history[page.url].modified}</lastmod>${alternates.map(([lang, url]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>`).join('')}</url>`;
  }).join('\n') + '\n</urlset>');
  // Compatibilidad con sitemaps antiguos ya enviados a buscadores: mismo inventario.
  for (const name of ['sitemap.xml', 'sitemap-google.xml', 'sitemap-ai-optimized.xml']) await fs.writeFile(path.join(dist, name), urlMap);
  const images = [];
  const imagePages = [];
  for (const page of pages) {
    const urls = new Set();
    const walk = value => {
      if (Array.isArray(value)) return value.forEach(walk);
      if (!value || typeof value !== 'object') return;
      if (value['@type'] === 'ImageObject' && (value.contentUrl || value.url)) urls.add(value.contentUrl || value.url);
      Object.values(value).forEach(walk);
    };
    // El logo institucional no desplaza a las fotos de la galería o el artículo.
    page.graph.filter(node => node['@type'] !== 'Organization' && node['@type'] !== 'WebSite').forEach(walk);
    for (const article of page.graph.filter(node => node['@type'] === 'BlogPosting')) {
      for (const url of Array.isArray(article.image) ? article.image : [article.image]) if (typeof url === 'string') urls.add(url);
    }
    if (urls.size) {
      imagePages.push(page.url);
      images.push(`  <url><loc>${page.url}</loc>${[...urls].map(url => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join('')}</url>`);
    }
  }
  await fs.writeFile(path.join(dist, 'sitemap-images.xml'), xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + images.join('\n') + '\n</urlset>'));
  const articles = pages.flatMap(page => page.graph.filter(node => node['@type'] === 'BlogPosting').map(node => ({ ...node, lang: page.lang, pageUrl: page.url })));
  const news = buildNewsSitemap(articles, now);
  await fs.writeFile(path.join(dist, 'sitemap-news.xml'), news);
  // El índice lleva el lastmod de cada sitemap: la fecha más reciente de las páginas que anuncia.
  const maps = [['sitemap.xml', latest(pages.map(page => page.url))], ['sitemap-images.xml', latest(imagePages)]];
  if (news.includes('<news:news>')) maps.push(['sitemap-news.xml', latest(articles.map(article => article.pageUrl))]);
  await fs.writeFile(path.join(dist, 'sitemap-index.xml'), xml('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + maps.map(([file, lastmod]) => `  <sitemap><loc>${ORIGIN}/${file}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</sitemap>`).join('\n') + '\n</sitemapindex>'));
  let aiContext = '';
  try { aiContext = await fs.readFile(path.join(root, 'src/seo/ai-training-data.md'), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.writeFile(path.join(dist, 'llms-full.txt'), buildLlmsFull(pages, aiContext));
  return { pages: pages.length, articles: articles.length };
}

module.exports = { ORIGIN, SITEMAP_FILES, buildNewsSitemap, buildLlmsFull, contentHash, updateHistory, generateSeoArtifacts };
