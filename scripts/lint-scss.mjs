// Lint del SCSS con presupuesto por regla.
// - Cualquier error de stylelint hace fallar el comando.
// - Los avisos se comparan con tests/fixtures/stylelint-baseline.json: una regla
//   no puede tener más avisos que en la baseline (así la deuda solo baja).
// Uso: node scripts/lint-scss.mjs [--update-baseline]
import stylelint from 'stylelint';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const baselinePath = path.join(root, 'tests/fixtures/stylelint-baseline.json');
const update = process.argv.includes('--update-baseline');

const result = await stylelint.lint({ files: 'src/scss/**/*.scss', cwd: root, formatter: 'string' });
const porRegla = {};
let errores = 0;
for (const r of result.results) {
  for (const w of r.warnings) {
    if (w.severity === 'error') errores++;
    porRegla[w.rule] = (porRegla[w.rule] || 0) + 1;
  }
}
const ordenado = Object.fromEntries(Object.entries(porRegla).sort((a, b) => b[1] - a[1]));

if (errores) {
  console.error(result.report);
  console.error(`lint:scss — ${errores} error(es) de stylelint.`);
  process.exit(1);
}

if (update) {
  writeFileSync(baselinePath, JSON.stringify(ordenado, null, 2) + '\n');
  console.log(`lint:scss — baseline actualizada (${Object.values(ordenado).reduce((a, b) => a + b, 0)} avisos).`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {};
const excesos = Object.entries(ordenado).filter(([regla, n]) => n > (baseline[regla] || 0));
const total = Object.values(ordenado).reduce((a, b) => a + b, 0);
const totalBase = Object.values(baseline).reduce((a, b) => a + b, 0);
console.log(`lint:scss — 0 errores, ${total} avisos (baseline ${totalBase}).`);
if (excesos.length) {
  console.error(result.report);
  for (const [regla, n] of excesos) console.error(`  ${regla}: ${n} avisos, baseline ${baseline[regla] || 0} — no añadas deuda nueva; corrige o justifica y actualiza la baseline con --update-baseline`);
  process.exit(1);
}
const mejoras = Object.entries(baseline).filter(([regla, n]) => (ordenado[regla] || 0) < n);
if (mejoras.length) console.log(`  Avisos por debajo de la baseline en ${mejoras.map(([r]) => r).join(', ')}: ejecuta --update-baseline para consolidar.`);
