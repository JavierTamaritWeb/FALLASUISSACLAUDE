// tests/escudo-enlace.e2e.spec.js
// Guardia de v4.23.2: todo escudo de la Falla (Escudo_falla.* y
// logo-escudo-cutty.svg) enlaza a la home https://fallasuissa.es/ con un
// nombre accesible, en ES y en /va/ (pre-renderizado en valenciano).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const HOME = 'https://fallasuissa.es/';
const RE_ESCUDO = /<img\b[^>]*(?:Escudo_falla|logo-escudo-cutty)[^>]*>/g;

function paginas() {
  const es = fs.readdirSync(DIST).filter((f) => f.endsWith('.html') && f !== 'mantenimiento.html');
  const va = fs.readdirSync(path.join(DIST, 'va')).filter((f) => f.endsWith('.html')).map((f) => `va/${f}`);
  return [...es, ...va];
}

test.describe('Escudos enlazados a la home', () => {
  test('en el HTML servido, cada escudo está dentro de un <a> a la home con aria-label', () => {
    const errores = [];
    let total = 0;
    for (const f of paginas()) {
      const html = fs.readFileSync(path.join(DIST, f), 'utf8');
      for (const m of html.matchAll(RE_ESCUDO)) {
        total += 1;
        const antes = html.slice(0, m.index);
        const aAbierta = antes.lastIndexOf('<a ');
        if (aAbierta === -1 || aAbierta < antes.lastIndexOf('</a>')) {
          errores.push(`${f}: escudo sin enlace → ${m[0].slice(0, 90)}`);
          continue;
        }
        const etiqueta = antes.slice(aAbierta, antes.indexOf('>', aAbierta) + 1);
        if (!etiqueta.includes(`href="${HOME}"`)) errores.push(`${f}: el enlace no apunta a ${HOME} → ${etiqueta}`);
        if (!/aria-label="[^"]+"/.test(etiqueta)) errores.push(`${f}: enlace sin aria-label → ${etiqueta}`);
        if (f.startsWith('va/') && /data-i18n-aria-label="nav\.escudoInicio"/.test(etiqueta)
          && !etiqueta.includes("aria-label=\"Anar a la pàgina d'inici de la Falla Suïssa\"")) {
          errores.push(`${f}: aria-label sin pre-render VA → ${etiqueta}`);
        }
      }
    }
    expect(total, 'no se encontró ningún escudo').toBeGreaterThan(100);
    expect(errores, errores.join('\n')).toEqual([]);
  });

  for (const pagina of ['eventos.html', 'va/colaboraciones.html', 'index.html']) {
    test(`${pagina}: clic en el escudo del footer lleva a la home`, async ({ page }) => {
      // No salir a internet: se responde la home de producción con un stub
      await page.route(`${HOME}**`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>home</title>' }));
      await page.goto(`/${pagina}`);
      const enlace = page.locator('footer a.escudo-enlace').first();
      await expect(enlace).toHaveAttribute('href', HOME);
      await enlace.scrollIntoViewIfNeeded();
      await Promise.all([page.waitForURL(HOME), enlace.click()]);
      await expect(page).toHaveTitle('home');
    });
  }

  test('el escudo del header de una página interior es operable con teclado', async ({ page }) => {
    await page.route(`${HOME}**`, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>home</title>' }));
    await page.goto('/eventos.html');
    const enlace = page.locator('.inner__titulo a.escudo-enlace');
    await expect(enlace).toHaveAccessibleName('Ir a la página de inicio de la Falla Suïssa');
    await enlace.focus();
    await Promise.all([page.waitForURL(HOME), page.keyboard.press('Enter')]);
  });
});
