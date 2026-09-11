// tests/buscador.e2e.spec.js
// Buscador general (v4.29.0): índice generado por el build (dist/data/search-index.json
// + <meta name="search-index"> en cada página), panel desplegable creado por
// js/buscador.js, teclado/foco, ES/VA y apertura de acordeones por hash (acc.js).

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const INDEX = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'search-index.json'), 'utf8'));

test.describe('buscador — índice y meta generados por el build', () => {
  test('el índice tiene registros de todos los tipos y sin contenido de prueba', () => {
    const tipos = new Set(INDEX.registros.map((r) => r.tipo));
    for (const t of ['pagina', 'seccion', 'galeria', 'post', 'evento', 'documento', 'formulario', 'legal']) {
      expect(tipos.has(t), `tipo ${t}`).toBe(true);
    }
    const ids = INDEX.registros.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const excluido of ['evt:23', 'evt:24', 'evt:25', 'evt:48', 'evt:49', 'page:ai-info', 'page:base', 'page:mantenimiento', 'page:llibret_2026']) {
      expect(ids).not.toContain(excluido);
    }
    expect(INDEX.registros.some((r) => r.tipo === 'evento' && /festivo/i.test(r.titulo.es))).toBe(false);
    // Bilingüe: las galerías llevan título VA distinto del ES
    const g6 = INDEX.registros.find((r) => r.id === 'gal:6');
    expect(g6.titulo.va).toBe('Cremà 2025-26');
    const cal = INDEX.registros.find((r) => r.id === 'page:calendario');
    expect(cal.titulo.va).toBe('Calendari');
    // Tamaño acotado
    expect(fs.statSync(path.join(DIST, 'data', 'search-index.json')).size).toBeLessThan(120 * 1024);
  });

  test('todas las páginas ES y /va/ llevan la meta search-index con hash y el script', () => {
    const paginas = fs.readdirSync(DIST).filter((f) => /\.html$/.test(f) && !/^(ai-info|base|mantenimiento|google)/.test(f) && f !== 'llibret_2026.html');
    expect(paginas.length).toBeGreaterThanOrEqual(29);
    for (const f of paginas) {
      for (const rel of [f, path.join('va', f)]) {
        const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
        expect(html, rel).toMatch(/<meta name="search-index" content="data\/search-index\.json\?v=[0-9a-f]{12}">/);
        expect(html, rel).toMatch(/<script src="(?:\.\.\/)?js\/buscador\.js\?v=[0-9a-f]+" defer><\/script>/);
      }
    }
  });

  test('los destinos con ancla existen en dist/', () => {
    for (const r of INDEX.registros) {
      const [file, hash] = r.url.split('#');
      const f = path.join(DIST, file || 'index.html');
      expect(fs.existsSync(f), r.url).toBe(true);
      if (hash) expect(fs.readFileSync(f, 'utf8'), r.url).toContain(`id="${hash}"`);
    }
  });
});

