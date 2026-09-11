// ===================================
// DEPENDENCIES
// ===================================
const { src, dest, watch, series } = require('gulp');
const sassCompiler = require('sass');
const sass = require('gulp-sass')(sassCompiler);
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sharp = require('sharp');
const { glob } = require('glob');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const terser = require('gulp-terser');

const EVENT_BASE_URL = 'https://fallasuissa.es/eventos.html';
const EVENT_IMAGE_URL = 'https://fallasuissa.es/img/Escudo_falla.png';

// ===================================
// PATHS
// ===================================
const paths = {
  cssEntry: 'src/scss/main.scss',
  scssAll: 'src/scss/**/*.scss',
  js: { src: 'src/js/**/*.js', dest: 'dist/js' },
  data: { src: 'src/data/**/*.json', dest: 'dist/data' },
  pdf: { src: 'src/pdf/**/*.{pdf,html}', dest: 'dist/pdf' },
  imgAll: 'src/img/**/*',
  imgRasterForConvert: 'src/img/**/*.{png,jpg,jpeg}',
  imgDest: 'dist/img',
  favicon: { src: 'src/favicon_io/**/*', dest: 'dist/favicon_io' },
  // ai-info.html lo copia rootFilesTask tal cual (página noindex AI-only, no traducible);
  // excluida aquí para que htmlTask no le inyecte canonical/hreflang ni genere /va/ai-info.html (ver B2).
  // base.html es una plantilla interna: NO se publica (sin entrada en sitemap; .htaccess responde 410)
  // mantenimiento.html se copia verbatim por rootFilesTask (página standalone, noindex, sin /va/);
  // excluida aquí para que htmlTask no le inyecte canonical/hreflang ni genere /va/mantenimiento.html.
  html: { src: ['src/*.html', '!src/google*.html', '!src/ai-info.html', '!src/base.html', '!src/mantenimiento.html'], dest: 'dist' },
  root: {
    src: [
      'src/robots*.txt',
      'src/sitemap*.xml',
      'src/.htaccess',
      'src/sw.js',
      'src/manifest.json',
      'src/ai-discovery.json',
      'src/ai-info.html',
      'src/mantenimiento.html',
      'src/google*.html'
    ],
    dest: 'dist'
  },
  seo: { src: 'src/seo/**/*', dest: 'dist/seo' },
  wellKnown: { src: 'src/.well-known/**/*', dest: 'dist/.well-known' }
};

// ===================================
// HELPERS
// ===================================
function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    stream.on('finish', done);
    stream.on('end', done);
    stream.on('close', done);
    stream.on('error', reject);
  });
}

async function fileMtimeMs(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch (err) {
    if (err && err.code === 'ENOENT') return 0;
    throw err;
  }
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function distPathFromImgFile(inputFile) {
  // inputFile viene con barras del SO; normalizamos a / para hacer replace robusto
  const normalized = inputFile.split(path.sep).join('/');
  if (!normalized.startsWith('src/img/')) return path.join('dist', normalized);
  return path.join('dist', normalized.replace(/^src\/img\//, 'img/'));
}

function outputPathForModernFormat(inputFile, ext) {
  const normalized = inputFile.split(path.sep).join('/');
  const rel = normalized.startsWith('src/img/') ? normalized.slice('src/img/'.length) : normalized;
  const withoutExt = rel.replace(/\.(png|jpe?g)$/i, '');
  return path.join(paths.imgDest, `${withoutExt}.${ext}`);
}

// ===================================
// TASKS
// ===================================

// CSS - Compila SCSS (entry main.scss) a dist/css
function cssTask() {
  const stream = src(paths.cssEntry)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      cssnano({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifyFontValues: true,
          minifyGradients: true
        }]
      })
    ]))
    .pipe(dest('dist/css'));

  return streamToPromise(stream);
}

// JS - Minifica y copia
function jsTask() {
  return streamToPromise(
    src(paths.js.src)
      .pipe(terser({ compress: true, mangle: true }))
      .pipe(dest(paths.js.dest))
  );
}

// Data - Copia
function dataTask() {
  return streamToPromise(src(paths.data.src, { encoding: false }).pipe(dest(paths.data.dest)));
}

// PDF - Copia
function pdfTask() {
  return streamToPromise(src(paths.pdf.src, { encoding: false }).pipe(dest(paths.pdf.dest)));
}

const { Transform } = require('stream');

function optimizeHtmlAssetTags(html) {
  const hasSwiper = /class=(['"])[^'"]*\bswiper\b[^'"]*\1/i.test(html);

  if (!hasSwiper) {
    html = html.replace(/\n?\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/swiper@11\/swiper-bundle\.min\.css"\/>\s*\n?/i, '\n');
    html = html.replace(/\n?\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/swiper@11\/swiper-bundle\.min\.js"><\/script>\s*\n?/i, '\n');
    html = html.replace(/\n?\s*<script src="js\/swiper\.js"><\/script>\s*\n?/i, '\n');
  }

  return html;
}

const VA_ASSET_PREFIXES = /^(?:css|js|img|data|pdf)\//;

// La variante /va/ vive en un subdirectorio pero comparte los assets de la
// raíz (dist/va/ solo contiene HTML): las URLs de assets se reescriben con
// `../` para que suban un nivel. Se usa `../` y NO rutas absolutas `/...`
// para que el sitio funcione también servido desde un subdirectorio
// (p. ej. Live Server sirviendo la raíz del repo con la web en /dist/).
// Los enlaces entre páginas (lafalla.html, etc.) se mantienen relativos para
// que la navegación permanezca dentro de /va/.
function rewriteAssetUrlsToRoot(html) {
  html = html.replace(/\b(src|href|poster|data-board-source)="((?:css|js|img|data|pdf)\/[^"]*)"/g, '$1="../$2"');
  html = html.replace(/\b(href)="(manifest\.json[^"]*)"/g, '$1="../$2"');

  html = html.replace(/\bsrcset="([^"]+)"/g, (match, value) => {
    const rewritten = value
      .split(',')
      .map((candidate) => {
        const trimmed = candidate.trim();
        return VA_ASSET_PREFIXES.test(trimmed) ? `../${trimmed}` : trimmed;
      })
      .join(', ');
    return `srcset="${rewritten}"`;
  });

  return html;
}

function stripLegacyDynamicEventSchema(html) {
  return html.replace(/\n?\s*<!-- Schema\.org Eventos Dinámicos -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '\n');
}

function isManagedBoardEventNode(node) {
  if (!node || node['@type'] !== 'Event') {
    return false;
  }

  const nodeId = typeof node['@id'] === 'string' ? node['@id'] : '';
  const nodeUrl = typeof node.url === 'string' ? node.url : '';
  const startDate = typeof node.startDate === 'string' ? node.startDate : '';
  const organizerName = node.organizer && typeof node.organizer === 'object'
    ? node.organizer.name
    : '';
  const locationName = node.location && typeof node.location === 'object'
    ? node.location.name
    : '';

  return nodeId.startsWith(`${EVENT_BASE_URL}#`)
    || nodeUrl === EVENT_BASE_URL
    || startDate.includes('0000-00-00T')
    || (!organizerName && locationName === "Falla Suïssa - L'Alqueria del Favero");
}

