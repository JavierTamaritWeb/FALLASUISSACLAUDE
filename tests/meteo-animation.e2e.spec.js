// tests/meteo-animation.e2e.spec.js
// Verifica animación del icono meteo

const { test, expect } = require('@playwright/test');

function buildForecastList(count) {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, i) => ({
    dt: now + i * 3 * 60 * 60,
    main: {
      temp: 20,
      temp_min: 18,
      temp_max: 22
    },
    weather: [
      {
        icon: '03d',
        description: 'nubes dispersas'
      }
    ],
    wind: { speed: 2, deg: 90 },
    clouds: { all: 40 }
  }));
}

test.describe('Animación icono meteo', () => {
  test('aplica animate-icon y dispara la animación', async ({ page }) => {
    await page.route('**/data/config.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          openWeather: {
            city: 'Valencia',
            apiKey: 'test-key'
          }
        })
      });
    });

    await page.route('https://api.openweathermap.org/data/2.5/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        })
      });
    });

    await page.route('https://api.openweathermap.org/data/2.5/forecast**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          list: buildForecastList(40)
        })
      });
    });

    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');
    
    // Wait for the icon to have the new animation class
    // We increase timeout safely in case load takes a moment
    await expect(icon).toHaveClass(/weather-animate-in/, { timeout: 10000 });

    const animationName = await icon.evaluate((el) => getComputedStyle(el).animationName);
    const animationDuration = await icon.evaluate((el) => getComputedStyle(el).animationDuration);
    const animationPlayState = await icon.evaluate((el) => getComputedStyle(el).animationPlayState);

    // Verify the specific local animation is applied
    expect(animationName).toContain('weatherIconSway');
    expect(animationDuration).not.toBe('0s');
    expect(animationPlayState).toBe('running');
  });
});
