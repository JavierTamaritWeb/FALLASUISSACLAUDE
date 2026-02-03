// tests/meteo-falleret.e2e.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Meteo Falleret Image', () => {
    
    // Mock data para Lluvia (Rain)
    const rainMock = {
        coord: { lon: -0.3774, lat: 39.4698 },
        weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
        base: "stations",
        main: { temp: 15, feels_like: 14, temp_min: 14, temp_max: 16, humidity: 80, pressure: 1012 },
        visibility: 10000,
        wind: { speed: 5, deg: 200 },
        rain: { "1h": 2.5 }, // Lluvia en la última hora
        clouds: { all: 90 },
        dt: 1600000000,
        sys: { type: 1, id: 6421, country: "ES", sunrise: 1600000000, sunset: 1600040000 },
        timezone: 7200,
        id: 2509954,
        name: "Valencia",
        cod: 200
    };

    // Mock data para Despejado (Clear)
    const clearMock = {
        coord: { lon: -0.3774, lat: 39.4698 },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        base: "stations",
        main: { temp: 25, feels_like: 26, temp_min: 24, temp_max: 26, humidity: 40, pressure: 1015 },
        visibility: 10000,
        wind: { speed: 2, deg: 100 },
        clouds: { all: 0 },
        dt: 1600000000,
        sys: { type: 1, id: 6421, country: "ES", sunrise: 1600000000, sunset: 1600040000 },
        timezone: 7200,
        id: 2509954,
        name: "Valencia",
        cod: 200
    };

    test('should show falleretPlora.svg when it is raining', async ({ page }) => {
        // Interceptamos la llamada a la API del clima
        await page.route('**/weather?*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(rainMock)
            });
        });
        
        // También interceptar /forecast para que no falle si la página lo llama
        await page.route('**/forecast?*', async route => {
             await route.fulfill({ status: 200, body: JSON.stringify({ list: [] }) });
        });

        // Navegamos a la página
        await page.goto('/index.html'); // Asumiendo que index.html contiene el widget

        // Verificamos que se muestre la imagen de lluvia
        const falleretImg = page.locator('.current-falleret');
        await expect(falleretImg).toBeVisible();
        
        // Esperamos un poco para la transición
        await page.waitForTimeout(1000);
        
        await expect(falleretImg).toHaveAttribute('src', /falleretPlora\.svg/);
    });

    test('should show falleretPro.svg when it is clear', async ({ page }) => {
        // Interceptamos la llamada a la API del clima
        await page.route('**/weather?*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(clearMock)
            });
        });

         // También interceptar /forecast para que no falle si la página lo llama
        await page.route('**/forecast?*', async route => {
             await route.fulfill({ status: 200, body: JSON.stringify({ list: [] }) });
        });

        // Navegamos a la página
        await page.goto('/index.html');

        // Verificamos que se muestre la imagen estándar
        const falleretImg = page.locator('.current-falleret');
        await expect(falleretImg).toBeVisible();
        
         // Esperamos un poco para la transición
        await page.waitForTimeout(1000);

        await expect(falleretImg).toHaveAttribute('src', /falleretPro\.svg/);
    });
});