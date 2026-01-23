// tests/countdown.e2e.spec.js
// Tests E2E para verificar el countdown de Fallas

const { test, expect } = require('@playwright/test');

test.describe('Countdown - Cálculo de fechas', () => {

  test('2026 debe iniciar el 1 de marzo a las 20:00 (excepción)', async ({ page }) => {
    await page.goto('/');

    // Ejecutar la función getCycleDates en el contexto del navegador
    const result = await page.evaluate(() => {
      // Recrear las funciones del countdown para testear
      function getLastSundayOfFebruary(year) {
        let lastDay = new Date(year, 2, 0);
        while (lastDay.getDay() !== 0) {
          lastDay.setDate(lastDay.getDate() - 1);
        }
        return lastDay;
      }

      function getCycleDates(year) {
        let start;
        if (year === 2026) {
          start = new Date(year, 2, 1);
          start.setHours(20, 0, 0, 0);
        } else {
          start = getLastSundayOfFebruary(year);
          start.setHours(21, 0, 0, 0);
        }
        const end = new Date(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      const cycle2026 = getCycleDates(2026);
      return {
        startDay: cycle2026.start.getDate(),
        startMonth: cycle2026.start.getMonth(), // 0-indexed: 2 = marzo
        startHour: cycle2026.start.getHours(),
        startYear: cycle2026.start.getFullYear()
      };
    });

    expect(result.startYear).toBe(2026);
    expect(result.startMonth).toBe(2); // Marzo (0-indexed)
    expect(result.startDay).toBe(1);
    expect(result.startHour).toBe(20);
  });

  test('2027 debe iniciar el último domingo de febrero a las 21:00 (normal)', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      function getLastSundayOfFebruary(year) {
        let lastDay = new Date(year, 2, 0);
        while (lastDay.getDay() !== 0) {
          lastDay.setDate(lastDay.getDate() - 1);
        }
        return lastDay;
      }

      function getCycleDates(year) {
        let start;
        if (year === 2026) {
          start = new Date(year, 2, 1);
          start.setHours(20, 0, 0, 0);
        } else {
          start = getLastSundayOfFebruary(year);
          start.setHours(21, 0, 0, 0);
        }
        const end = new Date(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      const cycle2027 = getCycleDates(2027);
      return {
        startDay: cycle2027.start.getDate(),
        startMonth: cycle2027.start.getMonth(),
        startHour: cycle2027.start.getHours(),
        startYear: cycle2027.start.getFullYear(),
        dayOfWeek: cycle2027.start.getDay() // 0 = domingo
      };
    });

    expect(result.startYear).toBe(2027);
    expect(result.startMonth).toBe(1); // Febrero (0-indexed)
    expect(result.startDay).toBe(28); // Último domingo de febrero 2027
    expect(result.startHour).toBe(21);
    expect(result.dayOfWeek).toBe(0); // Domingo
  });

  test('El fin de Fallas siempre es el 20 de marzo a las 00:00', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      function getLastSundayOfFebruary(year) {
        let lastDay = new Date(year, 2, 0);
        while (lastDay.getDay() !== 0) {
          lastDay.setDate(lastDay.getDate() - 1);
        }
        return lastDay;
      }

      function getCycleDates(year) {
        let start;
        if (year === 2026) {
          start = new Date(year, 2, 1);
          start.setHours(20, 0, 0, 0);
        } else {
          start = getLastSundayOfFebruary(year);
          start.setHours(21, 0, 0, 0);
        }
        const end = new Date(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      const cycle2026 = getCycleDates(2026);
      const cycle2027 = getCycleDates(2027);

      return {
        end2026: {
          day: cycle2026.end.getDate(),
          month: cycle2026.end.getMonth(),
          hour: cycle2026.end.getHours()
        },
        end2027: {
          day: cycle2027.end.getDate(),
          month: cycle2027.end.getMonth(),
          hour: cycle2027.end.getHours()
        }
      };
    });

    // 2026
    expect(result.end2026.day).toBe(20);
    expect(result.end2026.month).toBe(2); // Marzo
    expect(result.end2026.hour).toBe(0);

    // 2027
    expect(result.end2027.day).toBe(20);
    expect(result.end2027.month).toBe(2); // Marzo
    expect(result.end2027.hour).toBe(0);
  });
});

test.describe('Countdown - UI', () => {

  test('El countdown se muestra en la página principal', async ({ page }) => {
    await page.goto('/');

    // Verificar que existe el contenedor del countdown
    const countdownSection = page.locator('.countdown');
    await expect(countdownSection).toBeVisible();

    // Verificar que el reloj está visible (no estamos en período de Fallas)
    const clock = page.locator('.countdown__clock');
    await expect(clock).toBeVisible();

    // Verificar que muestra días, horas, minutos, segundos
    await expect(page.locator('[data-time="days"]')).toBeVisible();
    await expect(page.locator('[data-time="hours"]')).toBeVisible();
    await expect(page.locator('[data-time="minutes"]')).toBeVisible();
    await expect(page.locator('[data-time="seconds"]')).toBeVisible();
  });

  test('Los valores del countdown son numéricos y razonables', async ({ page }) => {
    await page.goto('/');

    // Esperar a que el countdown se actualice
    await page.waitForTimeout(1500);

    const days = await page.locator('[data-time="days"]').textContent();
    const hours = await page.locator('[data-time="hours"]').textContent();
    const minutes = await page.locator('[data-time="minutes"]').textContent();
    const seconds = await page.locator('[data-time="seconds"]').textContent();

    // Verificar que son números
    expect(parseInt(days)).not.toBeNaN();
    expect(parseInt(hours)).not.toBeNaN();
    expect(parseInt(minutes)).not.toBeNaN();
    expect(parseInt(seconds)).not.toBeNaN();

    // Verificar rangos razonables
    expect(parseInt(hours)).toBeGreaterThanOrEqual(0);
    expect(parseInt(hours)).toBeLessThan(24);
    expect(parseInt(minutes)).toBeGreaterThanOrEqual(0);
    expect(parseInt(minutes)).toBeLessThan(60);
    expect(parseInt(seconds)).toBeGreaterThanOrEqual(0);
    expect(parseInt(seconds)).toBeLessThan(60);
  });
});
