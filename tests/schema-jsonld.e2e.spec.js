// tests/schema-jsonld.e2e.spec.js
// JSON-LD inyectado por el build (v4.28.0): en TODAS las páginas de dist/ (ES
// y /va/) hay un único <script ld+json> con @graph, los nodos Organization y
// WebSite de src/seo/schema-organization.json, un nodo de página coherente
// con el canonical y sin datos obsoletos. Las galerías llevan un ImageObject
// por foto de dataPagesN.json. Comprobaciones estáticas sobre dist/ más un
// caso en navegador (el JSON debe seguir siendo parseable tras servirse).

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://fallasuissa.es';
const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const NOMBRE = "Falla Suïssa - L'Alqueria del Favero";
const SAME_AS = [
  'https://www.facebook.com/FallaSuissaLalqueriadelFavero',
  'https://www.instagram.com/fallasuissa_lalqueriadelfavero/',
  'https://tiktok.com/@fallasuissaalqueria'
];
const PAGE_TYPES = ['WebPage', 'CollectionPage', 'AboutPage', 'ImageGallery', 'ItemPage', 'ContactPage', 'ProfilePage', 'MediaGallery'];
const EXCLUIDAS = new Set(['ai-info.html', 'mantenimiento.html', 'base.html']);
const PROHIBIDOS = ['Quiles', 'Marta Soriano', '0000-00-00T', 'numberOfEmployees', '"employee"'];
const FB_INVALIDO = "fallasuïssal'alqueriadelfavero";

const fuente = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'seo', 'schema-organization.json'), 'utf8'));
const translations = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'translations.json'), 'utf8'));

const hasType = (n, t) => Boolean(n) && (Array.isArray(n['@type']) ? n['@type'].includes(t) : n['@type'] === t);

function paginas() {
  const es = fs.readdirSync(DIST).filter((f) => f.endsWith('.html') && !EXCLUIDAS.has(f) && !f.startsWith('google'));
  const va = fs.readdirSync(path.join(DIST, 'va')).filter((f) => f.endsWith('.html') && !EXCLUIDAS.has(f) && !f.startsWith('google'));
  return [...es, ...va.map((f) => `va/${f}`)].sort();
}

function leer(rel) {
  const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  return { html, scripts };
}

function collect(value, ids, refs) {
  if (Array.isArray(value)) { value.forEach((v) => collect(v, ids, refs)); return; }
  if (!value || typeof value !== 'object') return;
  const keys = Object.keys(value);
  if (typeof value['@id'] === 'string') (keys.length === 1 ? refs : ids).push(value['@id']);
  keys.forEach((k) => collect(value[k], ids, refs));
}

const PAGINAS = paginas();
expect(PAGINAS.length).toBeGreaterThanOrEqual(60);

