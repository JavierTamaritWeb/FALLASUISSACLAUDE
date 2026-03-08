// tests/meteo-falleret-sizes.e2e.spec.js
const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
];

// Mock data para Lluvia (Rain)
const rainMock = {
    coord: { lon: -0.3774, lat: 39.4698 },
    weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    base: "stations",
    main: { temp: 15, feels_like: 14, temp_min: 14, temp_max: 16, humidity: 80, pressure: 1012 },
    visibility: 10000,
    wind: { speed: 5, deg: 200 },
    rain: { "1h": 2.5 },
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

test.describe('Meteo Falleret Size Consistency', () => {

    for (const viewport of VIEWPORTS) {
        test(`should have consistent dimensions in ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            
            // Configurar viewport
            await page.setViewportSize({ width: viewport.width, height: viewport.height });

            // 1. Cargar con CLIMA DESPEJADO (falleretPro)
            await page.route('**/weather?*', async route => {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(clearMock) });
            });
            await page.route('**/forecast?*', async route => await route.fulfill({ status: 200, body: JSON.stringify({ list: [] }) }));

            await page.goto('/index.html');
            
            const falleretImg = page.locator('.current-falleret');
            await expect(falleretImg).toBeVisible();
            await expect(falleretImg).toHaveAttribute('src', /falleretPro\.svg/);
            
            // Esperar a que la imagen cargue completamente y estabilice
            await page.waitForTimeout(500); 
            const bboxPro = await falleretImg.boundingBox();
            expect(bboxPro).not.toBeNull();
            
            console.log(`[${viewport.name}] Pro size: ${bboxPro.width.toFixed(2)} x ${bboxPro.height.toFixed(2)}`);

            // 2. Cambiar a CLIMA LLUVIOSO (falleretPlora) dinámicamente o recargando
            // Para asegurar limpieza, recargaremos con el nuevo mock
            await page.unroute('**/weather?*');
            await page.route('**/weather?*', async route => {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rainMock) });
            });
            
            // Recargar para forzar el nuevo estado limpio (o podríamos haber esperado el polling si fuera corto, pero reload es más seguro)
            await page.reload();
            await expect(falleretImg).toBeVisible();
            await page.waitForTimeout(1000); // Esperar transición/carga
            await expect(falleretImg).toHaveAttribute('src', /falleretPlora\.svg/);

            const bboxPlora = await falleretImg.boundingBox();
            expect(bboxPlora).not.toBeNull();

            console.log(`[${viewport.name}] Plora size: ${bboxPlora.width.toFixed(2)} x ${bboxPlora.height.toFixed(2)}`);

            // 3. COMPARAR DIMENSIONES
            // Permitimos una tolerancia mínima de sub-pixel (0.5px)
            expect(Math.abs(bboxPro.width - bboxPlora.width)).toBeLessThanOrEqual(1.0);
            expect(Math.abs(bboxPro.height - bboxPlora.height)).toBeLessThanOrEqual(1.0);
        });
    }
});
