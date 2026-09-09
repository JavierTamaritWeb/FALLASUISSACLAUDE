// tests/board.e2e.spec.js
// Tests E2E para el tablón dinámico (multi-instancia, src/js/board.js).
//
// Data-driven: cada tablón se valida según el contenido REAL de su JSON fuente.
// Si el JSON no tiene notas activas se comprueba el empty-state (nota de marcador
// con pinza y texto board.empty); si las tiene, se comprueba el render de notas.
// Así el spec no hay que tocarlo al vaciar o repoblar un tablón.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function leerNotasActivas(jsonRelativo) {
  const ruta = path.join(__dirname, '..', 'src', 'data', jsonRelativo);
  const data = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  return (data.notas || []).filter(n => n.activo !== false);
}

// Tableros desplegados: { página, id del contenedor, JSON fuente }.
const BOARDS = [
  { page: 'index.html',    id: 'notesBoard',  source: 'board.json' },
  { page: 'eventos.html',  id: 'notesBoard',  source: 'board.json' },
  { page: 'deportes.html', id: 'sportsBoard', source: 'sports-board.json' },
];

for (const b of BOARDS) {
  b.notas = leerNotasActivas(b.source);
  b.vacio = b.notas.length === 0;
  // Selector que espera a que board.js haya pintado algo (nota real o marcador).
  b.anyNote = `#${b.id} article.board__note, #${b.id} article.board__card`;
}

// Primer tablón con notas reales (si lo hay) para los tests de render de contenido.
const BOARD_CON_NOTAS = BOARDS.find(b => !b.vacio) || null;

async function cambiarAValenciano(page) {
  const langSwitcher = page.locator('#langSwitcher');
  if (!(await langSwitcher.isVisible())) return false;
  await langSwitcher.click();
  const vaOption = page.locator('.header__lang-option[data-lang="va"]');
  if (!(await vaOption.isVisible())) return false;
  await vaOption.click();
  await page.waitForTimeout(300);
  return true;
}

