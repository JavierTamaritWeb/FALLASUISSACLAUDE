// tests/fix-animation.spec.js
const { test, expect } = require('@playwright/test');
const { mockWeatherApi } = require('./helpers/deterministic-env');

test.describe('Animación Visual Meteorología', () => {
  test('La opacidad cambia durante la animación', async ({ page }) => {
    await mockWeatherApi(page, {
      currentWeather: {
        weather: [{ icon: '01d', description: 'soleado' }],
        main: { temp: 25, feels_like: 26, temp_min: 24, temp_max: 26, humidity: 50, pressure: 1013 },
        wind: { speed: 5, deg: 180 },
        clouds: { all: 0 },
        visibility: 10000,
        sys: { sunrise: 1600000000, sunset: 1600040000 }
      }
    });

    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');

    // Esperar a que se aplique la clase de animación
    await expect(icon).toHaveClass(/weather-animate-in/, { timeout: 10000 });

    // Verificar que la animación está corriendo
    const animationStates = await icon.evaluate((el) => window.getComputedStyle(el).animationPlayState.split(',').map((value) => value.trim()));
    expect(animationStates.every((value) => value === 'running')).toBe(true);

    // Verificar que la animacion es infinita y del tipo Sway
    const animationIterationCounts = await icon.evaluate((el) => window.getComputedStyle(el).animationIterationCount.split(',').map((value) => value.trim()));
    const animationNames = await icon.evaluate((el) => window.getComputedStyle(el).animationName.split(',').map((value) => value.trim()));

    expect(animationIterationCounts).toContain('infinite');
    expect(animationNames).toContain('weatherIconSway');
  });
});
