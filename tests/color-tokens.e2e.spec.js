// tests/color-tokens.e2e.spec.js
// Paleta funcional (v4.29.0): los tokens aditivos existen en _variables.scss, el
// degradado institucional tiene una sola fuente y los pares de color críticos
// cumplen WCAG 2.2 AA (4,5:1 texto normal; 3:1 texto grande y componentes).
// No usa navegador: lee SCSS y calcula el contraste con la fórmula de luminancia.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCSS = path.join(__dirname, '..', 'src', 'scss');
const VARS = fs.readFileSync(path.join(SCSS, 'abstracts', '_variables.scss'), 'utf8');

function hex(nombre) {
  const m = VARS.match(new RegExp(`^\\$${nombre}\\s*:\\s*(#[0-9a-fA-F]{3,6})`, 'm'));
  if (!m) throw new Error(`variable $${nombre} no encontrada`);
  let h = m[1].slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return h.toLowerCase();
}
function lum(h) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const x = lum(a); const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test.describe('color-tokens — paleta funcional', () => {
  test('los tokens aditivos existen y el degradado institucional es único', () => {
    for (const v of ['gradiente-institucional', 'coral-texto', 'coral-claro', 'azul-enlace-oscuro', 'texto-secundario-oscuro', 'superficie-elevada-oscuro', 'estado-error', 'estado-exito', 'estado-aviso', 'estado-error-oscuro', 'estado-exito-oscuro', 'estado-aviso-oscuro']) {
      expect(VARS, `$${v}`).toMatch(new RegExp(`^\\$${v}\\s*:`, 'm'));
    }
    // Los de marca no cambian
    expect(hex('primary-color')).toBe('ff6f61');
    expect(hex('color-azul-falla')).toBe('004bcf');
    expect(VARS).toContain('linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%)');
    // Ninguna copia literal del degradado fuera de _variables.scss
    const literal = /linear-gradient\(\s*135deg\s*,\s*#0a4b8d\s+0%\s*,\s*#02427a\s+60%\s*,\s*#003366\s+100%\s*\)/i;
    const copias = [];
    const walk = (dir) => fs.readdirSync(dir).forEach((f) => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) return walk(p);
      if (p.endsWith('_variables.scss')) return;
      if (literal.test(fs.readFileSync(p, 'utf8'))) copias.push(path.relative(SCSS, p));
    });
    walk(SCSS);
    expect(copias).toEqual([]);
  });

  test('pares de texto normal ≥ 4,5:1', () => {
    const pares = [
      ['coral-texto', 'blanco'], ['coral-texto', 'blanco-hueso'], ['coral-texto', 'naranja-suave'],
      ['coral-claro', 'negro-casi'], ['coral-claro', 'gris-muy-oscuro'],
      ['color-azul-falla', 'blanco'], ['color-azul-falla', 'naranja-suave'],
      ['azul-enlace-oscuro', 'negro-casi'], ['azul-enlace-oscuro', 'superficie-elevada-oscuro'],
      ['texto-secundario-oscuro', 'negro-casi'], ['texto-secundario-oscuro', 'superficie-elevada-oscuro'],
      ['negro-casi', 'primary-color'], ['negro-casi', 'rojo-salmon'],
      ['blanco', 'estado-error'], ['blanco', 'estado-exito'], ['blanco', 'estado-aviso'],
      ['estado-error-oscuro', 'superficie-elevada-oscuro'], ['estado-exito-oscuro', 'superficie-elevada-oscuro'], ['estado-aviso-oscuro', 'superficie-elevada-oscuro'],
      ['blanco', 'coral-texto'], ['secondary-color', 'blanco'], ['blanco-hueso', 'negro-casi']
    ];
    for (const [a, b] of pares) {
      expect(ratio(hex(a), hex(b)), `${a} sobre ${b}`).toBeGreaterThanOrEqual(4.5);
    }
    // Sobre el stop más claro del degradado institucional (#0a4b8d)
    for (const t of ['blanco', 'blanco-hueso', 'coral-claro', 'dorado', 'amarillo-anaranjado']) {
      expect(ratio(hex(t), '0a4b8d'), `${t} sobre #0a4b8d`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('el coral de marca solo vale como texto grande sobre el azul (≥ 3:1)', () => {
    expect(ratio(hex('primary-color'), '0a4b8d')).toBeGreaterThanOrEqual(3);
    // y NO como texto normal sobre claro: documenta por qué existe $coral-texto
    expect(ratio(hex('primary-color'), hex('blanco'))).toBeLessThan(4.5);
  });

  test('modo oscuro (v4.30.0): todo el coral de marca pasa a $coral-texto vía --coral-marca', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookieConsent', 'all'); });
    await page.goto('/index.html');
    const leer = () => page.evaluate(() => ({
      coral: getComputedStyle(document.body).getPropertyValue('--coral-marca').trim(),
      rgb: getComputedStyle(document.body).getPropertyValue('--coral-marca-rgb').trim(),
      borde: getComputedStyle(document.querySelector('.countdown__contenedor')).borderTopColor,
    }));
    const claro = await leer();
    expect(claro.coral).toBe('#ff6f61');
    expect(claro.rgb.replace(/\s/g, '')).toBe('255,111,97');
    expect(claro.borde).toBe('rgb(255, 111, 97)');

    await page.click('.header__modo-boton');
    await expect.poll(async () => (await leer()).coral).toBe('#b83f35');
    const oscuro = await leer();
    expect(oscuro.rgb.replace(/\s/g, '')).toBe('184,63,53');
    expect(oscuro.borde).toBe('rgb(184, 63, 53)');
    // Ningún elemento del DOM conserva el coral claro como color, borde o fondo
    // (las transiciones de tema duran hasta 2,4 s: se espera a que acaben)
    await expect.poll(() => page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if ([s.color, s.borderTopColor, s.backgroundColor, s.outlineColor].includes('rgb(255, 111, 97)')) out.push(el.tagName + '.' + el.className);
        if (out.length > 5) break;
      }
      return out;
    }), { timeout: 8000 }).toEqual([]);
  });
});
