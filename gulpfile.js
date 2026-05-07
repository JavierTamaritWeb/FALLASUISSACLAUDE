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
  cssEntry: 'scss/main.scss',
  scssAll: 'scss/**/*.scss',
  js: { src: 'js/**/*.js', dest: 'dist/js' },
  data: { src: 'data/**/*.json', dest: 'dist/data' },
  pdf: { src: 'pdf/**/*.{pdf,html}', dest: 'dist/pdf' },
  imgAll: 'img/**/*',
  imgRasterForConvert: 'img/**/*.{png,jpg,jpeg}',
  imgDest: 'dist/img',
  favicon: { src: 'favicon_io/**/*', dest: 'dist/favicon_io' },
  html: { src: ['*.html', '!google*.html'], dest: 'dist' },
  root: {
    src: [
      'robots.txt',
      'sitemap*.xml',
      '.htaccess',
      'sw.js',
      'manifest.json',
      'ai-discovery.json',
      'ai-info.html',
      'google*.html'
    ],
    dest: 'dist'
  },
  seo: { src: 'seo/**/*', dest: 'dist/seo' }
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
  if (!normalized.startsWith('img/')) return path.join('dist', normalized);
  return path.join('dist', normalized.replace(/^img\//, 'img/'));
}

function outputPathForModernFormat(inputFile, ext) {
  const normalized = inputFile.split(path.sep).join('/');
  const rel = normalized.startsWith('img/') ? normalized.slice('img/'.length) : normalized;
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

function mergeEventSchemaIntoHtml(html, schemaEventsJSON, options = {}) {
  const { managedEventFilter = null } = options;

  const schemaScriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;
  const match = html.match(schemaScriptRegex);

  if (!match) {
    return { html, merged: false };
  }

  try {
    const structuredData = JSON.parse(match[1].trim());
    if (!structuredData || Array.isArray(structuredData) || !Array.isArray(structuredData['@graph'])) {
      return { html, merged: false };
    }

    let graphNodes = structuredData['@graph'];
    let sanitized = false;

    if (typeof managedEventFilter === 'function') {
      const filteredGraphNodes = graphNodes.filter((node) => !managedEventFilter(node));
      sanitized = filteredGraphNodes.length !== graphNodes.length;
      graphNodes = filteredGraphNodes;
    }

    const schemaEvents = schemaEventsJSON && schemaEventsJSON !== '[]'
      ? JSON.parse(schemaEventsJSON).map((event) => {
        const { ['@context']: _context, ...eventNode } = event;
        return eventNode;
      })
      : [];

    if (!sanitized && !schemaEvents.length) {
      return { html, merged: false };
    }

    structuredData['@graph'] = [...graphNodes, ...schemaEvents];

    const mergedScript = `<script type="application/ld+json">\n  ${JSON.stringify(structuredData, null, 2)}\n  </script>`;

    return {
      html: html.replace(schemaScriptRegex, mergedScript),
      merged: true
    };
  } catch (error) {
    console.warn('Error fusionando Schema de eventos en HTML:', error);
    return { html, merged: false };
  }
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
    const rawData = await fs.readFile(path.join(__dirname, 'data', 'board.json'), 'utf8');
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

function modifyHtmlStream(schemaEventsJSON, lang, assetVersion) {
  return new Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (file.isNull()) return cb(null, file);
      if (file.isStream()) return cb(new Error('Streaming en modifyHtmlStream no soportado'));
      
      let html = file.contents.toString('utf8');
      let mergedEventSchema = false;
      
      // 1. Reemplazar etiqueta de idioma principal para la variante en valenciano
      if (lang === 'ca') {
        html = html.replace(/<html\s+([^>]*)lang="es"/i, '<html $1lang="ca"');
        html = html.replace(/<html\s+lang="es"(.*)?>/i, '<html lang="ca"$1>');
      }

      html = stripLegacyDynamicEventSchema(html);
      html = optimizeHtmlAssetTags(html);

      // 2. Preparar bloque de inyección
      const fileName = path.basename(file.path);
      const isIndex = fileName === 'index.html';
      const shouldInjectEventSchema = fileName === 'index.html' || fileName === 'eventos.html';
      const mainUrl = `https://fallasuissa.es/${isIndex ? '' : fileName}`;
      const caUrl = `https://fallasuissa.es/va/${isIndex ? '' : fileName}`;
      const canonicalUrl = lang === 'ca' ? caUrl : mainUrl;

      // Limpiar canonical y hreflang preexistentes en el source para que el build
      // sea la única fuente de verdad y evitar conflictos (ver GSC: "Duplicada").
      html = html.replace(/[ \t]*<link\s+rel="canonical"[^>]*>\s*\n?/gi, '');
      html = html.replace(/[ \t]*<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\s*\n?/gi, '');

      if (shouldInjectEventSchema) {
        const mergeResult = mergeEventSchemaIntoHtml(html, schemaEventsJSON, {
          managedEventFilter: fileName === 'index.html' ? isManagedBoardEventNode : null
        });
        html = mergeResult.html;
        mergedEventSchema = mergeResult.merged;
      }

      let injections = `
  <!-- SEO multi-idioma (canonical autoreferencial + hreflang bidireccional) -->
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="es" href="${mainUrl}">
  <link rel="alternate" hreflang="ca" href="${caUrl}">
  <link rel="alternate" hreflang="x-default" href="${mainUrl}">\n`;

      if (shouldInjectEventSchema && schemaEventsJSON && schemaEventsJSON !== '[]' && !mergedEventSchema) {
         injections += `\n  <!-- Schema.org Eventos Dinámicos -->\n  <script type="application/ld+json">\n  ${schemaEventsJSON}\n  </script>\n`;
      }

      // 3. Inyectar justo antes del cierre de head
      html = html.replace('</head>', injections + '</head>');
      html = appendAssetVersionToHtml(html, assetVersion);
      
      file.contents = Buffer.from(html);
      cb(null, file);
    }
  });
}

// HTML - Copia HTML del root, parsea Hreflang y compila multi-idioma + Schema
async function htmlTask() {
  const events = await getSchemaEvents();
  const schemaString = JSON.stringify(events, null, 2);
  const assetVersion = await getAssetVersionToken();

  // Buffer process (no encoding flag para que cargue bin pero el Transform convierte a utf8 y viceversa)
  const esPromise = streamToPromise(
    src(paths.html.src)
      .pipe(modifyHtmlStream(schemaString, 'es', assetVersion))
      .pipe(dest(paths.html.dest))
  );

  const caPromise = streamToPromise(
    src(paths.html.src)
      .pipe(modifyHtmlStream(schemaString, 'ca', assetVersion))
      .pipe(dest(path.join(paths.html.dest, 'va')))
  );

  return Promise.all([esPromise, caPromise]);
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
  const distSitemapPath = path.join('dist', 'sitemap.xml');
  const distIndexPath = path.join('dist', 'sitemap-index.xml');

  // 1) Actualizar dist/sitemap.xml: lastmod por URL basado en mtime del HTML en dist/
  try {
    const sitemapXml = await fs.readFile(distSitemapPath, 'utf8');
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

      const lastmod = await getFileLastmodISODate(distTargetPath, fallbackDate);
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
exports.updateDistSitemapsLastmod = updateDistSitemapsLastmod;
exports.dev = devTask;
exports.build = build;
exports.default = series(build, devTask);