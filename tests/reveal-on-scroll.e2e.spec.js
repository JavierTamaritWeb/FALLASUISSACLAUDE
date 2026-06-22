const { test, expect } = require('@playwright/test');

async function getRevealState(locator) {
  return locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      opacity: styles.opacity,
      ready: element.classList.contains('reveal-ready'),
      visible: element.classList.contains('is-visible')
    };
  });
}

async function expectReveal(locator, expectedVisible) {
  await expect.poll(async () => {
    const state = await getRevealState(locator);
    return `${state.ready}:${state.visible}`;
  }).toBe(`true:${expectedVisible}`);
}

test.describe('Reveal on scroll global', () => {
  test('index.html reactiva el reveal al salir y reentrar en viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');

    const blogCard = page.locator('.blog__post').first();

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expectReveal(blogCard, false);

    await blogCard.scrollIntoViewIfNeeded();
    await expectReveal(blogCard, true);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expectReveal(blogCard, false);

    await blogCard.scrollIntoViewIfNeeded();
    await expectReveal(blogCard, true);
  });

  test('eventos.html reaplica reveal al empty-state del tablón tras rerender por idioma', async ({ page }) => {
    // El tablón de Eventos se sirve vacío: el empty-state (.board__empty) hereda
    // las clases reveal reveal--soft, así que debe revelarse y volver a registrarse
    // en scroll-reveal tras el re-render por cambio de idioma, igual que una nota.
    await page.setViewportSize({ width: 1280, height: 640 });
    await page.goto('/eventos.html');

    const emptyState = page.locator('#notesBoard .board__empty');
    await expect(emptyState).toBeAttached();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expectReveal(emptyState, false);

    await emptyState.scrollIntoViewIfNeeded();
    await expectReveal(emptyState, true);

    await page.locator('#langSwitcher').click();
    await page.locator('.header__lang-option[data-lang="va"]').click();

    const rerenderedEmpty = page.locator('#notesBoard .board__empty');
    await expect(rerenderedEmpty).toBeAttached();
    await expect.poll(async () => {
      const className = await rerenderedEmpty.getAttribute('class');
      return className || '';
    }).toContain('reveal');

    await rerenderedEmpty.scrollIntoViewIfNeeded();
    await expectReveal(rerenderedEmpty, true);
  });

  test('calendario.html vuelve a registrar tarjetas tras filtrar y limpiar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/calendario.html');

    await expect.poll(async () => {
      return page.locator('#lista-anuncios .calendario-eventos__item').count();
    }).toBeGreaterThan(0);

    const firstEvent = page.locator('#lista-anuncios .calendario-eventos__item').first();
    await expectReveal(firstEvent, false);

    await firstEvent.scrollIntoViewIfNeeded();
    await expectReveal(firstEvent, true);

    await page.fill('#filtro-busqueda', 'zzzzzzzz');
    await expect.poll(async () => {
      return page.locator('#lista-anuncios .calendario-eventos__item').count();
    }).toBe(0);
    await expect(page.locator('#lista-anuncios p.reveal')).toBeVisible();

    await page.fill('#filtro-busqueda', '');

    await expect.poll(async () => {
      return page.locator('#lista-anuncios .calendario-eventos__item').count();
    }).toBeGreaterThan(0);

    const refreshedEvent = page.locator('#lista-anuncios .calendario-eventos__item').first();
    await expect.poll(async () => {
      const className = await refreshedEvent.getAttribute('class');
      return className || '';
    }).toContain('reveal');

    await refreshedEvent.scrollIntoViewIfNeeded();
    await expectReveal(refreshedEvent, true);
  });

  test('prefers-reduced-motion evita el estado oculto persistente', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/blog.html');

    const blogCard = page.locator('.blog__post').first();
    await expect(blogCard).toBeVisible();

    await expect.poll(async () => {
      const state = await getRevealState(blogCard);
      return `${state.ready}:${state.visible}:${state.opacity}`;
    }).toBe('true:true:1');
  });

  test('meteo.html excluye forecast-day pero prepara sus wrappers', async ({ page }) => {
    await page.goto('/meteo.html');

    const currentWeather = page.locator('.weather-current');
    const forecastWrapper = page.locator('.weather-forecast');
    const forecastDay = page.locator('.forecast-day').first();

    await expectReveal(currentWeather, true);

  await forecastWrapper.scrollIntoViewIfNeeded();
    await expectReveal(forecastWrapper, true);

    const forecastDayClass = await forecastDay.getAttribute('class');
    expect(forecastDayClass || '').not.toContain('reveal');
    expect(forecastDayClass || '').not.toContain('reveal-ready');
    expect(forecastDayClass || '').not.toContain('is-visible');
  });
});