// ---------------------------------------------------------------------------
// JSON-LD inyectado por el build (v4.28.0)
// ---------------------------------------------------------------------------
// Única fuente de los nodos Organization y WebSite: src/seo/schema-organization.json.
// processJsonLd() lee el PRIMER <script type="application/ld+json"> de cada
// página, descarta cualquier Organization/WebSite propios escritos inline,
// completa el nodo de página (name/description desde <title>/<meta>, breadcrumb,
// primaryImageOfPage), rellena las galerías (ImageObject por foto de
// dataPagesN.json), la lista de galerías, fusiona los Event del tablón y, en la
// variante /va/, reescribe las URL de página a /va/ e inLanguage a ca-ES.
// Siempre deja UN solo <script ld+json> por página (tests/hope-seo lo exige).
// Kill switch: DISABLE_SCHEMA_INJECT=1 deja los bloques inline tal cual.
// Ver docs/structured-data.md.
const SITE_ORIGIN = 'https://fallasuissa.es';
const ORG_ID = `${SITE_ORIGIN}/#organization`;
const SITE_ID = `${SITE_ORIGIN}/#website`;
const GLOBAL_IDS = new Set([ORG_ID, SITE_ID, `${SITE_ORIGIN}/#place`, `${SITE_ORIGIN}/#logo`]);
const PAGE_TYPES = new Set(['WebPage', 'CollectionPage', 'AboutPage', 'ImageGallery', 'ItemPage', 'ContactPage', 'ProfilePage', 'MediaGallery']);
const SCHEMA_ASSET_RE = /^https:\/\/fallasuissa\.es\/(?:img|pdf|data|seo|js|css|\.well-known)\//;
const SCHEMA_SCRIPT_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;
// Padre de cada página en el breadcrumb (clave de nav.* del padre, o null = solo Inicio)
const BREADCRUMB_PARENT = {
  'galeria_': { file: 'galerias.html', nav: 'galeria' },
  'blog-': { file: 'blog.html', nav: 'blog' },
  'autorizacion-': { file: 'nuevos-falleros.html', nav: 'nuevosFalleros' },
  'organigrama.html': { file: 'lafalla.html', nav: 'lafalla' }
};
// Nombre de página en el breadcrumb: clave nav.* cuando existe
const BREADCRUMB_NAV_KEY = {
  'lafalla.html': 'lafalla', 'ofrenda.html': 'ofrenda', 'eventos.html': 'eventos', 'deportes.html': 'deportes',
  'blog.html': 'blog', 'meteo.html': 'meteo', 'galerias.html': 'galeria', 'colaboraciones.html': 'colaboraciones',
  'nuevos-falleros.html': 'nuevosFalleros'
};

let baseSchemaCache = null;
async function loadBaseSchema() {
  if (baseSchemaCache) return baseSchemaCache;
  const raw = JSON.parse(await fs.readFile(path.join(__dirname, 'src', 'seo', 'schema-organization.json'), 'utf8'));
  const org = raw.organization;
  const site = raw.website;
  const fallo = (msg) => { throw new Error(`[schema] src/seo/schema-organization.json inválido: ${msg}`); };
  if (!org || org['@id'] !== ORG_ID) fallo(`organization.@id debe ser ${ORG_ID}`);
  if (!site || site['@id'] !== SITE_ID) fallo(`website.@id debe ser ${SITE_ID}`);
  if (org.name !== "Falla Suïssa - L'Alqueria del Favero") fallo('organization.name no es el canónico');
  if (!Array.isArray(org.sameAs) || org.sameAs.length !== 3) fallo('organization.sameAs debe tener 3 redes');
  if (!Array.isArray(org.member) || !org.member.some((m) => m.name === 'José Santos Quilis')) fallo('organization.member debe incluir al Presidente');
  baseSchemaCache = { organization: org, website: site };
  return baseSchemaCache;
}

// Fotos de cada galería (dataPagesN.json) para los ImageObject
async function loadGalleryImages() {
  const files = await glob('src/data/dataPages*.json');
  const map = new Map();
  for (const f of files) {
    const m = path.basename(f).match(/^dataPages(\d+)\.json$/);
    if (!m) continue;
    const data = JSON.parse(await fs.readFile(f, 'utf8'));
    // Solo entradas con imagen real (galeria_3 tiene una página de cierre sin src)
    const fotos = (Array.isArray(data) ? data : []).filter((p) => p && typeof p.src === 'string' && /^img\//.test(p.src));
    const withRaster = [];
    for (const p of fotos) {
      // contentUrl al raster original (jpg/jpeg/png) si existe en src/img; si no, el src del JSON
      const sinExt = p.src.replace(/\.[a-z0-9]+$/i, '');
      let contentPath = p.src;
      for (const ext of ['.jpg', '.jpeg', '.png']) {
        try { await fs.access(path.join(__dirname, 'src', `${sinExt}${ext}`)); contentPath = `${sinExt}${ext}`; break; } catch (_) { /* siguiente */ }
      }
      withRaster.push({ src: contentPath, alt: typeof p.alt === 'string' ? p.alt : '' });
    }
    map.set(Number(m[1]), withRaster);
  }
  return map;
}

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function readHeadMeta(html) {
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1].trim();
  const description = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [, ''])[1].trim();
  // og:image se conserva con su ?v= (regla: og-share.png siempre con cache-buster por WhatsApp)
  const ogImage = (html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i) || [, ''])[1].trim();
  return { title: decodeHtmlEntities(title), description: decodeHtmlEntities(description), ogImage };
}

function hasType(node, type) {
  if (!node || typeof node !== 'object') return false;
  const t = node['@type'];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

function isOwnOrgNode(node) {
  if (!hasType(node, 'Organization')) return false;
  const id = typeof node['@id'] === 'string' ? node['@id'] : '';
  const url = typeof node.url === 'string' ? node.url : '';
  return id === ORG_ID || id === '#organizacion' || /^https:\/\/fallasuissa\.es\/?$/.test(url) || /^Falla Su[iï]ssa/i.test(node.name || '');
}

function isOwnSiteNode(node) {
  if (!hasType(node, 'WebSite')) return false;
  const ref = `${node['@id'] || ''} ${node.url || ''}`;
  return !/hope-incliva/.test(ref);
}

function extractFirstJsonLd(html, fileName) {
  const match = html.match(SCHEMA_SCRIPT_RE);
  if (!match) return { found: false, nodes: [] };
  let data;
  try {
    data = JSON.parse(match[1].trim());
  } catch (error) {
    throw new Error(`[schema] ${fileName}: el bloque ld+json del fuente no es JSON válido (${error.message})`);
  }
  let nodes;
  if (Array.isArray(data)) nodes = data;
  else if (Array.isArray(data['@graph'])) nodes = data['@graph'];
  else nodes = [data];
  nodes = nodes.map(({ ['@context']: _context, ...node }) => node);
  return { found: true, nodes };
}

// Idempotencia: los Organization/WebSite propios inline se descartan y las
// referencias anidadas (publisher, isPartOf, organizer…) pasan a { "@id" }.
function normalizeGraph(nodes, fileName) {
  const kept = nodes.filter((node) => {
    if (isOwnOrgNode(node) || isOwnSiteNode(node)) {
      console.warn(`[schema] ${fileName}: nodo ${node['@type']} inline descartado (lo inyecta el build desde src/seo/schema-organization.json)`);
      return false;
    }
    return true;
  });
  const walk = (value) => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      if (isOwnOrgNode(value)) return { '@id': ORG_ID };
      if (isOwnSiteNode(value)) return { '@id': SITE_ID };
      if (value['@id'] === '#organizacion' && Object.keys(value).length === 1) return { '@id': ORG_ID };
      const out = {};
      for (const key of Object.keys(value)) out[key] = walk(value[key]);
      return out;
    }
    return value;
  };
  return kept.map(walk);
}

