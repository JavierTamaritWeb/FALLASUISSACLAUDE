const { test, expect } = require('@playwright/test');

function clearClientState(page) {
  return page.addInitScript(() => {
    // addInitScript se ejecuta en cada navegación. Usamos sessionStorage para
    // limpiar solo una vez por test y no borrar el idioma al navegar a otra página.
    if (!sessionStorage.getItem('__e2e_cleaned')) {
      localStorage.clear();
      sessionStorage.setItem('__e2e_cleaned', '1');
    }
  });
}

test.describe('i18n: sistema de traducciones', () => {
  test('ES por defecto: nav + historia + claves nuevas', async ({ page }) => {
    await clearClientState(page);
    await page.goto('/index.html');

    await expect(page.locator('[data-i18n="nav.inicio"]').first()).toHaveText('Inicio');
    await expect(page.locator('[data-i18n="historia.archivos.titulo"]').first()).toHaveText('Archivos');

    await expect(page.locator('[data-i18n="historia.archivos.presentacion"]').first()).toHaveText('Presentación');
    await expect(page.locator('[data-i18n="historia.archivos.fallas2026"]').first()).toHaveText(' Fallas 2026');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202425"]').first()).toHaveText('Edición 2024-25');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202526"]').first()).toHaveText('Edición 2025-26');
    await expect(page.locator('a[href="llibret_2026.html"]').first()).toHaveAttribute('aria-label', 'Abrir Llibret digital 2025-2026 en una pestaña nueva');
  });

  test('Cambiar a VA: actualiza textos, persiste y aplica en otras páginas', async ({ page }) => {
    await clearClientState(page);
    await page.goto('/index.html');

    // Esperar a que lang.js haya inicializado el label y listeners
    await expect(page.locator('#langSwitcher')).toContainText('IDIOMA ·');

    // En headless, el desplegable puede estar oculto (display:none) y Playwright no puede clickar.
    // Disparamos el click vía DOM para ejecutar el handler real de cambio de idioma.
    await page.evaluate(() => {
      const option = document.querySelector('.header__lang-option[data-lang="va"]');
      if (!option) throw new Error('No se encontró la opción de idioma VA');
      option.click();
    });

    await expect(page.locator('#langSwitcher')).toContainText('Valencià');

    await expect(page.locator('[data-i18n="nav.inicio"]').first()).toHaveText('Inici');
    await expect(page.locator('[data-i18n="historia.archivos.titulo"]').first()).toHaveText('Arxius');

    await expect(page.locator('[data-i18n="historia.archivos.presentacion"]').first()).toHaveText('Presentació');
    await expect(page.locator('[data-i18n="historia.archivos.fallas2026"]').first()).toHaveText(' Falles 2026');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202425"]').first()).toHaveText('Edició 2024-25');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202526"]').first()).toHaveText('Edició 2025-26');
    await expect(page.locator('a[href="llibret_2026.html"]').first()).toHaveAttribute('aria-label', 'Obrir Llibret digital 2025-2026 en una pestanya nova');

    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('lang')))
      .toBe('va');

    await page.goto('/lafalla.html');

    await expect(page.locator('[data-i18n="historia.archivos.titulo"]').first()).toHaveText('Arxius');
    await expect(page.locator('[data-i18n="historia.archivos.presentacion"]').first()).toHaveText('Presentació');
    await expect(page.locator('[data-i18n="historia.archivos.fallas2026"]').first()).toHaveText(' Falles 2026');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202425"]').first()).toHaveText('Edició 2024-25');
    await expect(page.locator('[data-i18n="historia.archivos.edicion202526"]').first()).toHaveText('Edició 2025-26');
    await expect(page.locator('a[href="llibret_2026.html"]').first()).toHaveAttribute('aria-label', 'Obrir Llibret digital 2025-2026 en una pestanya nova');

    await page.reload();
    await expect(page.locator('[data-i18n="nav.inicio"]').first()).toHaveText('Inici');
  });
});