test.describe('Tablón Dinámico (.board)', () => {

  test.describe('Estado de cada tablón según su JSON', () => {
    for (const b of BOARDS) {
      test(`${b.page} › #${b.id}: contenedor board visible`, async ({ page }) => {
        await page.goto(`/${b.page}`);
        await expect(page.locator(`#${b.id}`)).toBeVisible();
      });

      if (b.vacio) {
        test(`${b.page} › #${b.id}: ${b.source} vacío → empty-state y ninguna nota real`, async ({ page }) => {
          await page.goto(`/${b.page}`);
          await page.waitForSelector(`#${b.id} .board__empty`, { timeout: 5000 });

          const empty = page.locator(`#${b.id} .board__empty`);
          await expect(empty).toBeVisible();
          await expect(empty).toContainText('anuncios');

          // El marcador se renderiza como nota (tarjeta + pinza) pero no debe haber
          // ninguna nota real (sin el modificador board__empty).
          expect(await page.locator(`#${b.id} article:not(.board__empty)`).count()).toBe(0);
        });

        test(`${b.page} › #${b.id}: el empty-state se re-renderiza al cambiar idioma`, async ({ page }) => {
          await page.goto(`/${b.page}`);
          await page.waitForSelector(`#${b.id} .board__empty`);
          const textoEs = (await page.locator(`#${b.id} .board__empty`).textContent()).trim();
          expect(textoEs.length).toBeGreaterThan(0);

          if (await cambiarAValenciano(page)) {
            const empty = page.locator(`#${b.id} .board__empty`);
            await expect(empty).toBeVisible();
            const textoVa = (await empty.textContent()).trim();
            expect(textoVa.length).toBeGreaterThan(0);
          }
        });
      } else {
        test(`${b.page} › #${b.id}: renderiza las ${b.notas.length} notas activas de ${b.source}`, async ({ page }) => {
          await page.goto(`/${b.page}`);
          await page.waitForSelector(`#${b.id} article:not(.board__empty)`, { timeout: 5000 });

          expect(await page.locator(`#${b.id} article:not(.board__empty)`).count()).toBe(b.notas.length);
          expect(await page.locator(`#${b.id} .board__empty`).count()).toBe(0);

          // Notas con imagen/adjuntos → board__card; simples → board__note.
          const conExtras = b.notas.filter(n => n.imagen || (n.adjuntos && n.adjuntos.length)).length;
          expect(await page.locator(`#${b.id} article.board__card`).count()).toBe(conExtras);
          expect(await page.locator(`#${b.id} article.board__note:not(.board__empty)`).count()).toBe(b.notas.length - conExtras);
        });

        test(`${b.page} › #${b.id}: los adjuntos enlazan a sus URLs y sobreviven al cambio ES→VA`, async ({ page }) => {
          await page.goto(`/${b.page}`);
          await page.waitForSelector(`#${b.id} article:not(.board__empty)`);

          const urls = b.notas.flatMap(n => (n.adjuntos || []).map(a => a.url));
          for (const url of urls) {
            expect(await page.locator(`#${b.id} .board__file-link[href*="${url}"]`).count()).toBeGreaterThan(0);
          }

          await cambiarAValenciano(page);
          expect(await page.locator(`#${b.id} article:not(.board__empty)`).count()).toBe(b.notas.length);
          for (const url of urls) {
            expect(await page.locator(`#${b.id} .board__file-link[href*="${url}"]`).count()).toBeGreaterThan(0);
          }
        });
      }
    }
  });

  // Los tests estructurales usan el tablón de Deportes; valen tanto con notas
  // reales como con el empty-state (ambos son article.board__note con pinza).
  test.describe('Accesibilidad', () => {
    const b = BOARDS.find(x => x.id === 'sportsBoard');

    test('elementos decorativos tienen aria-hidden', async ({ page }) => {
      await page.goto(`/${b.page}`);
      await page.waitForSelector(b.anyNote);
      expect(await page.locator(`#${b.id} .clamp-screw[aria-hidden="true"]`).count()).toBeGreaterThan(0);
    });

    test('notas tienen role article', async ({ page }) => {
      await page.goto(`/${b.page}`);
      await page.waitForSelector(b.anyNote);
      expect(await page.locator(`#${b.id} article[role="article"]`).count()).toBeGreaterThan(0);
    });

    test('enlaces de archivo tienen aria-label descriptivo (si hay adjuntos)', async ({ page }) => {
      test.skip(!BOARD_CON_NOTAS, 'Ningún tablón tiene notas activas: no hay adjuntos que validar');
      await page.goto(`/${BOARD_CON_NOTAS.page}`);
      await page.waitForSelector(`#${BOARD_CON_NOTAS.id} article:not(.board__empty)`);

      const fileLinks = page.locator(`#${BOARD_CON_NOTAS.id} .board__file-link[aria-label]`);
      const count = await fileLinks.count();
      if (count > 0) {
        const label = await fileLinks.first().getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(5);
      }
    });
  });

  test.describe('Responsive', () => {
    const b = BOARDS.find(x => x.id === 'sportsBoard');

    test('mobile: 1 columna', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(`/${b.page}`);
      await page.waitForSelector(b.anyNote);
      const cols = await page.locator(`#${b.id}`).evaluate(el =>
        getComputedStyle(el).gridTemplateColumns.split(' ').length
      );
      expect(cols).toBe(1);
    });

    test('desktop: múltiples columnas', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto(`/${b.page}`);
      await page.waitForSelector(b.anyNote);
      const cols = await page.locator(`#${b.id}`).evaluate(el =>
        getComputedStyle(el).gridTemplateColumns.split(' ').length
      );
      expect(cols).toBeGreaterThan(1);
    });
  });

  test.describe('Modo Oscuro', () => {
    const b = BOARDS.find(x => x.id === 'sportsBoard');

    test('board sigue visible con modo oscuro activo', async ({ page }) => {
      await page.goto(`/${b.page}`);
      await page.waitForSelector(b.anyNote);

      const darkModeButton = page.locator('.header__modo-boton');
      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();
        await page.waitForTimeout(500);
        expect(await page.locator('body').getAttribute('class')).toContain('modo-oscuro');
        await expect(page.locator(`#${b.id}`)).toBeVisible();
        await expect(page.locator(b.anyNote).first()).toBeVisible();
      }
    });
  });

  test.describe('SVG de archivos', () => {
    test('iconos SVG tienen clase de tipo (si hay adjuntos)', async ({ page }) => {
      test.skip(!BOARD_CON_NOTAS, 'Ningún tablón tiene notas activas: no hay iconos que validar');
      await page.goto(`/${BOARD_CON_NOTAS.page}`);
      await page.waitForSelector(`#${BOARD_CON_NOTAS.id} article:not(.board__empty)`);

      const fileIcons = page.locator(`#${BOARD_CON_NOTAS.id} .board__file-icon`);
      if (await fileIcons.count() > 0) {
        const classList = await fileIcons.first().getAttribute('class');
        expect(classList).toMatch(/board__file-icon--(pdf|img)/);
      }
    });
  });

  test.describe('Independencia entre tablones', () => {
    test('#notesBoard y #sportsBoard leen fuentes distintas y no se afectan', async ({ page }) => {
      const eventos = BOARDS.find(x => x.page === 'eventos.html');
      const deportes = BOARDS.find(x => x.id === 'sportsBoard');

      for (const b of [deportes, eventos]) {
        await page.goto(`/${b.page}`);
        await page.waitForSelector(b.anyNote);
        expect(await page.locator(`#${b.id} article:not(.board__empty)`).count()).toBe(b.notas.length);
        expect(await page.locator(`#${b.id} .board__empty`).count()).toBe(b.vacio ? 1 : 0);
      }
    });
  });
});
