#!/usr/bin/env node
// Informe del JSON-LD de dist/ (ES y /va/): por página, nº de scripts ld+json,
// @types, @id del nodo de página, inLanguage, referencias { "@id" } sin
// resolver y nº de ImageObject. Sale con código 1 si hay incoherencias.
// Uso: node scripts/schema-report.mjs   (o npm run seo:schema-report)
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const ORIGIN = 'https://fallasuissa.es';
const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const PAGE_TYPES = new Set(['WebPage', 'CollectionPage', 'AboutPage', 'ImageGallery', 'ItemPage', 'ContactPage', 'ProfilePage', 'MediaGallery']);
const EXCLUDED = new Set(['ai-info.html', 'mantenimiento.html', 'base.html']);
const PROHIBIDOS = ['Quiles', 'Marta Soriano', 'Santos Ramos, "jobTitle": "Fallera', '0000-00-00T', "fallasuïssal'alqueriadelfavero"];

const hasType = (n, t) => n && (Array.isArray(n['@type']) ? n['@type'].includes(t) : n['@type'] === t);

function collect(value, ids, refs, imgs) {
  if (Array.isArray(value)) return value.forEach((v) => collect(v, ids, refs, imgs));
  if (!value || typeof value !== 'object') return;
  const keys = Object.keys(value);
  if (typeof value['@id'] === 'string') {
    if (keys.length === 1) refs.push(value['@id']);
    else ids.add(value['@id']);
  }
  if (hasType(value, 'ImageObject')) imgs.count++;
  keys.forEach((k) => collect(value[k], ids, refs, imgs));
}

function listPages() {
  const out = [];
  for (const f of fs.readdirSync(DIST)) {
    if (f.endsWith('.html') && !EXCLUDED.has(f) && !f.startsWith('google')) out.push(f);
  }
  for (const f of fs.readdirSync(path.join(DIST, 'va'))) {
    if (f.endsWith('.html') && !EXCLUDED.has(f) && !f.startsWith('google')) out.push(`va/${f}`);
  }
  return out.sort();
}

let errores = 0;
const filas = [];
for (const rel of listPages()) {
  const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const problemas = [];
  if (scripts.length !== 1) problemas.push(`${scripts.length} scripts ld+json`);
  let graph = [];
  try {
    const data = JSON.parse(scripts[0][1]);
    graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    if (!graph.length) problemas.push('sin @graph');
  } catch (e) {
    problemas.push(`JSON inválido: ${e.message}`);
  }
  const ids = new Set(); const refs = []; const imgs = { count: 0 };
  collect(graph, ids, refs, imgs);
  const sinResolver = [...new Set(refs.filter((r) => !ids.has(r) && !r.startsWith('https://hope-incliva.com')))];
  if (sinResolver.length) problemas.push(`refs sin resolver: ${sinResolver.join(', ')}`);
  if (!graph.some((n) => n['@id'] === ORG_ID && hasType(n, 'Organization'))) problemas.push('falta #organization');
  if (!graph.some((n) => n['@id'] === SITE_ID && hasType(n, 'WebSite'))) problemas.push('falta #website');
  const pageNode = graph.find((n) => [...PAGE_TYPES].some((t) => hasType(n, t)) && typeof n['@id'] === 'string' && n['@id'].endsWith('#webpage'));
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!pageNode) problemas.push('sin nodo de página #webpage');
  else {
    if (pageNode.url !== canonical) problemas.push(`url ${pageNode.url} ≠ canonical ${canonical}`);
    const esperado = rel.startsWith('va/') ? 'ca-ES' : 'es-ES';
    if (pageNode.inLanguage !== esperado && !Array.isArray(pageNode.inLanguage)) problemas.push(`inLanguage ${pageNode.inLanguage} ≠ ${esperado}`);
  }
  const texto = scripts.map((m) => m[1]).join('\n');
  for (const p of PROHIBIDOS) if (texto.includes(p) || (p.includes('fallasuïssal') && html.includes(p))) problemas.push(`contiene "${p}"`);
  if (/"(?:contentUrl|url|item)":\s*"[^"]*\.\.\//.test(texto)) problemas.push('URL relativa (../) en el JSON-LD');
  if (/"contentUrl":\s*"[^"]*\?v=/.test(texto)) problemas.push('contentUrl con ?v=');
  if (problemas.length) errores++;
  filas.push({ rel, scripts: scripts.length, types: [...new Set(graph.map((n) => Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type']))].join(','), page: pageNode ? pageNode['@id'] : '-', lang: pageNode ? String(pageNode.inLanguage) : '-', imgs: imgs.count, problemas });
}

for (const f of filas) {
  const estado = f.problemas.length ? '✗' : '✓';
  console.log(`${estado} ${f.rel.padEnd(34)} scripts=${f.scripts} lang=${f.lang.padEnd(6)} img=${String(f.imgs).padStart(3)}  ${f.types}`);
  for (const p of f.problemas) console.log(`     └ ${p}`);
}
console.log(`\n${filas.length} páginas, ${errores} con problemas`);
process.exit(errores ? 1 : 0);