function ensurePageNode(nodes, meta) {
  const pageId = `${meta.mainUrl}#webpage`;
  let page = nodes.find((node) => [...PAGE_TYPES].some((t) => hasType(node, t))
    && (node['@id'] === pageId || node['@id'] === meta.mainUrl || node.url === meta.mainUrl));
  if (!page) {
    page = { '@type': 'WebPage' };
    nodes.unshift(page);
  }
  page['@id'] = pageId;
  page.url = meta.mainUrl;
  if (!page.name && meta.title) page.name = meta.title;
  if (!page.description && meta.description) page.description = meta.description;
  if (!page.inLanguage) page.inLanguage = 'es-ES';
  page.isPartOf = { '@id': SITE_ID };
  if (!page.primaryImageOfPage && meta.ogImage) {
    page.primaryImageOfPage = { '@type': 'ImageObject', url: meta.ogImage };
  }
  return page;
}

function breadcrumbPageName(fileName, page, table) {
  const navKey = BREADCRUMB_NAV_KEY[fileName];
  if (navKey && table && table.nav && table.nav[navKey]) return table.nav[navKey];
  const gal = fileName.match(/^galeria_(\d+)\.html$/);
  if (gal && table && table.galeria && table.galeria[`galeria${gal[1]}`]) return table.galeria[`galeria${gal[1]}`];
  const post = fileName.match(/^blog-([a-z0-9-]+)\.html$/);
  if (post && table && table.blog && table.blog[post[1]] && table.blog[post[1]].cardTitle) return table.blog[post[1]].cardTitle;
  // Sin clave i18n: el título de la página sin el sufijo de la organización
  return String(page.name || fileName)
    .replace(/^Falla Su[iï]ssa\s*-\s*L'Alqueria del Favero\s*[-|]\s*/i, '')
    .replace(/\s*[|—-]\s*Falla Su[iï]ssa[^|]*$/i, '')
    .trim() || fileName;
}

function buildBreadcrumb(fileName, mainUrl, page, table, lang) {
  const base = lang === 'ca' ? `${SITE_ORIGIN}/va/` : `${SITE_ORIGIN}/`;
  const items = [{ name: (table && table.nav && table.nav.inicio) || 'Inicio', item: base }];
  const parentKey = Object.keys(BREADCRUMB_PARENT).find((prefix) => fileName.startsWith(prefix));
  if (parentKey) {
    const parent = BREADCRUMB_PARENT[parentKey];
    items.push({ name: (table && table.nav && table.nav[parent.nav]) || parent.nav, item: `${base}${parent.file}` });
  }
  items.push({ name: breadcrumbPageName(fileName, page, table), item: lang === 'ca' ? mainUrl.replace(`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/va/`) : mainUrl });
  return {
    '@type': 'BreadcrumbList',
    '@id': `${mainUrl}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item }))
  };
}

function fillImageGallery(nodes, fileName, mainUrl, galleryImages) {
  const m = fileName.match(/^galeria_(\d+)\.html$/);
  if (!m) return;
  const gallery = nodes.find((node) => hasType(node, 'ImageGallery'));
  const fotos = galleryImages.get(Number(m[1])) || [];
  if (!gallery) {
    console.warn(`[schema] ${fileName}: sin nodo ImageGallery en el bloque inline`);
    return;
  }
  gallery.associatedMedia = fotos.map((foto, i) => ({
    '@type': 'ImageObject',
    '@id': `${mainUrl}#img-${String(i + 1).padStart(3, '0')}`,
    contentUrl: `${SITE_ORIGIN}/${foto.src}`,
    url: `${SITE_ORIGIN}/${foto.src}`,
    name: foto.alt,
    caption: foto.alt,
    representativeOfPage: i === 0,
    creditText: "Falla Suïssa - L'Alqueria del Favero",
    copyrightHolder: { '@id': ORG_ID }
  }));
  if (fotos.length) gallery.primaryImageOfPage = { '@id': `${mainUrl}#img-001` };
}

function fillGaleriasList(nodes, mainUrl, galerias, table, esTable) {
  const list = nodes.find((node) => hasType(node, 'ItemList'));
  if (!list) return;
  const base = mainUrl.replace(/galerias\.html$/, '');
  list.itemListElement = galerias.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: (table && table.galeria && table.galeria[`galeria${g.n}`]) || nombreGaleria(esTable, g.n),
    url: `${base}${g.file}`
  }));
  list.numberOfItems = galerias.length;
}

function mergeEventNodes(nodes, schemaEvents, managedEventFilter) {
  let graphNodes = nodes;
  if (typeof managedEventFilter === 'function') {
    graphNodes = graphNodes.filter((node) => !managedEventFilter(node));
  }
  const events = (schemaEvents || []).map((event) => {
    const { ['@context']: _context, ...eventNode } = event;
    return eventNode;
  });
  return [...graphNodes, ...events];
}

// Variante /va/: URL de página a /va/ e inLanguage ca-ES. Los @id globales
// (#organization, #website, #place, #logo), los assets y los nodos externos
// (hope-incliva.com) no cambian: son la misma entidad en ambos idiomas.
function localizeGraph(nodes, lang) {
  if (lang !== 'ca') return nodes;
  const rewriteUrl = (value) => {
    if (typeof value !== 'string' || !value.startsWith(`${SITE_ORIGIN}/`)) return value;
    if (GLOBAL_IDS.has(value) || SCHEMA_ASSET_RE.test(value) || value.startsWith(`${SITE_ORIGIN}/va/`)) return value;
    return value.replace(`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/va/`);
  };
  const walk = (value) => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const ref = `${value['@id'] || ''} ${value.url || ''}`;
      if (/hope-incliva\.com/.test(ref)) return value;
      const out = {};
      for (const key of Object.keys(value)) {
        const v = value[key];
        if ((key === '@id' || key === 'url' || key === 'item' || key === 'mainEntityOfPage') && typeof v === 'string') out[key] = rewriteUrl(v);
        else if (key === 'inLanguage' && (v === 'es-ES' || v === 'es')) out[key] = 'ca-ES';
        else out[key] = walk(v);
      }
      return out;
    }
    return value;
  };
  return nodes.map(walk);
}

