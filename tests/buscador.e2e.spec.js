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
    for (const t of ['pagina', 'seccion', 'galeria', 'post', 'documento', 'formulario', 'legal', 'persona']) {
      expect(tipos.has(t), `tipo ${t}`).toBe(true);
    }
    // Eventos (v4.33.0): solo futuros, sin duplicados y con enlace al día; el tipo
    // aparece únicamente si eventos.json tiene actos futuros que no sean festivos
    const eventosJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'eventos.json'), 'utf8')).eventos;
    const futuros = eventosJson.filter((e) => e.category !== 'Festivo' && e.date >= INDEX.generado);
    const eventos = INDEX.registros.filter((r) => r.tipo === 'evento');
    expect(eventos.length > 0).toBe(futuros.length > 0);
    for (const e of eventos) {
      expect(e.fecha >= INDEX.generado, e.id).toBe(true);
      expect(e.url, e.id).toBe(`calendario.html?dia=${e.fecha}`);
    }
    expect(new Set(eventos.map((e) => `${e.titulo.es}|${e.fecha}`)).size).toBe(eventos.length);
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

  test('calidad del índice (v4.33.0): descripciones, VA real, personas, keywords', () => {
    const regs = INDEX.registros;
    // Ninguna descripción ES vacía
    for (const r of regs) expect(r.desc.es, `${r.id} sin descripción`).not.toBe('');
    // Título VA distinto del ES salvo personas, eventos (solo ES), documentos
    // (nombres propios de PDF) y títulos idénticos en ambas lenguas
    const iguales = new Set(['HOPE', 'Somni', 'Blog', 'La Falla', 'Organigrama de la Falla']);
    for (const r of regs) {
      if (['persona', 'evento', 'documento'].includes(r.tipo) || iguales.has(r.titulo.es)) continue;
      expect(r.titulo.va, `${r.id} sin título VA`).not.toBe(r.titulo.es);
    }
    // Sin títulos duplicados dentro del mismo tipo
    const claves = regs.map((r) => `${r.tipo}|${r.titulo.es}`);
    expect(new Set(claves).size).toBe(claves.length);
    // Personas desde schema-organization.json, con destino a Nosotros/Directiva/Organigrama
    const personas = regs.filter((r) => r.tipo === 'persona');
    expect(personas.length).toBeGreaterThanOrEqual(20);
    const lucia = personas.find((r) => r.id === 'per:lucia-gutierrez-martin');
    expect(lucia.titulo.es).toBe('Lucía Gutiérrez Martín');
    expect(lucia.url).toBe('lafalla.html#nosotros-fallera-mayor-lafalla');
    expect(lucia.desc.va).toBe('Fallera Major');
    for (const p of personas) expect(p.url, p.id).toMatch(/^(lafalla\.html#nosotros-|organigrama\.html$)/);
    // Todo id de search-keywords.json existe en el índice
    const kws = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'search-keywords.json'), 'utf8'));
    const ids = new Set(regs.map((r) => r.id));
    for (const id of Object.keys(kws)) if (!id.startsWith('$')) expect(ids.has(id), `keyword huérfana ${id}`).toBe(true);
    // Un solo registro por llibret y ejercicio
    expect(regs.filter((r) => /^llibret/i.test(r.titulo.es) && r.ejercicio === '2025-26').map((r) => r.id)).toEqual(['doc:llibret-2025-26-digital']);
    expect(ids.has('sec:llibrets-2025-26') || ids.has('doc:llibret-2025-26')).toBe(false);
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
      const f = path.join(DIST, file.replace(/\?.*$/, '') || 'index.html');
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

  test('calendario.html?dia=AAAA-MM-DD (destino de los eventos) filtra ese día', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calendario.html?dia=2026-02-22');
    await expect(page.locator('#filtro-fecha')).toHaveValue('2026-02-22');
    await expect(page.locator('#lista-anuncios')).toContainText('Crida de Valencia');
    await expect(page.locator('#lista-anuncios')).not.toContainText('Crida de La Punta');
  });

  test('v4.35.0: resaltado, combobox con ↑/↓ sin mover el foco, Enter abre el activo, anuncio con la consulta', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => { localStorage.setItem('cookieConsent', 'all'); });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    const input = page.locator('#siteSearchInput');
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    // El botón conserva su nombre visible («Buscar») también abierto (WCAG 2.5.3)
    await expect(page.locator('.header__search-toggle')).not.toHaveAttribute('aria-label', /.+/);
    await page.fill('#siteSearchInput', 'representantes 2025');
    await expect(page.locator('.buscador__cuerpo')).toHaveAttribute('data-estado', 'resultados');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#siteSearchLista')).toHaveAttribute('role', 'listbox');
    const primero = page.locator('.buscador__resultado').first();
    await expect(primero).toHaveAttribute('role', 'option');
    // Resaltado de las palabras que casan (con raíz: «Representantes» y «2025-26»)
    expect(await primero.locator('.buscador__titulo mark').count()).toBeGreaterThanOrEqual(2);
    await expect(primero.locator('.buscador__titulo mark').first()).toHaveText(/Representantes/);
    // Anuncio con recuento y consulta
    await expect(page.locator('.buscador__estado')).toContainText(/resultados para «representantes 2025»/);
    // ↓ activa la primera opción sin sacar el foco del campo
    await page.keyboard.press('ArrowDown');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-activedescendant', 'siteSearchOpcion1');
    await expect(primero).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'siteSearchOpcion2');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveAttribute('aria-activedescendant', 'siteSearchOpcion1');
    // Enter abre la opción activa
    const href = await primero.getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page.locator('#siteSearch')).toBeHidden();
    expect(page.url()).toContain(href.split('#')[0]);
  });

  test('v4.35.0: «Mostrar más» conserva el foco en el primer resultado nuevo; errata corregida visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => { localStorage.setItem('cookieConsent', 'all'); });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    await page.fill('#siteSearchInput', 'falla');
    const mas = page.locator('.buscador__mas');
    await expect(mas).toBeVisible();
    await mas.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#siteSearchOpcion11')).toBeFocused();
    expect(await page.locator('.buscador__resultado').count()).toBeGreaterThan(10);
    // Errata: «calendrio» → aviso de consulta corregida y resultado
    await page.fill('#siteSearchInput', 'calendrio');
    await expect(page.locator('.buscador__corregido')).toContainText('calendario');
    await expect(page.locator('.buscador__resultado').first().locator('.buscador__titulo')).toHaveText('Calendario');
  });

  test('v4.35.0: un hash malformado no rompe los acordeones de lafalla.html', async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(String(e)));
    await page.goto('/lafalla.html#%');
    const titular = page.locator('.accordion--representantes .accordion__titular').first();
    await titular.scrollIntoViewIfNeeded();
    await titular.click();
    await expect(titular).toHaveAttribute('aria-expanded', 'true');
    expect(errores.filter((e) => /URIError/.test(e))).toEqual([]);
  });

  test('v4.35.0: móvil, el panel limita su alto al viewport visual y encadena el scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('/index.html');
    await page.click('.header__search-toggle');
    const panel = page.locator('#siteSearch');
    const estilos = await panel.evaluate((el) => ({ overscroll: getComputedStyle(el).overscrollBehaviorY, maxH: parseFloat(getComputedStyle(el).maxHeight), rect: el.getBoundingClientRect().top }));
    expect(estilos.overscroll).toBe('contain');
    expect(estilos.maxH).toBeLessThanOrEqual(700 - estilos.rect);
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