test.describe('buscador — panel en el navegador', () => {
  test('desktop: botón visible, panel cerrado, «calendari» con interfaz ES muestra «Calendario»', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    const toggle = page.locator('.header__search-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toContainText(/Buscar/);
    await expect(page.locator('#siteSearch')).toBeHidden();

    await toggle.click();
    await expect(page.locator('#siteSearch')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#siteSearchInput')).toBeFocused();
    // Estado inicial con ejemplos
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'inicial');
    await expect(page.locator('.buscador__ejemplo').first()).toBeVisible();

    await page.fill('#siteSearchInput', 'calendari');
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'resultados');
    const primero = page.locator('.buscador__resultado').first();
    await expect(primero.locator('.buscador__titulo')).toHaveText('Calendario');
    await expect(primero).toHaveAttribute('href', /\/calendario\.html$/);
    // Un solo resultado por página lógica (no duplica ES/VA)
    expect(await page.locator('.buscador__titulo', { hasText: /^Calendario$/ }).count()).toBe(1);
    // El estado accesible anuncia el recuento
    await expect(page.locator('.buscador__estado')).toContainText(/resultado/);
  });

  test('teclado: Escape cierra y devuelve el foco al botón; el menú y el buscador son excluyentes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/eventos.html');
    await page.locator('.header__search-toggle').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#siteSearch')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#siteSearch')).toBeHidden();
    await expect(page.locator('.header__search-toggle')).toBeFocused();

    // Abrir el buscador cierra el menú
    await page.click('.header__menu-toggle');
    await expect(page.locator('nav.navegacion')).toBeVisible();
    await page.click('.header__search-toggle');
    await expect(page.locator('#siteSearch')).toBeVisible();
    await expect(page.locator('nav.navegacion')).toBeHidden();
    // Y abrir el menú cierra el buscador
    await page.click('.header__menu-toggle');
    await expect(page.locator('nav.navegacion')).toBeVisible();
    await expect(page.locator('#siteSearch')).toBeHidden();
  });

  test('sin coincidencias y consulta corta: estados diferenciados', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    await page.fill('#siteSearchInput', 'x');
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'minimo');
    await page.fill('#siteSearchInput', 'xyz123');
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'vacio');
    await expect(page.locator('.buscador__cuerpo')).toContainText('Sin coincidencias');
    await expect(page.locator('.buscador__ejemplo').first()).toBeVisible();
    // Sin errores de consola
  });

  test('las sugerencias y «Mostrar más» repintan el cuerpo sin cerrar el panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // El banner de cookies tapa el pie del panel (donde va «Mostrar más»)
    await page.addInitScript(() => { localStorage.setItem('cookieConsent', 'all'); });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    const panel = page.locator('#siteSearch');
    const cuerpo = page.locator('.buscador__cuerpo');
    await expect(panel).toBeVisible();

    // Sugerencia: el botón pulsado desaparece al repintar; el panel debe seguir abierto
    const sugerencia = page.locator('.buscador__ejemplo', { hasText: 'autorización menores' });
    await sugerencia.click();
    await expect(cuerpo).toHaveAttribute('data-estado', 'resultados');
    await expect(panel).toBeVisible();
    await expect(page.locator('#siteSearchInput')).toHaveValue('autorización menores');
    await expect(page.locator('#siteSearchInput')).toBeFocused();

    // «Mostrar más»: consulta con más de 10 resultados
    await page.fill('#siteSearchInput', 'falla');
    const mas = page.locator('.buscador__mas');
    await expect(mas).toBeVisible();
    const antes = await page.locator('.buscador__resultado').count();
    expect(antes).toBe(10);
    const pendientesAntes = await mas.textContent();
    await mas.click();
    await expect(mas).not.toHaveText(pendientesAntes);
    await expect(panel).toBeVisible();
    expect(await page.locator('.buscador__resultado').count()).toBeGreaterThan(antes);

    // Elegir un resultado sí cierra el panel y navega
    const primero = page.locator('.buscador__resultado').first();
    const href = await primero.getAttribute('href');
    await primero.click();
    await expect(panel).toBeHidden();
    expect(page.url()).toContain(href.replace(/^\.\//, '').split('#')[0]);
  });

  test('dos aspas con papeles distintos: borrar solo con texto y sin cerrar; cerrar sin círculo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => { localStorage.setItem('cookieConsent', 'all'); });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    const panel = page.locator('#siteSearch');
    const input = page.locator('#siteSearchInput');
    const borrar = page.locator('.buscador__borrar');
    const cerrar = page.locator('.buscador__cerrar');
    await expect(panel).toBeVisible();

    // Con el campo vacío solo hay un aspa: la de cerrar (el `display` de autor no debe pisar `[hidden]`)
    await expect(cerrar).toBeVisible();
    await expect(cerrar).toHaveAttribute('aria-label', 'Cerrar buscador');
    await expect(borrar).toBeHidden();
    expect(await borrar.evaluate((el) => getComputedStyle(el).display)).toBe('none');
    // Sin círculo ni borde: solo el aspa dibujada con pseudoelementos
    expect(await cerrar.evaluate((el) => {
      const s = getComputedStyle(el);
      const antes = getComputedStyle(el, '::before');
      return { bg: s.backgroundColor, border: s.borderStyle, aspa: antes.content, alto: antes.height };
    })).toEqual({ bg: 'rgba(0, 0, 0, 0)', border: 'none', aspa: '""', alto: '2px' });

    // Con texto aparece el aspa dentro del campo, a la derecha y sin que el texto la invada
    await page.fill('#siteSearchInput', 'autorización menores');
    await expect(borrar).toBeVisible();
    await expect(borrar).toHaveAttribute('aria-label', 'Borrar la búsqueda');
    const [ri, rb, padRight] = await Promise.all([
      input.boundingBox(), borrar.boundingBox(),
      input.evaluate((el) => parseFloat(getComputedStyle(el).paddingRight)),
    ]);
    expect(rb.x).toBeGreaterThan(ri.x + ri.width / 2);
    expect(rb.x + rb.width).toBeLessThanOrEqual(ri.x + ri.width + 1);
    expect(Math.abs((rb.y + rb.height / 2) - (ri.y + ri.height / 2))).toBeLessThan(2);
    expect(padRight).toBeGreaterThanOrEqual(rb.width - 8);

    // Borrar conserva el panel abierto y el cursor en el campo
    await borrar.click();
    await expect(panel).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(borrar).toBeHidden();
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'inicial');

    // Foco del campo: un solo anillo claro (sin el borde coral acumulado)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    const foco = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineColor, borde: s.borderTopColor, sombra: s.boxShadow };
    });
    expect(foco.outline).toBe('rgb(245, 245, 245)');
    expect(foco.borde).toBe('rgba(0, 0, 0, 0)');
    expect(foco.sombra).toContain('rgba(0, 0, 0, 0.45)');

    // Cerrar cierra todo el buscador
    await cerrar.click();
    await expect(panel).toBeHidden();
  });

  test('/va/: textos en valenciano, resultado en VA y destino bajo /va/', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => { try { localStorage.removeItem('lang'); } catch (e) { /* noop */ } });
    await page.goto('/va/lafalla.html');
    const toggle = page.locator('.header__search-toggle');
    await expect(toggle).toContainText(/Cercar/);
    await toggle.click();
    await expect(page.locator('.buscador__etiqueta')).toHaveText('Cercar en la web');
    await page.fill('#siteSearchInput', 'cremà');
    const primero = page.locator('.buscador__resultado').first();
    await expect(primero.locator('.buscador__titulo')).toHaveText('Cremà 2025-26');
    await expect(primero).toHaveAttribute('href', /\/va\/galeria_6\.html$/);
  });

  test('deep link: lafalla.html#ofrenda-2026-lafalla abre el panel de Archivos', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/lafalla.html#ofrenda-2026-lafalla');
    const content = page.locator('#ofrenda-2026-lafalla');
    await expect.poll(async () => content.evaluate((el) => el.closest('.accordion__section').classList.contains('active')), { timeout: 5000 }).toBe(true);
    await expect.poll(async () => content.evaluate((el) => el.getBoundingClientRect().height), { timeout: 5000 }).toBeGreaterThan(50);
  });

  test('la consulta se conserva al reabrir el panel en la misma pestaña', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    await page.fill('#siteSearchInput', 'organigrama');
    await expect(page.locator('.buscador__resultado').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.click('.header__search-toggle');
    await expect(page.locator('#siteSearchInput')).toHaveValue('organigrama');
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'resultados');
  });
});
