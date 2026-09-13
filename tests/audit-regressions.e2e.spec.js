// Casos de fallo reproducidos en la auditoría del 13-09-2026.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const translations = JSON.parse(fs.readFileSync(path.join(root, 'src/data/translations.json'), 'utf8'));

async function languageFixture(page, { lang = 'es', saved = null, missing = false } = {}) {
  await page.addInitScript((value) => {
    localStorage.removeItem('lang');
    if (value !== null) localStorage.setItem('lang', value);
  }, saved);
  await page.route('**/data/translations.json', route => route.fulfill({ json: translations }));
  await page.route('**/audit-language.html', route => route.fulfill({
    contentType: 'text/html',
    body: `<html lang="${lang}"><body>
      <button id="langSwitcher">Idioma</button><div id="langOptions">
      <button class="header__lang-option" data-lang="es">ES</button>
      <button class="header__lang-option" data-lang="va">VA</button></div>
      <p data-i18n="${missing ? 'audit.clave.inexistente' : 'nav.inicio'}">Texto de reserva</p>
      <script src="/js/lang.js"></script><script src="/js/initTranslations.js"></script>
      </body></html>`
  }));
  await page.goto('/audit-language.html');
  await expect(page.locator('#langSwitcher')).toContainText('IDIOMA ·');
}

for (const scenario of [
  { lang: 'es', saved: 'va', expected: 'ca', text: 'Inici' },
  { lang: 'ca', saved: 'es', expected: 'es', text: 'Inicio' },
  { lang: 'ca', saved: 'idioma-invalido', expected: 'ca', text: 'Inici' }
]) {
  test(`idioma guardado ${scenario.saved}: texto y html lang coherentes en ${scenario.lang}`, async ({ page }) => {
    await languageFixture(page, scenario);
    await expect(page.locator('p')).toHaveText(scenario.text);
    await expect(page.locator('html')).toHaveAttribute('lang', scenario.expected);
  });
}

test('una traducción ausente conserva el texto y los atributos de reserva', async ({ page }) => {
  await languageFixture(page, { missing: true });
  await expect(page.locator('p')).toHaveText('Texto de reserva');
  await page.evaluate(() => {
    const p = document.querySelector('p');
    p.setAttribute('title', 'Ayuda de reserva');
    p.setAttribute('data-i18n-title', 'audit.atributo.inexistente');
    updateTranslations();
  });
  await expect(page.locator('p')).toHaveAttribute('title', 'Ayuda de reserva');
});

test('EmailJS se recupera de un fallo del CDN sin recargar ni enviar correos', async ({ page }) => {
  let attempts = 0;
  await page.route('**/@emailjs/browser@4/dist/email.min.js', route => {
    attempts++;
    return attempts === 1 ? route.abort() : route.fulfill({
      contentType: 'text/javascript',
      body: 'window.emailjs = { init() {}, send() { throw new Error("No se debe enviar correo en la prueba"); } };'
    });
  });
  await page.goto('/mantenimiento.html');
  await page.addScriptTag({ url: '/js/envia.js' });
  expect(await page.evaluate(() => loadEmailJs().then(() => 'ok', () => 'error'))).toBe('error');
  expect(await page.evaluate(() => Promise.race([
    loadEmailJs().then(() => 'ok', () => 'error'),
    new Promise(resolve => setTimeout(() => resolve('bloqueado'), 2000))
  ]))).toBe('ok');
  expect(attempts).toBe(2);
});

test('el tema se inicializa aunque el navegador bloquee localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Bloqueado', 'SecurityError'); } });
  });
  await page.route('**/audit-theme.html', route => route.fulfill({ contentType: 'text/html', body:
    '<html><head><meta name="theme-color" content="#000000"></head><body><button id="boton-modo-oscuro"></button><script src="/js/dark.js"></script></body></html>'
  }));
  await page.goto('/audit-theme.html');
  await expect(page.locator('body')).toHaveClass(/modo-claro/);
});

test('Escape en el botón del visor restaura el foco y desbloquea el scroll', async ({ page }) => {
  await page.route('**/audit-lightbox.html', route => route.fulfill({ contentType: 'text/html', body: `
    <html><head><style>[aria-hidden="true"] { display: none; }</style></head><body><main>
    <button class="colaboraciones-mosaic__trigger"><img src="/img/escudo-falla/Escudo-Oficial-Falla.png" width="40" alt="Escudo">Abrir</button>
    <div id="colaboracionesLightbox" class="colaboraciones-lightbox" role="dialog" aria-hidden="true">
    <button class="colaboraciones-lightbox__close">Cerrar</button><img class="colaboraciones-lightbox__image" alt="">
    <p class="colaboraciones-lightbox__caption"></p></div></main>
    <script src="/js/accessibility.js"></script><script src="/js/colaboraciones-lightbox.js"></script></body></html>`
  }));
  await page.goto('/audit-lightbox.html');
  const trigger = page.locator('.colaboraciones-mosaic__trigger');
  await trigger.click();
  const lightbox = page.locator('#colaboracionesLightbox');
  await expect(lightbox.locator('.colaboraciones-lightbox__close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('body')).not.toHaveClass(/lightbox-open/);
  await expect(trigger).toBeFocused();
});

test('la CSP de los wrappers PDF permite objetos propios y bloquea objetos externos', async ({ page }) => {
  const htaccess = fs.readFileSync(path.join(root, 'src/.htaccess'), 'utf8');
  const csp = htaccess.match(/Header always set Content-Security-Policy "([^"]+)"/)[1];
  const sources = csp.match(/(?:^|;)\s*object-src\s+([^;]+)/)[1].trim().split(/\s+/);
  expect(sources).toContain("'self'");
  expect(sources).not.toContain('*');
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.effectiveDirective));
  });
  await page.route('**/pdf/Llibrets/Llibret_2025-26.html', async route => {
    const response = await route.fetch();
    // Chromium headless-shell no incluye visor PDF. Se prueba la misma directiva
    // con un documento HTML incrustado en el <object> real del wrapper.
    const body = (await response.text()).replace('data="Llibret_2025-26.pdf" type="application/pdf"',
      'data="/audit-embedded.html" type="text/html"');
    await route.fulfill({ response, body, headers: { ...response.headers(), 'content-security-policy': csp } });
  });
  await page.route('**/audit-embedded.html', route => route.fulfill({ contentType: 'text/html', body: '<p>Documento propio</p>' }));
  const objectRequest = page.waitForRequest(request => request.url().endsWith('/audit-embedded.html'));
  await page.goto('/pdf/Llibrets/Llibret_2025-26.html');
  await objectRequest;
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  await page.evaluate(() => {
    const foreign = document.createElement('object');
    foreign.type = 'text/html';
    foreign.data = 'https://example.invalid/documento.html';
    document.body.appendChild(foreign);
  });
  await expect.poll(() => page.evaluate(() => window.cspViolations)).toContain('object-src');
});
