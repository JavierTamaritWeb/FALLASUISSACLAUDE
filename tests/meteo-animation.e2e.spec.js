// tests/meteo-animation.e2e.spec.js
// Verifica animación del icono meteo

const { test, expect } = require('@playwright/test');
const { buildForecastList, mockWeatherApi } = require('./helpers/deterministic-env');

test.describe('Animación icono meteo', () => {
  test('aplica animate-icon y dispara la animación', async ({ page }) => {
    await mockWeatherApi(page, {
      currentWeather: {
        weather: [{ icon: '03d', description: 'nubes dispersas' }],
        main: {
          temp: 20,
          feels_like: 19,
          temp_min: 18,
          temp_max: 22,
          humidity: 55,
          pressure: 1012
        },
        clouds: { all: 40 },
        visibility: 10000,
        wind: { speed: 2, deg: 90 },
        rain: null,
        snow: null,
        sys: {
          sunrise: 1706590000,
          sunset: 1706628000
        }
      },
      forecastList: buildForecastList(40).map((item) => ({
        ...item,
        weather: [{ icon: '03d', description: 'nubes dispersas' }],
        clouds: { all: 40 }
      }))
    });

    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');
    
    // Wait for the icon to have the new animation class
    // We increase timeout safely in case load takes a moment
    await expect(icon).toHaveClass(/weather-animate-in/, { timeout: 10000 });

    const animationNames = await icon.evaluate((el) => getComputedStyle(el).animationName.split(',').map((value) => value.trim()));
    const animationDurations = await icon.evaluate((el) => getComputedStyle(el).animationDuration.split(',').map((value) => value.trim()));
    const animationPlayStates = await icon.evaluate((el) => getComputedStyle(el).animationPlayState.split(',').map((value) => value.trim()));

    // Verify the specific local animation is applied
    expect(animationNames).toContain('weatherIconSway');
    expect(animationDurations.some((value) => value !== '0s')).toBe(true);
    expect(animationPlayStates.every((value) => value === 'running')).toBe(true);
  });
});
