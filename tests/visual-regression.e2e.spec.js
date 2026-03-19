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
  { name: 'blog-detail-somni', path: '/blog-detail.html?slug=somni' },
  { name: 'blog-detail-anima', path: '/blog-detail.html?slug=anima' },
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

async function prepareDeterministicPage(page, options = {}) {
  await setDeterministicClientState(page, {
    darkMode: 'false',
    ...options
  });
  await freezeTime(page);
  await mockWeatherApi(page);
  await mockMapTiles(page);
}

async function waitForThemeMode(page, mode) {
  const expectedClass = mode === 'dark' ? 'modo-oscuro' : 'modo-claro';

  await expect.poll(async () => {
    return page.evaluate((themeClass) => {
      return document.body.classList.contains(themeClass)
        && document.documentElement.classList.contains(themeClass);
    }, expectedClass);
  }).toBe(true);
}

async function waitForStableFullPageHeight(page, options = {}) {
  const {
    intervalMs = 150,
    maxAttempts = 20,
    stableSamples = 3
  } = options;

  let previousHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  let stableCount = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await page.waitForTimeout(intervalMs);

    const currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    if (currentHeight === previousHeight) {
      stableCount += 1;

      if (stableCount >= stableSamples) {
        return;
      }

      continue;
    }

    previousHeight = currentHeight;
    stableCount = 0;
  }
}

async function waitForVisualPageReady(page, pageName) {
  await page.waitForLoadState('networkidle');

  if (pageName.startsWith('blog-detail')) {
    await page.waitForSelector('.blog-detail__article', { timeout: 5000 }).catch(() => {});
  }

  if (pageName === 'blog' || pageName === 'index') {
    await page.waitForSelector('.blog__post', { timeout: 5000 }).catch(() => {});
  }

  if (pageName === 'meteo') {
    await expect(page.locator('#langSwitcher')).toContainText('Español');
    await expect(page.locator('#current-temp')).toHaveText(/\d+°C/);
    await expect(page.locator('#forecast-day-1-icon')).toHaveAttribute('src', /@2x\.png/);
    await expect(page.locator('#forecast-day-1-date')).not.toHaveText(/^Día 1$/);
    await expect(page.locator('#forecast-day-5-temp')).toHaveText(/\d+°C/);

    await expect.poll(async () => {
      return page.evaluate(() => {
        const selectors = [
          '#current-icon-img',
          '#forecast-day-1-icon',
          '#forecast-day-2-icon',
          '#forecast-day-3-icon',
          '#forecast-day-4-icon',
          '#forecast-day-5-icon'
        ];

        return selectors.every((selector) => {
          const image = document.querySelector(selector);
          return image instanceof HTMLImageElement
            && image.complete
            && image.naturalWidth > 0;
        });
      });
    }).toBe(true);

    await waitForStableFullPageHeight(page);
  }
}

async function stabilizeRevealForScreenshot(page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('has-scroll-reveal');

    if (window.scrollReveal && typeof window.scrollReveal.showAll === 'function') {
      window.scrollReveal.showAll(document);
    }

    document.querySelectorAll('.reveal').forEach((element) => {
      element.classList.add('reveal-ready', 'is-visible');
    });

    const notification = document.getElementById('notificacion');
    if (notification) {
      notification.classList.remove('mostrar');
    }
  });
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
        await waitForThemeMode(browserPage, 'light');
        await stabilizeRevealForScreenshot(browserPage);
        await browserPage.waitForTimeout(500);
        await waitForStableFullPageHeight(browserPage);

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
    await prepareDeterministicPage(page, { darkMode: 'true' });
  });

  for (const page of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${page.name} - ${viewport.name} (dark)`, async ({ page: browserPage }) => {
        await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await browserPage.goto(page.path);

        // Esperar a que cargue
        await waitForVisualPageReady(browserPage, page.name);
        await waitForThemeMode(browserPage, 'dark');

        await stabilizeRevealForScreenshot(browserPage);
        await browserPage.waitForTimeout(500);
        await waitForStableFullPageHeight(browserPage);

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