function collectIds(value, acc) {
  if (Array.isArray(value)) value.forEach((v) => collectIds(v, acc));
  else if (value && typeof value === 'object') {
    if (typeof value['@id'] === 'string' && Object.keys(value).length > 1) acc.push(value['@id']);
    Object.values(value).forEach((v) => collectIds(v, acc));
  }
  return acc;
}

function assertUniqueIds(graph, fileName) {
  const ids = collectIds(graph, []);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) console.warn(`[schema] ${fileName}: @id duplicado ${id}`);
    seen.add(id);
  }
}

function toJsonLdScript(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script type="application/ld+json">\n  ${json.replace(/\n/g, '\n  ')}\n  </script>`;
}

function processJsonLd(html, ctx) {
  const { fileName, lang, mainUrl, base, schemaEvents, galleryImages, galerias, langTable, esTable } = ctx;
  const table = lang === 'ca' && langTable ? langTable : esTable;
  const meta = readHeadMeta(html);
  const { found, nodes: rawNodes } = extractFirstJsonLd(html, fileName);
  let nodes = normalizeGraph(rawNodes, fileName);
  const page = ensurePageNode(nodes, { ...meta, mainUrl });
  if (fileName !== 'index.html') {
    const breadcrumb = buildBreadcrumb(fileName, mainUrl, page, table, lang);
    page.breadcrumb = { '@id': breadcrumb['@id'] };
    nodes.push(breadcrumb);
  }
  fillImageGallery(nodes, fileName, mainUrl, galleryImages);
  if (fileName === 'galerias.html') fillGaleriasList(nodes, mainUrl, galerias, table, esTable);
  if (fileName === 'index.html' || fileName === 'eventos.html') {
    nodes = mergeEventNodes(nodes, schemaEvents, fileName === 'index.html' ? isManagedBoardEventNode : null);
  }
  nodes = localizeGraph(nodes, lang);
  const graph = [structuredClone(base.organization), structuredClone(base.website), ...nodes];
  assertUniqueIds(graph, fileName);
  const script = toJsonLdScript(graph);
  if (found) return { html: html.replace(SCHEMA_SCRIPT_RE, () => script), script: null };
  return { html, script };
}

async function getAssetVersionToken() {
  const cssFiles = await glob('dist/css/**/*.css', { nodir: true });
  const jsFiles = await glob('dist/js/**/*.js', { nodir: true });
  const assetFiles = [...cssFiles, ...jsFiles].sort();

  if (!assetFiles.length) {
    return null;
  }

  const hash = crypto.createHash('sha1');

  for (const assetFile of assetFiles) {
    const assetContents = await fs.readFile(assetFile);
    hash.update(path.relative('dist', assetFile).split(path.sep).join('/'));
    hash.update(':');
    hash.update(assetContents);
    hash.update('|');
  }

  return hash.digest('hex').slice(0, 12);
}

function isVersionableLocalAssetUrl(url) {
  if (!url || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('#')) {
    return false;
  }

  const pathname = url.split('#')[0].split('?')[0];
  return /(?:^|\/)(?:css|js)\/.+\.(?:css|js)$/i.test(pathname);
}

function appendAssetVersionToUrl(url, assetVersion) {
  if (!assetVersion || !isVersionableLocalAssetUrl(url)) {
    return url;
  }

  const [withoutHash, hash = ''] = url.split('#');
  const [pathname, search = ''] = withoutHash.split('?');
  const params = new URLSearchParams(search);
  params.set('v', assetVersion);

  const queryString = params.toString();
  return `${pathname}${queryString ? `?${queryString}` : ''}${hash ? `#${hash}` : ''}`;
}

function appendAssetVersionToHtml(html, assetVersion) {
  if (!assetVersion) {
    return html;
  }

  return html.replace(/\b(href|src)=(['"])([^'"]+)\2/g, (match, attr, quote, url) => {
    const versionedUrl = appendAssetVersionToUrl(url, assetVersion);
    return versionedUrl === url ? match : `${attr}=${quote}${versionedUrl}${quote}`;
  });
}

async function getSchemaEvents() {
  try {
    const rawData = await fs.readFile(path.join(__dirname, 'src', 'data', 'board.json'), 'utf8');
    const board = JSON.parse(rawData);
    const events = [];

    function stripHtml(html) {
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
    }

    function isValidBoardDateParts(day, month, year) {
      const numericDay = Number(day);
      const numericMonth = Number(month);
      const numericYear = Number(year);

      if (!Number.isInteger(numericDay) || !Number.isInteger(numericMonth) || !Number.isInteger(numericYear)) {
        return false;
      }

      if (numericDay <= 0 || numericMonth <= 0 || numericYear <= 0) {
        return false;
      }

      const candidate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
      return candidate.getUTCFullYear() === numericYear
        && candidate.getUTCMonth() === numericMonth - 1
        && candidate.getUTCDate() === numericDay;
    }

    function buildIsoLocalDateTime(day, month, year, time) {
      if (!isValidBoardDateParts(day, month, year)) {
        return null;
      }

      const [hours = '00', minutes = '00'] = (time || '00:00').split(':');
      const numericHours = Number(hours);
      const numericMinutes = Number(minutes);

      if (
        !Number.isInteger(numericHours)
        || !Number.isInteger(numericMinutes)
        || numericHours < 0
        || numericHours > 23
        || numericMinutes < 0
        || numericMinutes > 59
      ) {
        return null;
      }

      return `${year}-${month}-${day}T${String(numericHours).padStart(2, '0')}:${String(numericMinutes).padStart(2, '0')}:00`;
    }

    function extractEventName(text) {
      const nameMatch = text.match(/<br>\s*📝[^<]+<br>\s*(.+?)(?:<br>|$)/);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1].replace(/<[^>]+>/g, '').trim();
      }

      const parts = text.split('<br>');
      if (parts.length > 0) {
        return parts[parts.length - 1].replace(/<[^>]+>/g, '').trim();
      }

      return 'Evento Falla Suïssa';
    }

    function extractEventDescription(text, eventName) {
      const plainText = stripHtml(text)
        .replace(/^📌\s*(?:RECORDATORIO|RECORDATORI)\s*/i, '')
        .replace(/^\d{2}-\d{2}-\d{4}(?:\s+\d{2}:\d{2}\s*h?)?\s*/i, '')
        .replace(/^📝\s*(?:Cita|Recordatori|Recordatorio)\s*/i, '')
        .trim();

      if (!plainText) {
        return `Evento de Falla Suïssa - L'Alqueria del Favero: ${eventName}.`;
      }

      return `Evento de Falla Suïssa - L'Alqueria del Favero. ${plainText}`;
    }
    
    board.notas.forEach(nota => {
      if (!nota.activo || !nota.contenido || !nota.contenido.es) return;
      
      const text = nota.contenido.es;
      
      // Intentar extraer fecha (dd-mm-rrrr) y hora (hh:mm)
      const dateRegex = /(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}:\d{2}))?/;
      const matchDate = text.match(dateRegex);

      if (!matchDate) {
        return;
      }

      const [ , day, month, year, time ] = matchDate;
      const startDate = buildIsoLocalDateTime(day, month, year, time);
      if (!startDate) {
        console.warn(`Se omite la nota ${nota.id || '(sin id)'} del Schema Event por fecha inválida.`);
        return;
      }

      const eventName = extractEventName(text);
      const eventDescription = extractEventDescription(text, eventName);
      const eventId = nota.id
        ? `${EVENT_BASE_URL}#${nota.id}`
        : `${EVENT_BASE_URL}#${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'evento'}`;

      events.push({
        "@context": "https://schema.org",
        "@type": "Event",
        "@id": eventId,
        "name": eventName,
        "startDate": startDate,
        "endDate": startDate,
        "description": eventDescription,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "organizer": {
          "@type": "Organization",
          "name": "Falla Suïssa - L'Alqueria del Favero",
          "url": "https://fallasuissa.es/",
          "logo": EVENT_IMAGE_URL
        },
        "location": {
          "@type": "Place",
          "name": "Falla Suïssa - L'Alqueria del Favero",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Valencia",
            "addressRegion": "Comunidad Valenciana",
            "addressCountry": "ES"
          }
        },
        "offers": {
          "@type": "Offer",
          "url": EVENT_BASE_URL,
          "price": "0",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "validFrom": "2024-01-01T00:00:00"
        },
        "image": [EVENT_IMAGE_URL],
        "url": EVENT_BASE_URL
      });
    });
    
    return events;
  } catch(e) {
    console.warn('Error procesando board.json Schema:', e);
    return [];
  }
}

