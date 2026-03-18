const { test, expect } = require('@playwright/test');

const VIEWPORT_TOLERANCE = 1;
const MIN_TOUCH_TARGET_SIZE = 44;
const TOUCH_TARGET_TOLERANCE = 0.1;

const BREAKPOINT_CASES = [
  {
    name: 'mobile-320-closed',
    viewport: { width: 320, height: 568 },
    openMenu: false,
    expectedBannerZIndex: '2100'
  },
  {
    name: 'mobile-390-closed',
    viewport: { width: 390, height: 844 },
    openMenu: false,
    expectedBannerZIndex: '2100'
  },
  {
    name: 'mobile-390-open',
    viewport: { width: 390, height: 844 },
    openMenu: true,
    expectedBannerZIndex: '2100'
  },
  {
    name: 'mobile-412-open',
    viewport: { width: 412, height: 915 },
    openMenu: true,
    expectedBannerZIndex: '2100'
  },
  {
    name: 'mobile-540-closed',
    viewport: { width: 540, height: 720 },
    openMenu: false,
    expectedBannerZIndex: '2100'
  },
  {
    name: 'tablet-768',
    viewport: { width: 768, height: 1024 },
    openMenu: false,
    expectedBannerZIndex: '1100'
  },
  {
    name: 'tablet-820',
    viewport: { width: 820, height: 1180 },
    openMenu: false,
    expectedBannerZIndex: '1100'
  },
  {
    name: 'desktop-1024',
    viewport: { width: 1024, height: 768 },
    openMenu: false,
    expectedBannerZIndex: '1100'
  },
  {
    name: 'desktop-1280',
    viewport: { width: 1280, height: 800 },
    openMenu: false,
    expectedBannerZIndex: '1100'
  },
  {
    name: 'desktop-1440',
    viewport: { width: 1440, height: 900 },
    openMenu: false,
    expectedBannerZIndex: '1100'
  }
];

async function abrirMenuMovil(page) {
  const menuToggle = page.locator('.header__menu-toggle').first();
  const nav = page.locator('.navegacion').first();
  const backdrop = page.locator('.nav-backdrop').first();

  await expect(menuToggle).toBeVisible();
  await menuToggle.click();
  await expect(nav).toHaveClass(/is-open/);
  await expect(backdrop).toHaveClass(/is-active/);
}

async function obtenerMetricasBanner(page) {
  return page.locator('#banner-subvencion').evaluate((banner) => {
    const closeButton = banner.querySelector('.banner-subvencion__cerrar');

    if (!(closeButton instanceof HTMLElement)) {
      return null;
    }

    const bannerRect = banner.getBoundingClientRect();
    const closeRect = closeButton.getBoundingClientRect();
    const centerX = closeRect.left + closeRect.width / 2;
    const centerY = closeRect.top + closeRect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    return {
      bannerRect: {
        top: bannerRect.top,
        right: bannerRect.right,
        bottom: bannerRect.bottom,
        left: bannerRect.left,
        width: bannerRect.width,
        height: bannerRect.height
      },
      closeRect: {
        top: closeRect.top,
        right: closeRect.right,
        bottom: closeRect.bottom,
        left: closeRect.left,
        width: closeRect.width,
        height: closeRect.height
      },
      topElementClass: topElement instanceof Element ? topElement.className : '',
      topHitCloseButton: topElement instanceof Element && Boolean(topElement.closest('.banner-subvencion__cerrar')),
      bannerZIndex: getComputedStyle(banner).zIndex,
      closeZIndex: getComputedStyle(closeButton).zIndex,
      pointerEvents: getComputedStyle(closeButton).pointerEvents,
      touchAction: getComputedStyle(closeButton).touchAction
    };
  });
}

function expectDentroDelViewport(metrics, viewport) {
  expect(metrics.bannerRect.left).toBeGreaterThanOrEqual(-VIEWPORT_TOLERANCE);
  expect(metrics.bannerRect.top).toBeGreaterThanOrEqual(-VIEWPORT_TOLERANCE);
  expect(metrics.bannerRect.right).toBeLessThanOrEqual(viewport.width + VIEWPORT_TOLERANCE);
  expect(metrics.bannerRect.bottom).toBeLessThanOrEqual(viewport.height + VIEWPORT_TOLERANCE);
}

test.describe('Banner de subvención - barrido de breakpoints', () => {
  for (const scenario of BREAKPOINT_CASES) {
    test(`index mantiene visible y cerrable el banner en ${scenario.name}`, async ({ page }) => {
      await page.setViewportSize(scenario.viewport);
      await page.goto('/index.html?resetBanner=1');

      const banner = page.locator('#banner-subvencion');
      const closeButton = banner.locator('.banner-subvencion__cerrar');

      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute('aria-hidden', 'false');
      await expect(closeButton).toBeVisible();

      if (scenario.openMenu) {
        await abrirMenuMovil(page);
      }

      const metrics = await obtenerMetricasBanner(page);

      expect(metrics).not.toBeNull();
      expectDentroDelViewport(metrics, scenario.viewport);
      expect(metrics.closeRect.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - TOUCH_TARGET_TOLERANCE);
      expect(metrics.closeRect.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE - TOUCH_TARGET_TOLERANCE);
      expect(metrics.topHitCloseButton).toBe(true);
      expect(metrics.pointerEvents).toBe('auto');
      expect(metrics.touchAction).toBe('manipulation');
      expect(metrics.bannerZIndex).toBe(scenario.expectedBannerZIndex);
      expect(metrics.closeZIndex).toBe('2');

      await closeButton.click();
      await expect(page.locator('#banner-subvencion')).toHaveCount(0);
    });
  }
});