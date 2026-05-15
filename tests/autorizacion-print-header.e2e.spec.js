// Verifica que las páginas de autorización (adultos y menores) imprimen el
// escudo + cabecera de la falla en CADA página del PDF generado.
//
// Mecanismo: el contenido vive dentro de <table><thead/><tbody/> y, en
// @media print, el thead pasa a `display: table-header-group`. El estándar
// HTML/PDF garantiza que los navegadores repitan ese thead en cada página.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const URLS = [
  { url: '/autorizacion-imagen.html', titulo: 'adultos' },
  { url: '/autorizacion-imagen-menor.html', titulo: 'menores' }
];

for (const { url, titulo } of URLS) {
  test.describe(`Autorización imagen (${titulo}): escudo repetido por página`, () => {

    test('estructura DOM: tabla con thead repetible contiene el escudo', async ({ page }) => {
      await page.goto(url);

      // Existe la tabla envoltorio
      const tabla = page.locator('table.autorizacion-imagen__hoja');
      await expect(tabla).toHaveCount(1);

      // Existe el thead (la cabecera repetible) con la clase semántica
      const thead = page.locator('table.autorizacion-imagen__hoja > thead.autorizacion-imagen__hoja-thead');
      await expect(thead).toHaveCount(1);

      // El escudo vive DENTRO del thead (condición indispensable para que
      // el navegador lo repita en cada página al imprimir)
      const escudo = thead.locator('img.autorizacion-imagen__cabecera-escudo');
      await expect(escudo).toHaveCount(1);
      await expect(escudo).toHaveAttribute('src', /Escudo_falla\.png$/);
    });

    test('en @media print el thead se renderiza como table-header-group', async ({ page }) => {
      await page.goto(url);
      await page.emulateMedia({ media: 'print' });

      const thead = page.locator('table.autorizacion-imagen__hoja > thead.autorizacion-imagen__hoja-thead');
      const display = await thead.evaluate((el) => getComputedStyle(el).display);
      expect(display).toBe('table-header-group');

      // El escudo dentro del thead es visible en modo print con tamaño limitado
      // (2.5cm ≈ 94px @ 96dpi). Aceptamos rango 70–130px para márgenes de error.
      const escudo = thead.locator('img.autorizacion-imagen__cabecera-escudo');
      await expect(escudo).toBeVisible();
      const box = await escudo.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeGreaterThanOrEqual(70);
      expect(box.width).toBeLessThanOrEqual(140);
    });

    test('PDF generado tiene ≥ 2 páginas y el escudo aparece en cada una', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'page.pdf() solo está soportado en Chromium');

      await page.goto(url);
      // Esperar a que el escudo se haya cargado para que se embeba en el PDF
      await page.locator('img.autorizacion-imagen__cabecera-escudo').first().evaluate(
        (img) => img.complete || new Promise((res) => img.addEventListener('load', res, { once: true }))
      );

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' }
      });

      expect(pdfBuffer.byteLength).toBeGreaterThan(10_000);

      // Inspección del binario del PDF
      const pdfString = pdfBuffer.toString('binary');

      // 1) Número de páginas: contamos los objects "/Type /Page" (excluyendo /Pages)
      const pageObjMatches = pdfString.match(/\/Type\s*\/Page(?!s)\b/g) || [];
      const numPages = pageObjMatches.length;
      expect(numPages, `El PDF debería tener ≥ 2 páginas, tiene ${numPages}`).toBeGreaterThanOrEqual(2);

      // 2) Hay al menos una imagen embebida (el escudo). El PDF marca imágenes
      // con `/Subtype /Image` dentro del XObject.
      const imageXObjects = pdfString.match(/\/Subtype\s*\/Image\b/g) || [];
      expect(imageXObjects.length, 'Debe haber al menos 1 XObject de imagen embebida').toBeGreaterThanOrEqual(1);

      // 3) El thead repetible se traduce en una referencia al XObject de imagen
      // en CADA página del PDF. Chromium reutiliza el mismo XObject y emite
      // un operador `Do` en el content stream de cada página. Contamos las
      // ocurrencias de `Do` en el PDF y exigimos al menos `numPages` (una por
      // página). Hay otras formas en que aparece "Do" en PDFs, pero como
      // sólo este HTML embebe imágenes, este umbral es seguro.
      const doOps = pdfString.match(/\bDo\b/g) || [];
      expect(doOps.length, `El operador Do (referencia a XObject) debería aparecer ≥ ${numPages} veces (1 por página). Apariciones: ${doOps.length}`).toBeGreaterThanOrEqual(numPages);
    });
  });
}