// ===================================
// I18n PRE-RENDER (v4.6.23)
// ===================================
// Sustituye contenido y atributos data-i18n* en HTML por el valor de
// translations.<lang> antes de servir dist/va/*.html. Mantiene los
// atributos data-i18n* en el HTML para que el toggle ES/VA en runtime
// (js/lang.js) siga funcionando. Solo actúa cuando langTable != null.

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function prerenderParagraphs(text) {
  return String(text)
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block)}</p>`)
    .join('');
}

function getNestedKey(obj, dottedKey) {
  if (!obj || typeof dottedKey !== 'string') return undefined;
  return dottedKey.split('.').reduce(
    (acc, key) => (acc && typeof acc === 'object' && key in acc) ? acc[key] : undefined,
    obj
  );
}

function trackMissingKey(tracker, key, fileName) {
  if (!tracker) return;
  const id = `${key}@${fileName}`;
  if (tracker.has(id)) return;
  tracker.add(id);
  console.warn(`[i18n-prerender] missing key: ${key} @ ${fileName}`);
}

function prerenderTranslations(html, langTable, fileName, missingKeyTracker) {
  if (!langTable) return html;

  // 1. Pasada de contenido: data-i18n
  const contentRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?\bdata-i18n="([^"]+)"[^>]*?)>([\s\S]*?)<\/\1>/g;

  html = html.replace(contentRegex, (match, tag, attrs, key, content) => {
    // Skip elementos dinámicos (los rellena JS en runtime)
    if (/\bdata-i18n-dynamic\b/.test(attrs)) return match;
    // Skip si el contenido tiene tags hijos (no es hoja) — preserva estructura compleja
    if (/<[a-zA-Z]/.test(content)) return match;

    const translation = getNestedKey(langTable, key);
    if (typeof translation !== 'string') {
      trackMissingKey(missingKeyTracker, key, fileName);
      return match;
    }

    let newContent;
    const formatMatch = attrs.match(/\bdata-i18n-format="([^"]*)"/);
    const isParagraphs = formatMatch && formatMatch[1] === 'paragraphs';
    const isBoardNote = /\bclass="[^"]*\bboard__note-content\b[^"]*"/.test(attrs);

    if (isParagraphs) {
      newContent = prerenderParagraphs(translation);
    } else if (isBoardNote) {
      // Permite HTML literal (ej. <br> en notas del tablón)
      newContent = translation;
    } else {
      newContent = escapeHtml(translation);
    }

    return `<${tag}${attrs}>${newContent}</${tag}>`;
  });

  // 2-5. Pasadas de atributos: aria-label, placeholder, alt, title
  const attrMappings = [
    ['data-i18n-aria-label', 'aria-label'],
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-alt', 'alt'],
    ['data-i18n-title', 'title']
  ];

  for (const [sourceAttr, destAttr] of attrMappings) {
    const attrRegex = new RegExp(
      `<([a-zA-Z][a-zA-Z0-9]*)\\b([^>]*?\\b${sourceAttr}="([^"]+)"[^>]*?)>`,
      'g'
    );

    html = html.replace(attrRegex, (match, tag, attrs, key) => {
      const translation = getNestedKey(langTable, key);
      if (typeof translation !== 'string') {
        trackMissingKey(missingKeyTracker, key, fileName);
        return match;
      }

      // Eliminar el atributo destino si ya estuviera presente (sustituir)
      const stripDestAttr = new RegExp(`\\s+${destAttr}="[^"]*"`, 'g');
      let cleanedAttrs = attrs.replace(stripDestAttr, '');

      // Detectar self-closing (<tag ... />)
      const trailingSlashMatch = cleanedAttrs.match(/\s*\/\s*$/);
      const isSelfClose = Boolean(trailingSlashMatch);
      if (isSelfClose) {
        cleanedAttrs = cleanedAttrs.replace(/\s*\/\s*$/, '');
      }

      return `<${tag}${cleanedAttrs} ${destAttr}="${escapeAttr(translation)}"${isSelfClose ? ' />' : '>'}`;
    });
  }

  return html;
}

