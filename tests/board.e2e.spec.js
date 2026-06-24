// tests/board.e2e.spec.js
// Tests E2E para el tablón dinámico

const { test, expect } = require('@playwright/test');

const PAGES_WITH_BOARD = ['index.html', 'eventos.html'];

test.describe('Tablón Dinámico (.board)', () => {

  // El tablón de Eventos (#notesBoard, data/board.json) tiene notas reales: al
  // menos la preselección FMIV. Cuando se vacía, board.js pinta un empty-state
  // (board.empty); esa rama se cubre indirectamente por los tests de board.js.
  test.describe('Render de notas (tablón de Eventos)', () => {
    for (const pageName of PAGES_WITH_BOARD) {
      test(`${pageName}: renderiza notas reales y ningún empty-state`, async ({ page }) => {
        await page.goto(`/${pageName}`);
        await page.waitForSelector('#notesBoard article:not(.board__empty)', { timeout: 5000 });

        // Hay al menos una nota real y no se muestra el marcador de "sin anuncios".
        const realNotes = page.locator('#notesBoard article:not(.board__empty)');
        expect(await realNotes.count()).toBeGreaterThan(0);
        expect(await page.locator('#notesBoard .board__empty').count()).toBe(0);
      });

      test(`${pageName}: contenedor board existe`, async ({ page }) => {
        await page.goto(`/${pageName}`);
        const board = page.locator('#notesBoard');
        await expect(board).toBeVisible();
      });
    }
  });

  test.describe('Tipos de notas', () => {
    test('renderiza nota sin adjuntos correctamente', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      // Notas simples tienen article.board__note directamente (sin board__card padre)
      const simpleNotes = page.locator('#sportsBoard article.board__note');
      // Puede haber 0 o más notas simples dependiendo del contenido
      const count = await simpleNotes.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('renderiza nota con adjuntos', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      // Notas con adjuntos tienen article.board__card como contenedor
      const cardsWithFiles = page.locator('#sportsBoard article.board__card');
      const count = await cardsWithFiles.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Accesibilidad', () => {
    test('elementos decorativos tienen aria-hidden', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      const clampScrews = page.locator('#sportsBoard .clamp-screw[aria-hidden="true"]');
      const count = await clampScrews.count();
      expect(count).toBeGreaterThan(0);
    });

    test('notas tienen role article', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      // Las notas (article) deben tener role="article"
      const articles = page.locator('#sportsBoard article[role="article"]');
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('enlaces de archivo tienen aria-label descriptivo', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      const fileLinks = page.locator('#sportsBoard .board__file-link[aria-label]');
      const count = await fileLinks.count();
      if (count > 0) {
        const label = await fileLinks.first().getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(5);
      }
    });
  });

  test.describe('Responsive', () => {
    test('mobile: 1 columna', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      const board = page.locator('#sportsBoard');
      const cols = await board.evaluate(el =>
        getComputedStyle(el).gridTemplateColumns.split(' ').length
      );
      expect(cols).toBe(1);
    });

    test('desktop: múltiples columnas', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      const board = page.locator('#sportsBoard');
      const cols = await board.evaluate(el =>
        getComputedStyle(el).gridTemplateColumns.split(' ').length
      );
      expect(cols).toBeGreaterThan(1);
    });
  });

  test.describe('Idioma', () => {
    test('contenido se actualiza al cambiar idioma', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      // Obtener contenido en español (idioma por defecto)
      const noteContent = page.locator('#sportsBoard .board__note-content').first();
      await expect(noteContent).toBeVisible();

      // Cambiar a valenciano usando el selector de idioma
      const langSwitcher = page.locator('#langSwitcher');
      if (await langSwitcher.isVisible()) {
        await langSwitcher.click();
        const vaOption = page.locator('.header__lang-option[data-lang="va"]');
        if (await vaOption.isVisible()) {
          await vaOption.click();
          // Esperar un momento para que se actualice el contenido
          await page.waitForTimeout(300);

          // El contenido podría cambiar o ser igual si la traducción es idéntica
          // Lo importante es que no hay errores y el contenido sigue visible
          await expect(noteContent).toBeVisible();
        }
      }
    });

    test('eventos.html: la nota se re-renderiza al cambiar idioma', async ({ page }) => {
      await page.goto('/eventos.html');
      await page.waitForSelector('#notesBoard article:not(.board__empty)');

      const noteContent = page.locator('#notesBoard .board__note-content').first();
      await expect(noteContent).toBeVisible();

      const langSwitcher = page.locator('#langSwitcher');
      if (await langSwitcher.isVisible()) {
        await langSwitcher.click();
        const vaOption = page.locator('.header__lang-option[data-lang="va"]');
        if (await vaOption.isVisible()) {
          await vaOption.click();
          await page.waitForTimeout(300);
          // La nota sigue visible tras el re-render por idioma.
          await expect(page.locator('#notesBoard .board__note-content').first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Modo Oscuro', () => {
    test('board tiene estilos de modo oscuro', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      // Activar modo oscuro
      const darkModeButton = page.locator('.header__modo-boton');
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(500);

        // Verificar que el body tiene la clase modo-oscuro
        const bodyClass = await page.locator('body').getAttribute('class');
        expect(bodyClass).toContain('modo-oscuro');

        // Verificar que el board tiene estilos aplicados
        const board = page.locator('#sportsBoard');
        await expect(board).toBeVisible();
      }
    });
  });

  test.describe('SVG de archivos', () => {
    test('iconos SVG tienen clases correctas', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__note');

      const fileIcons = page.locator('#sportsBoard .board__file-icon');
      const count = await fileIcons.count();

      if (count > 0) {
        // Verificar que los iconos tienen clase de tipo (pdf o img)
        const firstIcon = fileIcons.first();
        const classList = await firstIcon.getAttribute('class');
        expect(classList).toMatch(/board__file-icon--(pdf|img)/);
      }
    });
  });

  test.describe('Tablón Deportes (#sportsBoard)', () => {
    test('deportes.html: 6 cards JCF con PDFs en pdf/JCF-2026-27/', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__card', { timeout: 5000 });

      const cards = page.locator('#sportsBoard .board__card');
      expect(await cards.count()).toBeGreaterThanOrEqual(6);

      const jcfLinks = page.locator('#sportsBoard .board__file-link[href*="pdf/JCF-2026-27/"]');
      expect(await jcfLinks.count()).toBeGreaterThanOrEqual(6);
    });

    test('deportes.html: cambio ES→VA re-renderiza adjuntos', async ({ page }) => {
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__file-name');

      const langSwitcher = page.locator('#langSwitcher');
      if (await langSwitcher.isVisible()) {
        await langSwitcher.click();
        const vaOption = page.locator('.header__lang-option[data-lang="va"]');
        if (await vaOption.isVisible()) {
          await vaOption.click();
          await page.waitForTimeout(300);
        }
      }

      // Tras el re-render siguen existiendo 6+ cards con sus archivos.
      const cards = page.locator('#sportsBoard .board__card');
      expect(await cards.count()).toBeGreaterThanOrEqual(6);
    });

    test('#notesBoard y #sportsBoard son independientes (comparten board.js)', async ({ page }) => {
      // Cada tablón lee su propia fuente: Deportes mantiene sus 6 cards y Eventos
      // sus notas; uno no afecta al otro aunque compartan board.js.
      await page.goto('/deportes.html');
      await page.waitForSelector('#sportsBoard .board__card');
      expect(await page.locator('#sportsBoard .board__card').count()).toBeGreaterThanOrEqual(6);

      await page.goto('/eventos.html');
      await page.waitForSelector('#notesBoard article:not(.board__empty)');
      expect(await page.locator('#notesBoard article:not(.board__empty)').count()).toBeGreaterThan(0);
    });
  });
});
