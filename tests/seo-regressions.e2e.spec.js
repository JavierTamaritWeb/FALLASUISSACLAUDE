// Casos reproducidos en docs/auditoria-seo-2026-09-13.md.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const translations = require('../src/data/translations.json');
const get = (table, key) => key.split('.').reduce((value, part) => value?.[part], table);
const norm = value => String(value).replace(/\s+/g, ' ').trim();
const pages = Object.keys(translations.es.seo);

test('las tipografías conservan sus binarios y cargan localmente en valenciano', async ({ page }) => {
  const crypto = require('node:crypto');
  for (const font of require('../src/fonts/manifest.json')) {
    const bytes = fs.readFileSync(path.join(root, 'dist/fonts', font.file));
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(font.sha256);
  }
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/va/blog-anima.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  expect(requests.some(url => /\/fonts\/plus-jakarta-sans.*\.woff2/.test(url))).toBe(true);
  expect(requests.filter(url => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
  await expect(page.locator('link[as="font"]')).toHaveAttribute('href', /^\.\.\/fonts\//);
});

test('la portada no descarga las fotografías de los archivos cerrados', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(requests.filter(url => /monumento-falla-2025-26-real\.(avif|webp|jpeg)/.test(url))).toEqual([]);
  // El deep link de Ofrenda y las suites de Archivos comprueban la apertura.
  const pending = page.locator('.accordion__section:not(.active):not(.accordion__section--visited) > .accordion__content');
  expect(await pending.count()).toBeGreaterThan(0);
  await expect(pending.first()).toHaveCSS('content-visibility', 'hidden');
});

test('el banner aparece aunque Swiper tarde en responder', async ({ browser }) => {
  const page = await browser.newPage({ storageState: { cookies: [], origins: [] }, serviceWorkers: 'block' });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/swiper-bundle.min.js', async route => { await pending; await route.abort(); });
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#banner-subvencion')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#banner-subvencion')).toBeVisible();
  } finally {
    release();
    await page.close();
  }
});

for (const lang of ['es', 'va']) {
  for (const slug of pages) {
    test(`SEO sin JavaScript: ${lang}/${slug}`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      // La respuesta HTML se analiza sin depender de CDN ni descargar fotografías.
      await page.route('**/*', route => route.request().resourceType() === 'document' ? route.continue() : route.abort());
      await page.goto(`/${lang === 'va' ? 'va/' : ''}${slug}.html`);
      await expect(page).toHaveTitle(translations[lang].seo[slug].title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', translations[lang].seo[slug].description);
      expect(await page.locator('.header__escudo[loading="lazy"], .header-inner__escudo[loading="lazy"]').count()).toBe(0);
      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const schemaPage = graph.find(node => node['@id']?.endsWith('#webpage'));
      expect(schemaPage.description).toBe(translations[lang].seo[slug].description);
      for (const node of graph.filter(node => node['@type'] === 'BlogPosting')) {
        expect(node.headline).toBe(translations[lang].blog[slug.replace('blog-', '')].cardTitle);
        expect(node.description).toBe(translations[lang].seo[slug].description);
      }
      for (const node of graph.filter(node => node['@type'] === 'VideoObject')) {
        expect(node.name).toBe(translations[lang].seo[slug].videoName);
        expect(node.description).toBe(translations[lang].seo[slug].videoDescription);
      }
      const textNodes = await page.locator('[data-i18n]:not([data-i18n-dynamic])').evaluateAll(elements => elements.map(element => ({
        key: element.dataset.i18n,
        text: element.dataset.i18nFormat === 'paragraphs' ? [...element.children].map(p => p.textContent).join('\n') : element.textContent,
        tag: element.tagName
      })));
      for (const node of textNodes) {
        const expected = get(translations[lang], node.key);
        if (typeof expected === 'string') expect(norm(node.text), `${node.tag} ${node.key}`).toBe(norm(expected.replace(/<br\s*\/?>/gi, ' ')));
      }
      if (slug === 'blog-anima' || slug === 'blog-somni') {
        expect((await page.locator('.blog-detail__content').allTextContents()).join(' ').length).toBeGreaterThan(1200);
      }
      if (slug === 'blog-anima') await expect(page.locator('.blog-detail__image')).toHaveAttribute('alt', translations[lang].blog.anima.imageAlt);
      await context.close();
    });
  }
}

test('la fotografía editorial y los metadatos cambian de idioma en runtime', async ({ page }) => {
  await page.goto('/blog-anima.html');
  const crest = await page.locator('.footer__escudo').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(crest.height / crest.width).toBeCloseTo(793 / 640, 1);
  await page.waitForFunction(() => Boolean(window.translations));
  await page.evaluate(() => document.querySelector('[data-lang="va"]').click());
  await expect(page).toHaveTitle(translations.va.seo['blog-anima'].title);
  await expect(page.locator('.blog-detail__image')).toHaveAttribute('alt', translations.va.blog.anima.imageAlt);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', translations.va.seo['blog-anima'].description);
});

test('los sitemaps solo anuncian páginas canónicas indexables y todas las fotos de galerías', async ({ page }) => {
  const main = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
  const urls = [...main.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(urls).toHaveLength(pages.length * 2);
  for (const url of urls) {
    const relative = new URL(url).pathname.replace(/^\//, '') || 'index.html';
    const html = fs.readFileSync(path.join(root, 'dist', relative.endsWith('/') ? `${relative}index.html` : relative), 'utf8');
    expect(html).toContain(`<link rel="canonical" href="${url}">`);
    expect(html).not.toMatch(/<meta\s+name="robots"[^>]*content="[^"]*noindex/);
  }
  for (const legacy of ['sitemap-google.xml', 'sitemap-ai-optimized.xml']) expect(fs.readFileSync(path.join(root, 'dist', legacy), 'utf8')).toBe(main);
  const images = fs.readFileSync(path.join(root, 'dist/sitemap-images.xml'), 'utf8');
  await page.setContent('<body></body>');
  const errors = await page.evaluate(value => new DOMParser().parseFromString(value, 'text/xml').querySelectorAll('parsererror').length, images);
  expect(errors).toBe(0);
  for (let n = 1; n <= 9; n++) {
    const html = fs.readFileSync(path.join(root, `dist/galeria_${n}.html`), 'utf8');
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    for (const photo of graph.find(node => node['@type'] === 'ImageGallery').associatedMedia) expect(images).toContain(`<image:loc>${photo.contentUrl}</image:loc>`);
  }
});

test('los derivados pesados conservan transparencia y cumplen presupuesto de imagen', async () => {
  const sharp = require('sharp');
  const variants = require('../src/data/image-variants.json');
  let total = 0;
  for (const variant of variants) {
    const file = path.join(root, 'dist', variant.output);
    const metadata = await sharp(file).metadata();
    expect(metadata.width).toBeLessThanOrEqual(variant.width);
    expect(metadata.hasAlpha).toBe(true);
    expect(fs.statSync(file).size, variant.output).toBeLessThan(180000);
    total += fs.statSync(file).size;
  }
  expect(total).toBeLessThan(400000);
});

test('Ofrenda enlaza el archivo de vídeo que realmente existe', async ({ page }) => {
  await page.goto('/ofrenda.html');
  const link = page.locator('a[data-i18n="ofrenda.archivo"]');
  await expect(link).toHaveAttribute('href', 'lafalla.html#ofrenda-2026-lafalla');
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /Galería de imágenes y vídeo/);
  await link.click();
  await expect(page.locator('#ofrenda-2026-lafalla video')).toBeVisible();
});

test('las galerías mantienen descripciones por fotografía y las traducen a valenciano', async ({ page }) => {
  await page.goto('/galeria_1.html');
  const photos = page.locator('.notepad img');
  await expect(photos).toHaveCount(15);
  await page.waitForFunction(() => Boolean(window.translations));
  expect(new Set(await photos.evaluateAll(images => images.map(image => image.alt))).size).toBe(15);
  await page.evaluate(() => document.querySelector('[data-lang="va"]').click());
  await expect(photos.first()).toHaveAttribute('alt', translations.va.galleryAlts.g1.p1);
});
