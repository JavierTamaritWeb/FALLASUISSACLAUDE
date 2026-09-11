const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

function readDistCss() {
  const cssPath = path.join(__dirname, '..', 'dist', 'css', 'main.css');
  return fs.readFileSync(cssPath, 'utf8');
}

test.describe('Scrollbar (Safari/WebKit): thumb fijo y track #111 en oscuro', () => {
  test('dist/css/main.css contiene reglas para html en modo oscuro', async () => {
    const css = readDistCss();

    // Thumb en coral de marca vía custom property (v4.30.0: #ff6f61 en claro, #b83f35 en oscuro)
    expect(css).toMatch(/::-webkit-scrollbar-thumb\{[^}]*background-color:var\(--coral-marca\)/i);
    expect(css).toMatch(/:root\{[^}]*--coral-marca:#ff6f61/i);
    expect(css).toMatch(/modo-oscuro[^{]*\{[^}]*--coral-marca:#b83f35/i);

    // Track claro (gris) para WebKit
    expect(css).toMatch(/::-webkit-scrollbar-track\{[^}]*background-color:#e3e2e2/i);

    // Track oscuro para Safari: selector en html.modo-oscuro (o el fallback con :has)
    // Acepta #111 o #111111 según minificación.
    expect(css).toMatch(/html(?:\.modo-oscuro|:has\(body\.modo-oscuro\))::-webkit-scrollbar-track\{[^}]*background-color:#111(?:111)?/i);

    // Firefox: scrollbar-color aplicado a html en oscuro
    expect(css).toMatch(/html(?:\.modo-oscuro|:has\(body\.modo-oscuro\))\{[^}]*scrollbar-color:var\(--coral-marca\) #111(?:111)?/i);
  });

  test('al arrancar con localStorage.darkMode=true, <html> recibe modo-oscuro', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('darkMode', 'true');
    });

    await page.goto('/index.html');

    await expect
      .poll(async () => {
        return await page.evaluate(() => document.documentElement.classList.contains('modo-oscuro'));
      })
      .toBe(true);
  });
});