// ---------------------------------------------------------------------------
// Paginación entre galerías (v4.26.0). Se genera en el build a partir de las
// galerías existentes (src/galeria_N.html) y de los nombres de translations.json
// (galeria.galeriaN, ES como texto de reserva; el pre-render VA rellena los
// data-i18n* después). Cada galeria_N.html lleva el marcador
// <!-- galeria-pager --> justo bajo el bloc; NO se escribe la paginación a mano.
// Enlaces relativos (galeria_N.html) para que desde /va/ se siga en /va/.
// Sin bucle: en los extremos la vecina inexistente es un <span aria-disabled>.
// ---------------------------------------------------------------------------
async function listGalerias() {
  const files = await glob('src/galeria_*.html');
  return files
    .map((f) => {
      const m = path.basename(f).match(/^galeria_(\d+)\.html$/);
      return m ? { n: Number(m[1]), file: path.basename(f) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.n - b.n);
}

function nombreGaleria(esTable, n) {
  const g = esTable && esTable.galeria;
  return (g && g[`galeria${n}`]) || `Galería ${n}`;
}

function buildGaleriaPager(n, galerias, esTable) {
  const idx = galerias.findIndex((g) => g.n === n);
  if (idx === -1) return '';
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const prev = galerias[idx - 1];
  const next = galerias[idx + 1];

  const vecina = (g, tipo) => {
    // tipo: 'anterior' | 'siguiente'
    if (!g) {
      const clave = tipo === 'anterior' ? 'sinAnterior' : 'sinSiguiente';
      const texto = tipo === 'anterior' ? 'No hay galería anterior' : 'No hay galería siguiente';
      return `    <span class="galeria-pager__vecina galeria-pager__vecina--${tipo}" aria-disabled="true">
      <span class="visually-hidden" data-i18n="galeriasPager.${clave}">${texto}</span>
    </span>`;
    }
    const rel = tipo === 'anterior' ? 'prev' : 'next';
    const etiqueta = tipo === 'anterior' ? 'Galería anterior:' : 'Galería siguiente:';
    return `    <a class="galeria-pager__vecina galeria-pager__vecina--${tipo}" href="${g.file}" rel="${rel}">
      <span class="visually-hidden" data-i18n="galeriasPager.${tipo}">${etiqueta}</span>
      <span class="galeria-pager__nombre" data-i18n="galeria.galeria${g.n}">${esc(nombreGaleria(esTable, g.n))}</span>
    </a>`;
  };

  const numeros = galerias.map((g) => {
    const nombre = esc(nombreGaleria(esTable, g.n));
    const actual = g.n === n ? ' aria-current="page"' : '';
    return `      <li><a class="galeria-pager__numero" href="${g.file}"${actual} aria-label="${nombre}" data-i18n-aria-label="galeria.galeria${g.n}" title="${nombre}" data-i18n-title="galeria.galeria${g.n}">${g.n}</a></li>`;
  }).join('\n');

  return `  <!-- Paginación entre galerías: generada por el build (gulpfile.js → buildGaleriaPager) -->
  <nav class="galeria-pager" aria-label="Navegación entre galerías" data-i18n-aria-label="galeriasPager.aria">
${vecina(prev, 'anterior')}
    <ol class="galeria-pager__lista">
${numeros}
    </ol>
${vecina(next, 'siguiente')}
    <a class="boton galeria-pager__todas" href="galerias.html" data-i18n="galeriasPager.todas">Todas las galerías</a>
  </nav>`;
}

function injectGaleriaPager(html, fileName, galerias, esTable) {
  const m = fileName.match(/^galeria_(\d+)\.html$/);
  if (!m || !galerias) return html;
  const marcador = '<!-- galeria-pager -->';
  if (!html.includes(marcador)) {
    console.warn(`[galeria-pager] sin marcador ${marcador} en ${fileName}: la página queda sin paginación`);
    return html;
  }
  return html.replace(marcador, buildGaleriaPager(Number(m[1]), galerias, esTable));
}

function modifyHtmlStream(schemaCtx, lang, assetVersion, langTable, missingKeyTracker, pagerCtx) {
  return new Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (file.isNull()) return cb(null, file);
      if (file.isStream()) return cb(new Error('Streaming en modifyHtmlStream no soportado'));
      
      let html = file.contents.toString('utf8');
      
      // 1. Reemplazar etiqueta de idioma principal para la variante en valenciano
      if (lang === 'ca') {
        html = html.replace(/<html\s+([^>]*)lang="es"/i, '<html $1lang="ca"');
        html = html.replace(/<html\s+lang="es"(.*)?>/i, '<html lang="ca"$1>');
      }

      // 1a. Paginación entre galerías (antes del pre-render para que /va/
      // salga con los nombres en valenciano horneados).
      if (pagerCtx) {
        html = injectGaleriaPager(html, path.basename(file.path), pagerCtx.galerias, pagerCtx.esTable);
      }

      // 1b. Pre-render de traducciones (solo VA por ahora). El toggle ES/VA
      // en runtime sigue funcionando porque los atributos data-i18n* permanecen.
      if (langTable) {
        html = prerenderTranslations(html, langTable, path.basename(file.path), missingKeyTracker);
      }

      html = stripLegacyDynamicEventSchema(html);
      html = optimizeHtmlAssetTags(html);

      // 1c. Assets a rutas absolutas en la variante /va/ (tras
      // optimizeHtmlAssetTags, cuyas regex esperan rutas relativas).
      if (lang === 'ca') {
        html = rewriteAssetUrlsToRoot(html);
      }

      // 2. Preparar bloque de inyección
      const fileName = path.basename(file.path);
      const isIndex = fileName === 'index.html';
      const mainUrl = `https://fallasuissa.es/${isIndex ? '' : fileName}`;
      const caUrl = `https://fallasuissa.es/va/${isIndex ? '' : fileName}`;
      const canonicalUrl = lang === 'ca' ? caUrl : mainUrl;

      // 1d. Open Graph de la variante /va/: og:url debe coincidir con el canonical
      // de la página servida (antes apuntaba a la versión ES) y og:locale con su idioma.
      if (lang === 'ca') {
        html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, `$1${caUrl}$2`);
        html = html.replace(/(<meta\s+property="og:locale"\s+content=")es_ES(")/i, '$1ca_ES$2');
      }

      // Limpiar canonical y hreflang preexistentes en el source para que el build
      // sea la única fuente de verdad y evitar conflictos (ver GSC: "Duplicada").
      html = html.replace(/[ \t]*<link\s+rel="canonical"[^>]*>\s*\n?/gi, '');
      html = html.replace(/[ \t]*<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\s*\n?/gi, '');

      // 2a. JSON-LD: Organization/WebSite desde la fuente única, nodo de página
      // completado, breadcrumb, galerías, Event del tablón y localización /va/.
      // Va tras el pre-render y rewriteAssetUrlsToRoot (no tocan el JSON) y
      // antes de las inyecciones: si la página no tenía ld+json, el script
      // nuevo se añade junto al canonical.
      let schemaScriptToInject = '';
      if (schemaCtx) {
        const result = processJsonLd(html, {
          ...schemaCtx,
          fileName,
          lang,
          mainUrl,
          langTable,
          esTable: pagerCtx ? pagerCtx.esTable : null,
          galerias: pagerCtx ? pagerCtx.galerias : []
        });
        html = result.html;
        if (result.script) schemaScriptToInject = `\n  <!-- JSON-LD generado por el build (src/seo/schema-organization.json) -->\n  ${result.script}\n`;
      }

      let injections = `
  <!-- SEO multi-idioma (canonical autoreferencial + hreflang bidireccional) -->
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="es" href="${mainUrl}">
  <link rel="alternate" hreflang="ca" href="${caUrl}">
  <link rel="alternate" hreflang="x-default" href="${mainUrl}">\n`;

      injections += schemaScriptToInject;

      // 3. Inyectar justo antes del cierre de head
      html = html.replace('</head>', injections + '</head>');
      html = appendAssetVersionToHtml(html, assetVersion);
      
      file.contents = Buffer.from(html);
      cb(null, file);
    }
  });
}

