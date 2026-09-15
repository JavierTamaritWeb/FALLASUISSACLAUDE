// Baseline de la auditoría SCSS: recuentos y listas que solo pueden decrecer.
// Uso: node scripts/scss-baseline.mjs [--update]   (sin --update solo imprime el resumen)
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const audit = require('../tests/scss-audit.cjs');
const salida = path.join(audit.repoRoot, 'tests/fixtures/scss-baseline.json');
const datos = audit.analizarTodo();
const resumen = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.values(v).reduce((a, b) => a + b, 0)]));
console.log(JSON.stringify(resumen));
if (process.argv.includes('--update')) {
  writeFileSync(salida, JSON.stringify(datos, null, 2) + '\n');
  console.log(`baseline escrita en ${path.relative(audit.repoRoot, salida)}`);
}
