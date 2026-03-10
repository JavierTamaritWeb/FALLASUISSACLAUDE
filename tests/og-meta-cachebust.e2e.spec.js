import { test, expect } from '@playwright/test';
import fs from 'fs';
import { glob } from 'glob';

// Este test garantiza que NO quede ninguna referencia a og-share.png sin cache-buster.
// WhatsApp cachea agresivamente, así que forzar ?v=... es la forma más fiable.

test.describe('OpenGraph cache-buster (WhatsApp)', () => {
  test('all HTML files should reference og-share.png with ?v=...', async () => {
    const htmlFiles = await glob(['**/*.html', '!dist/**', '!node_modules/**', '!test-results/**']);
    expect(htmlFiles.length, 'No se han encontrado archivos HTML para validar.').toBeGreaterThan(0);

    const unversionedRegex = /https:\/\/fallasuissa\.es\/img\/og-share\.png(?!\?v=)/;

    const offenders = [];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (unversionedRegex.test(content)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `Se han encontrado referencias SIN ?v=... a og-share.png (esto rompe el refresco en WhatsApp):\n- ${offenders.join('\n- ')}`
    ).toEqual([]);
  });

  test('dist HTML should reference og-share.png with ?v=... (if dist exists)', async () => {
    if (!fs.existsSync('dist')) {
      test.skip(true, 'No existe la carpeta dist/. Ejecuta `npm run build` antes de este test.');
    }

    const htmlFiles = await glob(['dist/**/*.html']);
    expect(htmlFiles.length, 'No se han encontrado HTML dentro de dist/ para validar.').toBeGreaterThan(0);

    const unversionedRegex = /https:\/\/fallasuissa\.es\/img\/og-share\.png(?!\?v=)/;
    const offenders = [];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (unversionedRegex.test(content)) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `dist/ contiene referencias SIN ?v=... a og-share.png (reconstruye y revisa el build):\n- ${offenders.join('\n- ')}`
    ).toEqual([]);
  });
});