// HTML - Copia HTML del root, pre-renderiza traducciones VA, inyecta canonical/hreflang + Schema
async function htmlTask() {
  const [events, translationsRaw, assetVersion, baseSchema, galleryImages] = await Promise.all([
    getSchemaEvents(),
    fs.readFile(path.join(__dirname, 'src', 'data', 'translations.json'), 'utf8'),
    getAssetVersionToken(),
    loadBaseSchema(),
    loadGalleryImages()
  ]);

  // Kill switch: DISABLE_SCHEMA_INJECT=1 deja los bloques ld+json inline tal cual.
  const schemaCtx = process.env.DISABLE_SCHEMA_INJECT === '1'
    ? null
    : { base: baseSchema, schemaEvents: events, galleryImages };
  if (!schemaCtx) {
    console.warn('[schema] inyección de JSON-LD desactivada por DISABLE_SCHEMA_INJECT=1');
  }

  let translations;
  try {
    translations = JSON.parse(translationsRaw);
  } catch (e) {
    console.warn('[i18n-prerender] translations.json no se pudo parsear, deshabilitando pre-render:', e.message);
    translations = null;
  }

  // Kill switch: DISABLE_I18N_PRERENDER=1 desactiva el pre-render sin revertir.
  const prerenderDisabled = process.env.DISABLE_I18N_PRERENDER === '1';
  const langTableCa = (!prerenderDisabled && translations && translations.va) ? translations.va : null;
  if (prerenderDisabled) {
    console.warn('[i18n-prerender] desactivado por DISABLE_I18N_PRERENDER=1');
  }

  const missingKeyTracker = new Set();

  // Paginación entre galerías: lista de galerías existentes + nombres ES de reserva
  const pagerCtx = {
    galerias: await listGalerias(),
    esTable: translations && translations.es ? translations.es : null
  };

  // Buffer process (no encoding flag para que cargue bin pero el Transform convierte a utf8 y viceversa)
  const esPromise = streamToPromise(
    src(paths.html.src)
      .pipe(modifyHtmlStream(schemaCtx, 'es', assetVersion, null, null, pagerCtx))
      .pipe(dest(paths.html.dest))
  );

  const caPromise = streamToPromise(
    src(paths.html.src)
      .pipe(modifyHtmlStream(schemaCtx, 'ca', assetVersion, langTableCa, missingKeyTracker, pagerCtx))
      .pipe(dest(path.join(paths.html.dest, 'va')))
  );

  await Promise.all([esPromise, caPromise]);

  if (missingKeyTracker.size > 0) {
    console.warn(`[i18n-prerender] ${missingKeyTracker.size} clave(s) faltante(s) en va — el HTML conserva el texto fuente como fallback`);
  }
}

// Root files - robots/sitemaps/.htaccess/manifest/sw/google-verification/etc
function rootFilesTask() {
  return streamToPromise(src(paths.root.src, { encoding: false, dot: true, allowEmpty: true }).pipe(dest(paths.root.dest)));
}

// SEO folder - Copia carpeta seo/
function seoTask() {
  return streamToPromise(src(paths.seo.src, { encoding: false, allowEmpty: true }).pipe(dest(paths.seo.dest)));
}

// Favicon - Copia
function faviconTask() {
  return streamToPromise(src(paths.favicon.src, { encoding: false, allowEmpty: true }).pipe(dest(paths.favicon.dest)));
}

// =======================================================================
// AGENT-READY: copia /.well-known/ y genera agent-skills/index.json
// (RFC 9727 api-catalog + Agent Skills Discovery v0.2.0)
// Debe ejecutarse DESPUÉS de dataTask, rootFilesTask y seoTask para que
// los archivos referenciados existan en dist/ y se pueda calcular su sha256.
// =======================================================================
async function wellKnownTask() {
  // 1) Copia api-catalog y cualquier otro contenido estático bajo src/.well-known/
  await streamToPromise(
    src(paths.wellKnown.src, { encoding: false, dot: true, allowEmpty: true })
      .pipe(dest(paths.wellKnown.dest))
  );

  // 2) Define las skills (recursos read-only que un agente puede consumir)
  const SITE_BASE = 'https://fallasuissa.es';
  const skills = [
    {
      name: 'falla-discovery',
      type: 'data',
      description: 'Metadata de descubrimiento (idiomas, branding, social, ubicación, categorías) de la Falla Suïssa.',
      url: `${SITE_BASE}/ai-discovery.json`,
      distPath: 'dist/ai-discovery.json',
      contentType: 'application/json'
    },
    {
      name: 'ai-context',
      type: 'document',
      description: 'Guía de contexto en Markdown para asistentes de IA sobre la Falla, las Fallas y el sitio web.',
      url: `${SITE_BASE}/seo/ai-training-data.md`,
      distPath: 'dist/seo/ai-training-data.md',
      contentType: 'text/markdown'
    },
    {
      name: 'events-board',
      type: 'data',
      description: 'Tablón de avisos y citas vigentes (notas con fecha, hora y ubicación) de Falla Suïssa.',
      url: `${SITE_BASE}/data/board.json`,
      distPath: 'dist/data/board.json',
      contentType: 'application/json'
    },
    {
      name: 'sports-board',
      type: 'data',
      description: 'Tablón JCF deportivo: bases y normativas oficiales (pádel, fútbol, vóley, fotografía) del ejercicio 2026-27.',
      url: `${SITE_BASE}/data/sports-board.json`,
      distPath: 'dist/data/sports-board.json',
      contentType: 'application/json'
    },
    {
      name: 'events-list',
      type: 'data',
      description: 'Listado de eventos del ejercicio fallero (presentaciones, mascletàs, ofrenda, etc.).',
      url: `${SITE_BASE}/data/eventos.json`,
      distPath: 'dist/data/eventos.json',
      contentType: 'application/json'
    },
    {
      name: 'calendar-data',
      type: 'data',
      description: 'Datos del calendario anual con marcado de hitos falleros.',
      url: `${SITE_BASE}/data/calendarData.json`,
      distPath: 'dist/data/calendarData.json',
      contentType: 'application/json'
    },
    {
      name: 'structured-data',
      type: 'data',
      description: 'Grafo Schema.org enriquecido de la organización, eventos y contenido cultural.',
      url: `${SITE_BASE}/seo/ai-enhanced-schema.json`,
      distPath: 'dist/seo/ai-enhanced-schema.json',
      contentType: 'application/ld+json'
    }
  ];

  // 3) Calcula sha256 de cada recurso en dist/
  const resolvedSkills = [];
  for (const skill of skills) {
    try {
      const content = await fs.readFile(path.join(__dirname, skill.distPath));
      const sha256 = crypto.createHash('sha256').update(content).digest('hex');
      const { distPath, ...publicSkill } = skill;
      resolvedSkills.push({ ...publicSkill, sha256 });
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        console.warn(`[agent-skills] omitida skill "${skill.name}": ${skill.distPath} no existe todavía.`);
        continue;
      }
      throw err;
    }
  }

  // 4) Escribe el índice
  const index = {
    $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
    version: '0.2.0',
    publisher: {
      name: "Falla Suïssa - L'Alqueria del Favero",
      url: `${SITE_BASE}/`
    },
    updated: formatLocalISODate(new Date()),
    skills: resolvedSkills
  };

  const outPath = path.join(__dirname, 'dist', '.well-known', 'agent-skills', 'index.json');
  await ensureDirForFile(outPath);
  await fs.writeFile(outPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
}

