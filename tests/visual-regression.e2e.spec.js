// @ts-check
const { test, expect } = require('@playwright/test');
const {
  freezeTime,
  setDeterministicClientState,
  mockWeatherApi,
  mockMapTiles
} = require('./helpers/deterministic-env');

/**
 * Tests de regresión visual para verificar que la UI no cambia
 * después de refactorizar el SCSS.
 *
 * Ejecutar para crear baseline: npm run test:e2e -- --update-snapshots
 * Ejecutar para comparar: npm run test:e2e
 */

const PAGES = [
  { name: 'index', path: '/index.html' },
  { name: 'lafalla', path: '/lafalla.html' },
  { name: 'eventos', path: '/eventos.html' },
  { name: 'meteo', path: '/meteo.html' },
  { name: 'blog', path: '/blog.html' },
  { name: 'galerias', path: '/galerias.html' },
  { name: 'calendario', path: '/calendario.html' },
  { name: 'mapa', path: '/mapa.html' },
  { name: 'organigrama', path: '/organigrama.html' }
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

async function prepareDeterministicPage(page) {
  await setDeterministicClientState(page);
  await freezeTime(page);
  await mockWeatherApi(page);
  await mockMapTiles(page);
}

async function waitForVisualPageReady(page, pageName) {
  await page.waitForLoadState('networkidle');

  if (pageName === 'meteo') {
    await expect(page.locator('#langSwitcher')).toContainText('Español');
    await expect(page.locator('#current-temp')).toHaveText(/\d+°C/);
    await expect
      .poll(async () => page.locator('#forecast-day-1-icon').getAttribute('src'))
      .toContain('@2x.png');
  }
}

test.describe('Visual Regression - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await prepareDeterministicPage(page);
  });

  for (const page of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${page.name} - ${viewport.name}`, async ({ page: browserPage }) => {
        await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await browserPage.goto(page.path);

        // Esperar a que carguen las fuentes y estilos
        await waitForVisualPageReady(browserPage, page.name);
        await browserPage.waitForTimeout(500);

        // Capturar screenshot de la página completa
        await expect(browserPage).toHaveScreenshot(`${page.name}-${viewport.name}-light.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01
        });
      });
    }
  }
});

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await prepareDeterministicPage(page);
  });

  for (const page of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${page.name} - ${viewport.name} (dark)`, async ({ page: browserPage }) => {
        await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await browserPage.goto(page.path);

        // Esperar a que cargue
        await waitForVisualPageReady(browserPage, page.name);

        // Activar modo oscuro
        const darkToggle = browserPage.locator('#darkModeToggle');
        if (await darkToggle.isVisible()) {
          await darkToggle.click();
          await browserPage.waitForTimeout(400);
        }

        await expect(browserPage).toHaveScreenshot(`${page.name}-${viewport.name}-dark.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01
        });
      });
    }
  }
});

test.describe('Visual Regression - Components', () => {
  test.beforeEach(async ({ page }) => {
    await prepareDeterministicPage(page);
  });

  test('Header - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-desktop.png', {
      maxDiffPixelRatio: 0.01
    });
  });

  test('Header - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-mobile.png', {
      maxDiffPixelRatio: 0.01
    });
  });

  test('Footer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png', {
      maxDiffPixelRatio: 0.01
    });
  });

  test('Navigation menu - mobile open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Abrir menú móvil
    const toggle = page.locator('button.header__menu-toggle');
    await toggle.click();
    await page.waitForTimeout(400);

    const nav = page.locator('nav.navegacion');
    await expect(nav).toHaveScreenshot('nav-mobile-open.png', {
      maxDiffPixelRatio: 0.01
    });
  });
});

test.describe('Visual Regression - Color Critical Elements', () => {
  test.beforeEach(async ({ page }) => {
    await prepareDeterministicPage(page);
  });

  test('Primary color buttons and links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    // Verificar que los elementos con color primario existen
    const primaryElements = page.locator('[class*="primary"], .btn, a.navegacion__link');
    const count = await primaryElements.count();

    if (count > 0) {
      const firstElement = primaryElements.first();
      await expect(firstElement).toHaveScreenshot('primary-element.png', {
        maxDiffPixelRatio: 0.01
      });
    }
  });

  test('Countdown component', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    const countdown = page.locator('.countdown, #countdown, [class*="countdown"]').first();
    if (await countdown.isVisible()) {
      await expect(countdown).toHaveScreenshot('countdown.png', {
        maxDiffPixelRatio: 0.02
      });
    }
  });

  test('Calendar colors', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calendario.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const calendar = page.locator('.calendario, #calendario, [class*="calendar"]').first();
    if (await calendar.isVisible()) {
      await expect(calendar).toHaveScreenshot('calendar.png', {
        maxDiffPixelRatio: 0.02
      });
    }
  });
});
