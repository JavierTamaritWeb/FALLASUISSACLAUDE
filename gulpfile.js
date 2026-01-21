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

// JS - Copia
function jsTask() {
  return streamToPromise(src(paths.js.src, { encoding: false }).pipe(dest(paths.js.dest)));
}

// Data - Copia
function dataTask() {
  return streamToPromise(src(paths.data.src, { encoding: false }).pipe(dest(paths.data.dest)));
}

// PDF - Copia
function pdfTask() {
  return streamToPromise(src(paths.pdf.src, { encoding: false }).pipe(dest(paths.pdf.dest)));
}

// HTML - Copia HTML del root (excluye google*.html para evitar colisiones)
function htmlTask() {
  return streamToPromise(src(paths.html.src, { encoding: false }).pipe(dest(paths.html.dest)));
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