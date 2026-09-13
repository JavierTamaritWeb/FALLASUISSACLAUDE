// Artefactos SEO derivados de las páginas publicables, no de listas paralelas.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ORIGIN = 'https://fallasuissa.es';
const escapeXml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xml = body => '<?xml version="1.0" encoding="UTF-8"?>\n' + body + '\n';

function buildNewsSitemap(articles, now = new Date()) {
  const recent = articles.filter(article => {
    const published = Date.parse(article.datePublished);
    return Number.isFinite(published) && published <= now.getTime() && now.getTime() - published < 48 * 60 * 60 * 1000;
  });
  return xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + recent.map(article =>
    `  <url><loc>${escapeXml(article.url)}</loc><news:news><news:publication><news:name>Falla Suïssa - L'Alqueria del Favero</news:name><news:language>${article.lang === 'ca' ? 'ca' : 'es'}</news:language></news:publication><news:publication_date>${escapeXml(article.datePublished)}</news:publication_date><news:title>${escapeXml(article.headline)}</news:title></news:news></url>`
  ).join('\n') + '\n</urlset>');
}

function contentHash(html) {
  // Una recompilación de CSS/JS o el año del copyright no rejuvenece la página.
  const stable = html.replace(/([?&]v=)[a-f0-9]{12}(?![a-f0-9])/gi, '$1ASSET')
    .replace(/(?:&copy;|©)\s*\d{4}/g, '© YEAR');
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function updateHistory(previous, pages, now = new Date()) {
  const history = {};
  for (const page of pages) {
    const hash = contentHash(page.html);
    const prior = previous[page.url];
    history[page.url] = { hash, modified: prior?.hash === hash ? prior.modified : now.toISOString().slice(0, 10) };
  }
  return history;
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
      pages.push({ url, html, graph, lang: prefix ? 'ca' : 'es', file });
    }
  }
  let previous = {};
  try { previous = JSON.parse(await fs.readFile(historyPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const history = updateHistory(previous, pages, now);
  const historyText = JSON.stringify(history, null, 2) + '\n';
  if (JSON.stringify(previous) !== JSON.stringify(history)) await fs.writeFile(historyPath, historyText);
  await fs.writeFile(path.join(dist, 'data/seo-history.json'), historyText);
  const urlMap = xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + pages.map(page => {
    const suffix = page.file === 'index.html' ? '' : page.file;
    const alternates = [['es', `${ORIGIN}/${suffix}`], ['ca', `${ORIGIN}/va/${suffix}`], ['x-default', `${ORIGIN}/${suffix}`]];
    return `  <url><loc>${page.url}</loc><lastmod>${history[page.url].modified}</lastmod>${alternates.map(([lang, url]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>`).join('')}</url>`;
  }).join('\n') + '\n</urlset>');
  // Compatibilidad con sitemaps antiguos ya enviados a buscadores: mismo inventario.
  for (const name of ['sitemap.xml', 'sitemap-google.xml', 'sitemap-ai-optimized.xml']) await fs.writeFile(path.join(dist, name), urlMap);
  const images = [];
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
    if (urls.size) images.push(`  <url><loc>${page.url}</loc>${[...urls].map(url => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join('')}</url>`);
  }
  await fs.writeFile(path.join(dist, 'sitemap-images.xml'), xml('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + images.join('\n') + '\n</urlset>'));
  const articles = pages.flatMap(page => page.graph.filter(node => node['@type'] === 'BlogPosting').map(node => ({ ...node, lang: page.lang })));
  const news = buildNewsSitemap(articles, now);
  await fs.writeFile(path.join(dist, 'sitemap-news.xml'), news);
  const maps = ['sitemap.xml', 'sitemap-images.xml'];
  if (news.includes('<news:news>')) maps.push('sitemap-news.xml');
  await fs.writeFile(path.join(dist, 'sitemap-index.xml'), xml('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + maps.map(file => `  <sitemap><loc>${ORIGIN}/${file}</loc></sitemap>`).join('\n') + '\n</sitemapindex>'));
  return { pages: pages.length, articles: articles.length };
}

module.exports = { buildNewsSitemap, contentHash, updateHistory, generateSeoArtifacts };
