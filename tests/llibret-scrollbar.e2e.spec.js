const { test, expect, devices } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

function readDistLlibret() {
  const htmlPath = path.join(__dirname, '..', 'dist', 'llibret_2026.html');
  return fs.readFileSync(htmlPath, 'utf8');
}

test.describe('Llibret 2026 scrollbar', () => {
  test('dist/llibret_2026.html contiene las reglas base del scrollbar', async () => {
    const html = readDistLlibret();

    expect(html).toMatch(/@supports\s*\(selector\(::-webkit-scrollbar\)\)\s*\{[\s\S]*?::-webkit-scrollbar\s*\{[^}]*width:\s*12px;/i);
    expect(html).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*background-color:\s*#FFD700;[^}]*border:\s*0;[^}]*min-height:\s*var\(--nav-float-offset\);[^}]*border-radius:\s*4px;/i);
    expect(html).toMatch(/::-webkit-scrollbar-track\s*\{[^}]*background-color:\s*#E3E2E2;[^}]*border-radius:\s*4px;/i);
    expect(html).toMatch(/@supports\s+not\s*\(selector\(::-webkit-scrollbar\)\)\s*\{[\s\S]*?scrollbar-color:\s*#FFD700\s+#E3E2E2;[\s\S]*?scrollbar-width:\s*thin;/i);
    expect(html).not.toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*min-height:\s*56px/i);
    expect(html).not.toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*min-height:\s*64px/i);
    expect(html).not.toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*min-width:\s*64px/i);
    expect(html).not.toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*border-radius:\s*999px/i);
  });

  test('se renderiza bien en escritorio sin overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('/llibret_2026.html');

    await expect(page.locator('.cover__heading')).toBeVisible();
    await expect(page.locator('.toc')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });

  test('se renderiza bien en iPhone emulado', async ({ browser, browserName }) => {
    test.skip(browserName !== 'webkit', 'La comprobacion de iPhone se valida sobre WebKit.');

    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();

    await page.goto('/llibret_2026.html');
    await expect(page.locator('.cover__heading')).toBeVisible();
    await expect(page.locator('.nav-float')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });

    expect(hasHorizontalOverflow).toBe(false);

    await context.close();
  });
});