// Images - Copia todo img/ + genera WebP/AVIF (solo png/jpg/jpeg) incremental por mtime
async function imagesTask() {
  // 1) Copiar todos los assets de img/ (incluye svg, gif, ico, webmanifest, webp/avif existentes, etc.)
  await streamToPromise(src(paths.imgAll, { encoding: false, allowEmpty: true }).pipe(dest(paths.imgDest)));

  // 2) Convertir solo raster elegible (sin GIF)
  const rasterFiles = await glob(paths.imgRasterForConvert, { nodir: true });

  for (const file of rasterFiles) {
    const inputMtime = await fileMtimeMs(file);

    // WebP
    const webpOut = outputPathForModernFormat(file, 'webp');
    const webpMtime = await fileMtimeMs(webpOut);
    if (inputMtime > webpMtime) {
      await ensureDirForFile(webpOut);
      await sharp(file).webp({ quality: 70 }).toFile(webpOut);
    }

    // AVIF
    const avifOut = outputPathForModernFormat(file, 'avif');
    const avifMtime = await fileMtimeMs(avifOut);
    if (inputMtime > avifMtime) {
      await ensureDirForFile(avifOut);
      await sharp(file).avif({ quality: 45 }).toFile(avifOut);
    }
  }
}

function formatLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getFileLastmodISODate(filePath, fallbackDate = new Date()) {
  try {
    const stats = await fs.stat(filePath);
    return formatLocalISODate(stats.mtime);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return formatLocalISODate(fallbackDate);
    }
    throw err;
  }
}

function updateLastmodInBlock(block, lastmod) {
  if (/<lastmod>[^<]*<\/lastmod>/.test(block)) {
    return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${lastmod}</lastmod>`);
  }
  // Insertar <lastmod> justo después de <loc>...</loc>
  return block.replace(/(<loc>[^<]*<\/loc>)/, `$1\n    <lastmod>${lastmod}</lastmod>`);
}

async function updateDistSitemapsLastmod() {
  const fallbackDate = new Date();
  const distIndexPath = path.join('dist', 'sitemap-index.xml');

  // 1) Actualizar los sitemaps de URLs (sitemap.xml, sitemap-google.xml y
  //    sitemap-ai-optimized.xml): lastmod por URL según el mtime del HTML en
  //    dist/. Se conserva el formato de fecha de cada archivo (solo fecha o
  //    fecha-hora con zona).
  for (const sitemapFile of ['sitemap.xml', 'sitemap-google.xml', 'sitemap-ai-optimized.xml']) {
    const distSitemapPath = path.join('dist', sitemapFile);
  try {
    const sitemapXml = await fs.readFile(distSitemapPath, 'utf8');
    const usesDateTime = /<lastmod>\d{4}-\d{2}-\d{2}T/.test(sitemapXml);
    const urlBlocks = [];
    let match;
    const urlRegex = /<url>([\s\S]*?)<\/url>/g;

    while ((match = urlRegex.exec(sitemapXml)) !== null) {
      urlBlocks.push({ full: match[0], inner: match[1] });
    }

    let updatedSitemap = sitemapXml;
    for (const { full } of urlBlocks) {
      const locMatch = full.match(/<loc>([^<]+)<\/loc>/);
      if (!locMatch) continue;

      const loc = locMatch[1].trim();
      let distTargetPath;
      try {
        const url = new URL(loc);
        const pathname = url.pathname || '/';

        if (pathname === '/' || pathname === '') {
          distTargetPath = path.join('dist', 'index.html');
        } else if (pathname.endsWith('/')) {
          distTargetPath = path.join('dist', pathname.slice(1), 'index.html');
        } else {
          distTargetPath = path.join('dist', pathname.slice(1));
        }
      } catch {
        continue;
      }

      const lastmodDate = await getFileLastmodISODate(distTargetPath, fallbackDate);
      const lastmod = usesDateTime ? `${lastmodDate}T00:00:00+01:00` : lastmodDate;
      const newBlock = updateLastmodInBlock(full, lastmod);
      if (newBlock !== full) {
        updatedSitemap = updatedSitemap.replace(full, newBlock);
      }
    }

    if (updatedSitemap !== sitemapXml) {
      await fs.writeFile(distSitemapPath, updatedSitemap, 'utf8');
    }
  } catch (err) {
    if (!(err && err.code === 'ENOENT')) {
      throw err;
    }
  }
  }

  // 2) Actualizar dist/sitemap-index.xml: lastmod por sitemap basado en mtime del archivo sitemap en dist/
  try {
    const indexXml = await fs.readFile(distIndexPath, 'utf8');
    const sitemapRegex = /<sitemap>([\s\S]*?)<\/sitemap>/g;
    const sitemapBlocks = [];
    let match;

    while ((match = sitemapRegex.exec(indexXml)) !== null) {
      sitemapBlocks.push({ full: match[0] });
    }

    let updatedIndex = indexXml;
    for (const { full } of sitemapBlocks) {
      const locMatch = full.match(/<loc>([^<]+)<\/loc>/);
      if (!locMatch) continue;

      const loc = locMatch[1].trim();
      let distTargetPath;
      try {
        const url = new URL(loc);
        const pathname = url.pathname || '';
        if (!pathname) continue;
        distTargetPath = path.join('dist', pathname.replace(/^\//, ''));
      } catch {
        continue;
      }

      const lastmod = await getFileLastmodISODate(distTargetPath, fallbackDate);
      const newBlock = updateLastmodInBlock(full, lastmod);
      if (newBlock !== full) {
        updatedIndex = updatedIndex.replace(full, newBlock);
      }
    }

    if (updatedIndex !== indexXml) {
      await fs.writeFile(distIndexPath, updatedIndex, 'utf8');
    }
  } catch (err) {
    if (!(err && err.code === 'ENOENT')) {
      throw err;
    }
  }
}

// Dev - Watch
function devTask(done) {
  watch(paths.scssAll, cssTask);
  watch(paths.js.src, jsTask);
  watch(paths.data.src, dataTask);
  watch(paths.pdf.src, pdfTask);
  watch(paths.imgAll, imagesTask);
  watch(paths.favicon.src, faviconTask);
  watch(paths.html.src, htmlTask);
  watch(paths.root.src, series(rootFilesTask, updateDistSitemapsLastmod));
  watch(paths.seo.src, seoTask);
  watch(paths.wellKnown.src, wellKnownTask);
  done();
}

// Build
const build = series(
  cssTask,
  jsTask,
  dataTask,
  pdfTask,
  imagesTask,
  faviconTask,
  htmlTask,
  rootFilesTask,
  seoTask,
  wellKnownTask,
  updateDistSitemapsLastmod
);

// ===================================
// EXPORTS
// ===================================
exports.css = cssTask;
exports.js = jsTask;
exports.data = dataTask;
exports.pdf = pdfTask;
exports.images = imagesTask;
exports.favicon = faviconTask;
exports.html = htmlTask;
exports.rootFiles = rootFilesTask;
exports.seo = seoTask;
exports.seoDist = seoTask;
exports.wellKnown = wellKnownTask;
exports.updateDistSitemapsLastmod = updateDistSitemapsLastmod;
exports.dev = devTask;
exports.build = build;
exports.default = series(build, devTask);