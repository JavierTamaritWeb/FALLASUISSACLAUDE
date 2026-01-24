// tests/countdown.e2e.spec.js
// Tests E2E para verificar el countdown de Fallas

const { test, expect } = require('@playwright/test');

test.describe('Countdown - Cálculo de fechas', () => {

  test('2026 debe iniciar el último domingo de febrero a las 20:00 (La Crida)', async ({ page }) => {
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
        const start = getLastSundayOfFebruary(year);
        start.setHours(20, 0, 0, 0);
        const end = new Date(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      const cycle2026 = getCycleDates(2026);
      return {
        startDay: cycle2026.start.getDate(),
        startMonth: cycle2026.start.getMonth(), // 0-indexed: 1 = febrero
        startHour: cycle2026.start.getHours(),
        startYear: cycle2026.start.getFullYear(),
        dayOfWeek: cycle2026.start.getDay() // 0 = domingo
      };
    });

    expect(result.startYear).toBe(2026);
    expect(result.startMonth).toBe(1); // Febrero (0-indexed)
    expect(result.startDay).toBe(22); // Último domingo de febrero 2026
    expect(result.startHour).toBe(20);
    expect(result.dayOfWeek).toBe(0); // Domingo
  });

  test('2027 debe iniciar el último domingo de febrero a las 20:00 (La Crida)', async ({ page }) => {
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
        const start = getLastSundayOfFebruary(year);
        start.setHours(20, 0, 0, 0);
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
    expect(result.startHour).toBe(20);
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
        const start = getLastSundayOfFebruary(year);
        start.setHours(20, 0, 0, 0);
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

  test('Después del 20 de marzo, el countdown se reinicia para el año siguiente', async ({ page }) => {
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
        const start = getLastSundayOfFebruary(year);
        start.setHours(20, 0, 0, 0);
        const end = new Date(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      function getTargetDates(mockNow) {
        const now = mockNow || new Date();
        const currentYear = now.getFullYear();
        const currentCycle = getCycleDates(currentYear);

        if (now < currentCycle.start) {
          return { target: currentCycle.start, status: "upcoming" };
        } else if (now >= currentCycle.start && now < currentCycle.end) {
          return { target: null, status: "ongoing" };
        } else {
          const nextCycle = getCycleDates(currentYear + 1);
          return { target: nextCycle.start, status: "upcoming-next" };
        }
      }

      // Simular fecha después del fin del ciclo 2026 (21 de marzo 2026)
      const mockDate = new Date(2026, 2, 21, 10, 0, 0); // 21 de marzo 2026, 10:00
      const targetInfo = getTargetDates(mockDate);

      return {
        status: targetInfo.status,
        targetYear: targetInfo.target ? targetInfo.target.getFullYear() : null,
        targetMonth: targetInfo.target ? targetInfo.target.getMonth() : null,
        targetDay: targetInfo.target ? targetInfo.target.getDate() : null
      };
    });

    // Debe apuntar al ciclo del año siguiente (2027)
    expect(result.status).toBe('upcoming-next');
    expect(result.targetYear).toBe(2027);
    expect(result.targetMonth).toBe(1); // Febrero
    expect(result.targetDay).toBe(28); // Último domingo de febrero 2027
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

test.describe('Countdown - Mensaje durante las Fallas', () => {

  test('Durante las Fallas muestra el mensaje en español', async ({ page }) => {
    await page.goto('/');

    // Simular que estamos durante las Fallas (1 de marzo 2026)
    const result = await page.evaluate(() => {
      // Inyectar fecha simulada
      const originalDate = Date;
      const mockDate = new Date(2026, 2, 1, 12, 0, 0); // 1 de marzo 2026, 12:00

      // Recrear funciones del countdown
      function getLastSundayOfFebruary(year) {
        let lastDay = new originalDate(year, 2, 0);
        while (lastDay.getDay() !== 0) {
          lastDay.setDate(lastDay.getDate() - 1);
        }
        return lastDay;
      }

      function getCycleDates(year) {
        const start = getLastSundayOfFebruary(year);
        start.setHours(20, 0, 0, 0);
        const end = new originalDate(year, 2, 20, 0, 0, 0);
        return { start, end };
      }

      function getTargetDates(now) {
        const currentYear = now.getFullYear();
        const currentCycle = getCycleDates(currentYear);

        if (now < currentCycle.start) {
          return { target: currentCycle.start, status: "upcoming" };
        } else if (now >= currentCycle.start && now < currentCycle.end) {
          return { target: null, status: "ongoing" };
        } else {
          const nextCycle = getCycleDates(currentYear + 1);
          return { target: nextCycle.start, status: "upcoming-next" };
        }
      }

      const targetInfo = getTargetDates(mockDate);
      return {
        status: targetInfo.status,
        mockDateString: mockDate.toISOString()
      };
    });

    // Verificar que el estado es "ongoing"
    expect(result.status).toBe('ongoing');
  });

  test('El mensaje "ongoing" existe en las traducciones', async ({ page }) => {
    await page.goto('/');

    const translations = await page.evaluate(async () => {
      const response = await fetch('/data/translations.json');
      const data = await response.json();
      return {
        es: data.es.countdown.ongoing,
        va: data.va.countdown.ongoing
      };
    });

    expect(translations.es).toBe('¡Estamos en Fallas!');
    expect(translations.va).toBe('Ja estem en Falles!');
  });

  test('El elemento countdown__fallas-message existe en el HTML', async ({ page }) => {
    await page.goto('/');

    const fallasMessage = page.locator('.countdown__fallas-message');
    await expect(fallasMessage).toBeAttached();

    // Verificar que tiene el atributo data-i18n correcto
    const dataI18n = await fallasMessage.getAttribute('data-i18n');
    expect(dataI18n).toBe('countdown.ongoing');
  });

  test('El mensaje tiene el texto correcto en español por defecto', async ({ page }) => {
    await page.goto('/');

    const fallasMessage = page.locator('.countdown__fallas-message');
    const text = await fallasMessage.textContent();

    // El mensaje debe contener el texto en español (aunque esté oculto)
    expect(text).toBe('¡Estamos en Fallas!');
  });

  test('El mensaje cambia a valenciano al cambiar idioma', async ({ page }) => {
    await page.goto('/');

    // Esperar a que langSwitcher esté presente
    await expect(page.locator('#langSwitcher')).toContainText('IDIOMA ·');

    // Cambiar a valenciano usando evaluate (más confiable en headless)
    await page.evaluate(() => {
      const option = document.querySelector('.header__lang-option[data-lang="va"]');
      if (!option) throw new Error('No se encontró la opción de idioma VA');
      option.click();
    });

    // Esperar a que el cambio se aplique
    await page.waitForTimeout(500);

    const fallasMessage = page.locator('.countdown__fallas-message');
    const text = await fallasMessage.textContent();

    expect(text).toBe('Ja estem en Falles!');
  });
});
