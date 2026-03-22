// tests/fullscreen-fallback.e2e.spec.js
// Verifica que el visor de imágenes funciona con y sin Fullscreen API (iPhone Safari fallback)

const { test, expect } = require('@playwright/test');

// Helper: deshabilitar Fullscreen API para simular iPhone Safari
async function disableFullscreenAPI(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
    Object.defineProperty(document, 'webkitFullscreenEnabled', { value: false, configurable: true });
  });
}

test.describe('Fullscreen / Lightbox fallback en galerías', () => {

  test('el overlay fallback se crea al hacer clic sin Fullscreen API', async ({ page }) => {
    await page.goto('/galeria_1.html');
    await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });

    // Simular iPhone (sin Fullscreen API)
    await disableFullscreenAPI(page);

    // Clic en la imagen activa
    await page.locator('.notepad__page--active img').click();

    // El overlay debe aparecer
    const overlay = page.locator('#fullscreen-fallback');
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await expect(overlay).toHaveAttribute('aria-hidden', 'false');

    // La imagen del overlay debe tener src
    const overlayImg = overlay.locator('img');
    const src = await overlayImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src.length).toBeGreaterThan(0);
  });

  test('el overlay fallback se cierra al hacer clic', async ({ page }) => {
    await page.goto('/galeria_1.html');
    await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });
    await disableFullscreenAPI(page);

    // Abrir
    await page.locator('.notepad__page--active img').click();
    const overlay = page.locator('#fullscreen-fallback');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Cerrar al clicar en el overlay
    await overlay.click({ position: { x: 10, y: 10 } });
    await expect(overlay).toBeHidden({ timeout: 3000 });
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  test('el overlay fallback se cierra con Escape', async ({ page }) => {
    await page.goto('/galeria_1.html');
    await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });
    await disableFullscreenAPI(page);

    // Abrir
    await page.locator('.notepad__page--active img').click();
    const overlay = page.locator('#fullscreen-fallback');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Cerrar con Escape
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden({ timeout: 3000 });
  });

  test('con Fullscreen API disponible, no se crea overlay fallback', async ({ page }) => {
    await page.goto('/galeria_1.html');
    await page.waitForSelector('.notepad__page--active img', { timeout: 10000 });

    // Fullscreen API está habilitada por defecto en Chromium
    const hasFs = await page.evaluate(() => document.fullscreenEnabled);
    expect(hasFs).toBe(true);

    // Clic en imagen - usa API nativa, no overlay
    await page.locator('.notepad__page--active img').click();
    await page.waitForTimeout(500);

    // El overlay fallback NO debe existir o no ser visible
    const overlay = page.locator('#fullscreen-fallback');
    const count = await overlay.count();
    if (count > 0) {
      await expect(overlay).toBeHidden();
    }
  });
});
