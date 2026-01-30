const { test, expect } = require('@playwright/test');

test.describe('Animaciones Metereológicas', () => {
    
  test.beforeEach(async ({ page }) => {
    // 1. Mock de la configuración
    await page.route('**/data/config.json', async route => {
      const json = {
        openWeather: { city: "Valencia,ES", apiKey: "test-key" }
      };
      await route.fulfill({ json });
    });

    // 2. Mock de la respuesta de la API del clima
    await page.route('https://api.openweathermap.org/data/2.5/weather*', async route => {
      const json = {
        weather: [{ icon: '01d', description: 'Cielo despejado' }],
        main: { temp: 20, feels_like: 20, temp_min: 15, temp_max: 25, humidity: 50 },
        wind: { speed: 10 },
        clouds: { all: 0 },
        sys: { sunset: Date.now() / 1000 + 10000 }
      };
      await route.fulfill({ json });
    });
    
    // 3. Mock de la respuesta de forecast (para evitar errores 404 en consola)
    await page.route('https://api.openweathermap.org/data/2.5/forecast*', async route => {
      await route.fulfill({ json: { list: [] } });
    });
  });

  test('El icono del clima tiene la animación de vaivén y tamaño correcto', async ({ page }) => {
    // Ir a la página
    await page.goto('/meteo.html');

    // Localizar el icono
    const icon = page.locator('#current-icon-img');

    // Esperar a que el icono se cargue y tenga la clase de animación
    await expect(icon).toHaveClass(/weather-animate-in/);

    // Validar propiedades CSS computadas de la animación
    // animation-name debe incluir weatherIconFade y weatherIconSway
    const animName = await icon.evaluate(el => getComputedStyle(el).animationName);
    expect(animName).toContain('weatherIconFade');
    expect(animName).toContain('weatherIconSway');

    // animation-duration debe ser 1s (fade) y 4s (sway)
    const animDuration = await icon.evaluate(el => getComputedStyle(el).animationDuration);
    // El orden depende del navegador, verificamos que contenga ambos strings
    expect(animDuration).toContain('1s');
    expect(animDuration).toContain('4s');
    
    // Verificamos que la animación es infinita para el sway (es más difícil de ver en una sola string computada 
    // si el browser las fusiona, pero suele ser "1s, 4s" y "1, infinite")
    const animIteration = await icon.evaluate(el => getComputedStyle(el).animationIterationCount);
    expect(animIteration).toMatch(/infinite/); 
  });

  test('El keyframe weatherIconSway utiliza transformaciones horizontales (smooth)', async ({ page }) => {
    await page.goto('/meteo.html');
    
    // Recuperar las reglas CSS para verificar que el keyframe específico existe y usa translateX
    // Esto es una validación "caja blanca" leyendo los estilos inyectados
    const cssRules = await page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        // Buscar hoja de estilos main.css (o inline si está concatenado)
        for (const sheet of styleSheets) {
            try {
                const rules = Array.from(sheet.cssRules || []);
                const swayRule = rules.find(r => r.type === CSSRule.KEYFRAMES_RULE && r.name === 'weatherIconSway');
                if (swayRule) {
                    return Array.from(swayRule.cssRules).map(r => r.cssText);
                }
            } catch (e) {
                // Ignore cross-origin issues
            }
        }
        return null;
    });

    expect(cssRules).not.toBeNull();
    // Verificamos que contenga translateX
    const rulesStr = cssRules.join(' ');
    expect(rulesStr).toContain('translateX');
    // Verificamos que NO contenga rotate (ya que lo cambiamos)
    expect(rulesStr).not.toContain('rotate');
  });

});