test.describe('JSON-LD — todas las páginas (dist/, ES y /va/)', () => {
  for (const rel of PAGINAS) {
    test(`${rel}: un solo ld+json coherente con la fuente y el canonical`, () => {
      const { html, scripts } = leer(rel);
      expect(scripts, 'exactamente un <script ld+json>').toHaveLength(1);
      const data = JSON.parse(scripts[0]);
      expect(data['@context']).toBe('https://schema.org');
      const graph = data['@graph'];
      expect(Array.isArray(graph)).toBeTruthy();

      // Organization y WebSite: los de la fuente, una sola vez
      const orgs = graph.filter((n) => hasType(n, 'Organization') && n['@id'] === ORG_ID);
      expect(orgs).toHaveLength(1);
      const org = orgs[0];
      expect(org.name).toBe(NOMBRE);
      expect(org.alternateName).toBe('Falla Suïssa');
      expect(org.url).toBe(`${ORIGIN}/`);
      expect(org.sameAs).toEqual(SAME_AS);
      expect(org.founder.name).toBe('José Santos Quilis');
      const nombres = org.member.map((m) => m.name);
      expect(nombres).toContain('José Santos Quilis');
      expect(nombres).toContain('Lucía Gutiérrez Martín');
      expect(nombres).toContain('Sofía Gómez Medina');
      expect(nombres).toContain('Diego Gómez Medina');
      expect(nombres).toContain('Delia Caravantes');
      expect(org.employee).toBeUndefined();
      expect(graph.filter((n) => hasType(n, 'WebSite') && n['@id'] === SITE_ID)).toHaveLength(1);
      // Ningún otro Organization/WebSite propio inline
      expect(graph.filter((n) => (hasType(n, 'Organization') || hasType(n, 'WebSite')) && !/hope-incliva/.test(n['@id'] || '') && ![ORG_ID, SITE_ID].includes(n['@id']))).toHaveLength(0);

      // Nodo de página: url = canonical, inLanguage según ruta
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
      const page = graph.find((n) => PAGE_TYPES.some((t) => hasType(n, t)) && String(n['@id']).endsWith('#webpage'));
      expect(page, 'nodo de página #webpage').toBeTruthy();
      expect(page.url).toBe(canonical);
      expect(page['@id']).toBe(`${canonical}#webpage`);
      expect(page.isPartOf).toEqual({ '@id': SITE_ID });
      if (!Array.isArray(page.inLanguage)) {
        expect(page.inLanguage).toBe(rel.startsWith('va/') ? 'ca-ES' : 'es-ES');
      }
      expect(page.name).toBeTruthy();
      expect(page.description).toBeTruthy();
      if (rel.endsWith('index.html')) {
        expect(page.breadcrumb).toBeUndefined();
      } else {
        const bc = graph.find((n) => hasType(n, 'BreadcrumbList'));
        expect(bc['@id']).toBe(page.breadcrumb['@id']);
        expect(bc.itemListElement[0].item).toBe(rel.startsWith('va/') ? `${ORIGIN}/va/` : `${ORIGIN}/`);
        expect(bc.itemListElement.at(-1).item).toBe(canonical);
      }

      // @id únicos y referencias resueltas
      const ids = []; const refs = [];
      collect(graph, ids, refs);
      expect(new Set(ids).size, '@id duplicado').toBe(ids.length);
      const sinResolver = refs.filter((r) => !ids.includes(r) && !r.startsWith('https://hope-incliva.com'));
      expect(sinResolver).toEqual([]);

      // Datos obsoletos / URLs mal formadas
      for (const p of PROHIBIDOS) expect(scripts[0], `contiene "${p}"`).not.toContain(p);
      expect(scripts[0]).not.toMatch(/https?:\/\/[^"]*['ï]/);
      // Fotos con URL absoluta y sin token (og-share.png sí lleva ?v= por la regla del cache-buster de WhatsApp)
      expect(scripts[0]).not.toMatch(/"(?:contentUrl|url|item)":\s*"[^"]*\.\.\//);
      expect(scripts[0]).not.toMatch(/"contentUrl":\s*"[^"]*\?v=/);
      expect(html, 'URL de Facebook inválida en el HTML (footer)').not.toContain(FB_INVALIDO);
    });
  }
});

test.describe('JSON-LD — nodos propios', () => {
  for (const lang of ['', 'va/']) {
    const pref = lang ? `${ORIGIN}/va/` : `${ORIGIN}/`;
    const tabla = lang ? translations.va : translations.es;

    test(`${lang}galeria_N: ImageGallery con un ImageObject por foto`, () => {
      const galerias = fs.readdirSync(DIST).filter((f) => /^galeria_\d+\.html$/.test(f));
      expect(galerias.length).toBeGreaterThanOrEqual(9);
      for (const f of galerias) {
        const n = Number(f.match(/\d+/)[0]);
        // Mismo filtro que el build: solo entradas con imagen (galeria_3 tiene una página de cierre sin src)
        const fotos = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', `dataPages${n}.json`), 'utf8')).filter((p) => /^img\//.test(p.src || ''));
        const graph = JSON.parse(leer(`${lang}${f}`).scripts[0])['@graph'];
        const gal = graph.find((node) => hasType(node, 'ImageGallery'));
        expect(gal, `${f}: ImageGallery`).toBeTruthy();
        expect(gal.name).toBe(translations.es.galeria[`galeria${n}`]);
        expect(gal.associatedMedia).toHaveLength(fotos.length);
        gal.associatedMedia.forEach((img, i) => {
          expect(img['@type']).toBe('ImageObject');
          expect(img.contentUrl).toMatch(new RegExp(`^${ORIGIN}/img/`));
          expect(img.name).toBe(fotos[i].alt);
        });
        expect(gal.primaryImageOfPage).toEqual({ '@id': `${pref}${f}#img-001` });
      }
      const g9 = JSON.parse(leer(`${lang}galeria_9.html`).scripts[0])['@graph'];
      const video = g9.find((node) => hasType(node, 'VideoObject'));
      expect(video.contentUrl).toBe(`${ORIGIN}/img/fallera-mayor-infantil/fmi-2026-27/video/fmi-2026-27.mp4`);
      expect(video.thumbnailUrl).toMatch(/fmi-2026-27-poster\.jpeg$/);
      expect(video.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g9.find((node) => hasType(node, 'ImageGallery')).video).toEqual({ '@id': video['@id'] });
    });

    test(`${lang}galerias.html: ItemList con todas las galerías y nombres del idioma`, () => {
      const graph = JSON.parse(leer(`${lang}galerias.html`).scripts[0])['@graph'];
      const lista = graph.find((node) => hasType(node, 'ItemList'));
      const total = fs.readdirSync(DIST).filter((f) => /^galeria_\d+\.html$/.test(f)).length;
      expect(lista.itemListElement).toHaveLength(total);
      expect(lista.itemListElement[0]).toMatchObject({ position: 1, name: tabla.galeria.galeria1, url: `${pref}galeria_1.html` });
      expect(lista.itemListElement.at(-1).name).toBe(tabla.galeria[`galeria${total}`]);
    });

    test(`${lang}blog: Blog con blogPost y BlogPosting completos`, () => {
      const blog = JSON.parse(leer(`${lang}blog.html`).scripts[0])['@graph'].find((node) => hasType(node, 'Blog'));
      expect(blog.blogPost).toHaveLength(2);
      for (const post of ['blog-somni.html', 'blog-anima.html']) {
        const graph = JSON.parse(leer(`${lang}${post}`).scripts[0])['@graph'];
        const art = graph.find((node) => hasType(node, 'BlogPosting'));
        expect(art['@id']).toBe(`${pref}${post}#article`);
        for (const campo of ['headline', 'description', 'image', 'datePublished', 'dateModified', 'inLanguage', 'articleSection']) {
          expect(art[campo], `${post}: ${campo}`).toBeTruthy();
        }
        expect(art.author.name).toBeTruthy();
        expect(art.publisher).toEqual({ '@id': ORG_ID });
        expect(art.mainEntityOfPage).toEqual({ '@id': `${pref}${post}#webpage` });
        expect(graph.find((node) => hasType(node, 'WebPage')).mainEntity).toEqual({ '@id': art['@id'] });
        expect(blog.blogPost.some((p) => p['@id'] === art['@id'])).toBeTruthy();
      }
    });

    test(`${lang}organigrama, lafalla, mapa, eventos y llibret: entidades principales`, () => {
      const g = (f) => JSON.parse(leer(`${lang}${f}`).scripts[0])['@graph'];
      expect(g('organigrama.html').find((n) => hasType(n, 'AboutPage')).mainEntity).toEqual({ '@id': ORG_ID });
      const lafalla = g('lafalla.html');
      expect(lafalla.find((n) => hasType(n, 'AboutPage')).mainEntity).toEqual({ '@id': ORG_ID });
      expect(lafalla.find((n) => hasType(n, 'VideoObject')).contentUrl).toMatch(/ofrenda-2026\.mp4$/);
      expect(g('mapa.html').find((n) => hasType(n, 'WebPage')).mainEntity).toEqual({ '@id': `${ORIGIN}/#place` });
      expect(g('eventos.html').find((n) => hasType(n, 'WebPage')).mainEntity).toEqual({ '@id': ORG_ID });
      const llibret = g('llibret_2026.html');
      expect(llibret.some((n) => hasType(n, 'Event'))).toBeFalsy();
      expect(llibret.find((n) => hasType(n, 'Book'))['@id']).toBe(`${pref}llibret_2026.html#llibre`);
      expect(llibret.filter((n) => hasType(n, 'WebPageElement'))).toHaveLength(10);
    });
  }

  test('ai-enhanced-schema.json coincide con la fuente en nombre, url, redes, dirección y geo', () => {
    const ai = JSON.parse(fs.readFileSync(path.join(DIST, 'seo', 'ai-enhanced-schema.json'), 'utf8'));
    const org = fuente.organization;
    expect(ai.name).toBe(org.name);
    expect(ai.url).toBe(org.url);
    expect(ai.sameAs).toEqual(org.sameAs);
    expect(ai.address).toEqual(org.address);
    expect(ai.geo).toEqual(org.location.geo);
    expect(fs.existsSync(path.join(DIST, 'seo', 'ld-json-enhanced.json'))).toBeFalsy();
    expect(fs.existsSync(path.join(DIST, 'seo', 'advanced-schema-graph.json'))).toBeFalsy();
  });
});

test('en el navegador, /va/galeria_9.html sirve un único ld+json parseable', async ({ page }) => {
  await page.goto('/va/galeria_9.html');
  const info = await page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const data = JSON.parse(scripts[0].textContent);
    return { total: scripts.length, tipos: data['@graph'].map((n) => n['@type']), url: data['@graph'].find((n) => n['@type'] === 'ImageGallery').url };
  });
  expect(info.total).toBe(1);
  expect(info.tipos).toContain('ImageGallery');
  expect(info.url).toBe('https://fallasuissa.es/va/galeria_9.html');
});
