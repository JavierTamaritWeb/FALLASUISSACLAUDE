import { test, expect } from '@playwright/test';
import fs from 'fs';
import { glob } from 'glob';

// Este test valida los HTML ya construidos en dist/.
// Útil antes de desplegar: asegura que el build arrastra el ?v=... a OG/Twitter.

test.describe('OpenGraph cache-buster in dist/', () => {
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
