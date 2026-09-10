// tests/galeria-pager.e2e.spec.js
// Paginación entre galerías (v4.26.0): la genera el build (gulpfile.js →
// buildGaleriaPager) bajo el bloc de cada galeria_N.html a partir de las
// galerías existentes. La lista se lee de dist/ (no se hardcodea el número).

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const translations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'translations.json'), 'utf8'));

function galerias() {
  return fs.readdirSync(DIST)
    .map((f) => f.match(/^galeria_(\d+)\.html$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

const NUMS = galerias();
expect(NUMS.length).toBeGreaterThanOrEqual(9);

test.describe('galeria-pager — HTML generado (ES y /va/)', () => {
  for (const lang of ['es', 'va']) {
    for (const n of NUMS) {
      test(`${lang === 'va' ? 'va/' : ''}galeria_${n}.html: vecinas, tira numérica y nombres ${lang.toUpperCase()}`, () => {
        const file = path.join(DIST, lang === 'va' ? 'va' : '', `galeria_${n}.html`);
        const html = fs.readFileSync(file, 'utf8');
        const nombres = translations[lang].galeria;

        const navs = html.match(/<nav class="galeria-pager"[^>]*>[\s\S]*?<\/nav>/g) || [];
        expect(navs.length).toBe(1);
        const nav = navs[0];
        expect(nav).not.toContain('<!-- galeria-pager -->');

        // Tira numérica en orden, con href relativo y la actual marcada
        const numeros = nav.match(/<a class="galeria-pager__numero"[^>]*>\d+<\/a>/g) || [];
        expect(numeros.length).toBe(NUMS.length);
        numeros.forEach((tag, i) => {
          const g = NUMS[i];
          expect(tag).toMatch(new RegExp(`>${g}</a>$`));
          expect(attr(tag, 'href')).toBe(`galeria_${g}.html`);
          expect(attr(tag, 'aria-label')).toBe(nombres[`galeria${g}`]);
          expect(attr(tag, 'title')).toBe(nombres[`galeria${g}`]);
          expect(attr(tag, 'data-i18n-aria-label')).toBe(`galeria.galeria${g}`);
          if (g === n) expect(attr(tag, 'aria-current')).toBe('page');
          else expect(attr(tag, 'aria-current')).toBeNull();
        });

        // Vecinas: enlace con rel prev/next o hueco aria-disabled en los extremos
        const idx = NUMS.indexOf(n);
        const prev = NUMS[idx - 1];
        const next = NUMS[idx + 1];
        const anterior = nav.match(/<(a|span) class="galeria-pager__vecina galeria-pager__vecina--anterior"[^>]*>/)[0];
        const siguiente = nav.match(/<(a|span) class="galeria-pager__vecina galeria-pager__vecina--siguiente"[^>]*>/)[0];
        if (prev) {
          expect(anterior.startsWith('<a ')).toBe(true);
          expect(attr(anterior, 'href')).toBe(`galeria_${prev}.html`);
          expect(attr(anterior, 'rel')).toBe('prev');
          expect(nav).toContain(`data-i18n="galeria.galeria${prev}">${nombres[`galeria${prev}`]}<`);
        } else {
          expect(anterior.startsWith('<span ')).toBe(true);
          expect(attr(anterior, 'aria-disabled')).toBe('true');
        }
        if (next) {
          expect(siguiente.startsWith('<a ')).toBe(true);
          expect(attr(siguiente, 'href')).toBe(`galeria_${next}.html`);
          expect(attr(siguiente, 'rel')).toBe('next');
        } else {
          expect(siguiente.startsWith('<span ')).toBe(true);
          expect(attr(siguiente, 'aria-disabled')).toBe('true');
        }

        // Enlace a todas las galerías, traducido; sin hrefs absolutos ni ../ en el nav
        expect(nav).toContain(`href="galerias.html" data-i18n="galeriasPager.todas">${translations[lang].galeriasPager.todas}<`);
        expect(nav).not.toMatch(/href="(https?:|\/|\.\.\/)/);
        expect(attr(nav.match(/<nav[^>]*>/)[0], 'aria-label')).toBe(translations[lang].galeriasPager.aria);
      });
    }
  }
});

test.describe('galeria-pager — navegación en el navegador', () => {
  test('Siguiente desde galeria_1 lleva a galeria_2 y el número 1 es el actual', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/galeria_1.html');
    const actual = page.locator('.galeria-pager__numero[aria-current="page"]');
    await expect(actual).toHaveText('1');
    expect(await actual.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 111, 97)');
    await expect(page.locator('.galeria-pager__vecina--anterior')).toHaveAttribute('aria-disabled', 'true');
    await Promise.all([
      page.waitForURL(/\/galeria_2\.html$/),
      page.locator('.galeria-pager__vecina--siguiente').click()
    ]);
    await expect(page.locator('.galeria-pager__numero[aria-current="page"]')).toHaveText('2');
  });

  test('desde /va/ los saltos se quedan en /va/ y los textos van en valenciano', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/va/galeria_3.html');
    await expect(page.locator('.galeria-pager__todas')).toHaveText('Totes les galeries');
    await expect(page.locator('.galeria-pager__numero').nth(1)).toHaveAttribute('aria-label', 'Fallera Major Infantil 2025-26');
    await Promise.all([
      page.waitForURL(/\/va\/galeria_4\.html$/),
      page.locator('.galeria-pager__numero', { hasText: /^4$/ }).click()
    ]);
    await expect(page.locator('.galeria-pager__numero[aria-current="page"]')).toHaveText('4');
  });

  test('en la última galería Siguiente está deshabilitado y no es un enlace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const ultima = NUMS[NUMS.length - 1];
    await page.goto(`/galeria_${ultima}.html`);
    const sig = page.locator('.galeria-pager__vecina--siguiente');
    await expect(sig).toHaveAttribute('aria-disabled', 'true');
    expect(await sig.evaluate((el) => el.tagName)).toBe('SPAN');
    expect(await sig.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });

  test('a 375px la tira cabe sin scroll horizontal y los números son pulsables', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/galeria_5.html');
    const nav = page.locator('.galeria-pager');
    await nav.scrollIntoViewIfNeeded();
    const medidas = await nav.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      docScroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
      numero: el.querySelector('.galeria-pager__numero').getBoundingClientRect().width
    }));
    expect(medidas.scrollWidth).toBeLessThanOrEqual(medidas.clientWidth);
    expect(medidas.docScroll).toBeLessThanOrEqual(medidas.inner);
    expect(medidas.numero).toBeGreaterThanOrEqual(30);
  });

  test('el selector de idioma traduce la paginación en runtime (ES → VA)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/galeria_2.html');
    await expect(page.locator('.galeria-pager__todas')).toHaveText('Todas las galerías');
    await page.click('#langSwitcher');
    await page.click('.header__lang-option[data-lang="va"]');
    await expect(page.locator('.galeria-pager__todas')).toHaveText('Totes les galeries');
    await expect(page.locator('.galeria-pager__numero').first()).toHaveAttribute('aria-label', 'Apuntà 2025-26');
  });
});
