const { test, expect } = require('@playwright/test');

function parseTimeMs(value) {
  const v = String(value).trim();
  if (!v) return 0;
  if (v.endsWith('ms')) return Number.parseFloat(v);
  if (v.endsWith('s')) return Number.parseFloat(v) * 1000;
  // Fallback (should not happen, but be defensive)
  const asNum = Number.parseFloat(v);
  return Number.isFinite(asNum) ? asNum : 0;
}

function splitList(value) {
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickTransitionForProperty(computed, propertyName) {
  const properties = splitList(computed.transitionProperty);
  const durations = splitList(computed.transitionDuration);
  const delays = splitList(computed.transitionDelay);

  // CSS rule: if lists have different lengths, they repeat.
  const length = Math.max(properties.length, durations.length, delays.length, 1);
  const at = (arr, i) => arr.length ? arr[i % arr.length] : '0s';

  const target = String(propertyName).toLowerCase();

  // Exact match first
  for (let i = 0; i < length; i++) {
    const prop = String(at(properties, i)).toLowerCase();
    if (prop === target) {
      return {
        durationMs: parseTimeMs(at(durations, i)),
        delayMs: parseTimeMs(at(delays, i))
      };
    }
  }

  // If `all` is present, it applies to background-color too
  for (let i = 0; i < length; i++) {
    const prop = String(at(properties, i)).toLowerCase();
    if (prop === 'all') {
      return {
        durationMs: parseTimeMs(at(durations, i)),
        delayMs: parseTimeMs(at(delays, i))
      };
    }
  }

  // Not found → treat as no transition.
  return { durationMs: 0, delayMs: 0 };
}

test.describe('UI: transición nav principal', () => {
  test('desktop: background-color de enlaces es más lenta (sin delay)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    const link = page.locator('nav.navegacion .navegacion__enlace').first();
    await expect(link).toBeVisible();

    const computed = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        transitionProperty: cs.transitionProperty,
        transitionDuration: cs.transitionDuration,
        transitionDelay: cs.transitionDelay
      };
    });

    const { durationMs, delayMs } = pickTransitionForProperty(computed, 'background-color');

    // Buscamos una transición perceptible (más lenta que antes), pero sin volver a valores largos (p.ej. 2.4s).
    expect(durationMs).toBeGreaterThanOrEqual(150);
    expect(durationMs).toBeLessThanOrEqual(400);
    expect(delayMs).toBeLessThanOrEqual(0);
  });
});
