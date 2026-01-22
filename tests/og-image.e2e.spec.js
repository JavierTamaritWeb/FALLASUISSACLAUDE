import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('OpenGraph Image Validation', () => {
  const ogImagePath = path.join(process.cwd(), 'img', 'og-share.png');

  test('og-share.png should exist', async () => {
    expect(fs.existsSync(ogImagePath), 'El archivo img/og-share.png no existe').toBeTruthy();
  });

  test('og-share.png should be smaller than 300KB for WhatsApp', async () => {
    // WhatsApp tiene un límite estricto de 300KB (a veces reportado como incluso menor, pero 300KB es el estándar seguro)
    const stats = fs.statSync(ogImagePath);
    const sizeInKb = stats.size / 1024;
    console.log(`Detected OG Image size: ${sizeInKb.toFixed(2)} KB`);
    expect(sizeInKb).toBeLessThan(300);
  });

  test('og-share.png should have 1200x630 dimensions', async ({ page }) => {
    // Leemos la imagen generada y la cargamos en la página para verificar sus dimensiones "naturales"
    const buffer = fs.readFileSync(ogImagePath);
    // Convertir a base64 para inyectar sin depender del servidor
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    await page.setContent(`<img id="check-img" src="${dataUrl}" />`);
    
    const imgLocator = page.locator('#check-img');
    await expect(imgLocator).toBeVisible();

    const dimensions = await imgLocator.evaluate((img) => {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    });

    expect(dimensions.width).toBe(1200);
    expect(dimensions.height).toBe(630);
  });
});
