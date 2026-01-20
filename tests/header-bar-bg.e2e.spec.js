const { test, expect } = require('@playwright/test');

const PAGES = ['index.html', 'lafalla.html', 'eventos.html', 'meteo.html', 'blog.html'];

async function getBarBackgroundImage(bar) {
  return bar.evaluate((el) => window.getComputedStyle(el).backgroundImage);
}

test.describe('Header bar: fondo azul translúcido en modo claro', () => {
  for (const pageName of PAGES) {
    test(`${pageName}: gradiente sólido al cargar y al hacer scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${pageName}`);

      const bar = page.locator('.header__barra, .header-inner__barra').first();
      await expect(bar).toBeVisible();

      const bgInitial = await getBarBackgroundImage(bar);
      expect(bgInitial).toContain('linear-gradient');
      expect(bgInitial.toLowerCase()).toContain('rgba(');

      await page.evaluate(() => window.scrollTo(0, 200));
      await expect
        .poll(async () => bar.evaluate((el) => el.className), { timeout: 5000 })
        .toContain('scrolled');

      const bgScrolled = await getBarBackgroundImage(bar);
      expect(bgScrolled).toContain('linear-gradient');
      expect(bgScrolled.toLowerCase()).toContain('rgba(');
    });
  }
});
