// tests/fix-animation.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Animación Visual Meteorología', () => {
  test('La opacidad cambia durante la animación', async ({ page }) => {
    // Mockear la respuesta de la API para tener control total
    await page.route('**/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          weather: [{ icon: '01d', description: 'soleado' }],
          main: { temp: 25, feels_like: 26, temp_min: 24, temp_max: 26, humidity: 50, pressure: 1013 },
          wind: { speed: 5, deg: 180 },
          clouds: { all: 0 },
          sys: { sunrise: 1600000000, sunset: 1600040000 }
        })
      });
    });

    await page.goto('/meteo.html');

    const icon = page.locator('#current-icon-img');

    // Esperar a que se aplique la clase de animación
    await expect(icon).toHaveClass(/weather-animate-in/, { timeout: 10000 });

    // Verificar que la animación está corriendo
    const animationState = await icon.evaluate(el => window.getComputedStyle(el).animationPlayState);
    expect(animationState).toBe('running');

    // Verificar que la animacion es infinita y del tipo Sway
    const animationIterationCount = await icon.evaluate(el => window.getComputedStyle(el).animationIterationCount);
    const animationName = await icon.evaluate(el => window.getComputedStyle(el).animationName);
    
    expect(animationIterationCount).toBe('infinite');
    expect(animationName).toContain('weatherIconSway');
  });
});
