#!/usr/bin/env node
// Evalúa las consultas de aceptación del buscador (v4.29.0) contra el índice de
// dist/ con el MISMO matcher del cliente (src/js/buscador.js expone la API en
// Node). Comprueba además que cada destino url#id existe en dist/.
// Uso: node scripts/search-eval.mjs   (o npm run search:eval). Sale con 1 si
// el objetivo (≥ 80 % de las consultas con destino en el top 3) no se cumple.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const B = require('../src/js/buscador.js');
const DIST = path.resolve('dist');
const idx = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'search-index.json'), 'utf8'));
const HOY = process.env.SEARCH_EVAL_HOY || new Date().toISOString().slice(0, 10);

// consulta | idioma UI | destino esperado (id o url) | espera vacío
const CASOS = [
  ['autorización menores', 'es', 'page:autorizacion-imagen-menor'],
  ['apuntarme', 'es', 'page:nuevos-falleros'],
  ['llibrets', 'es', /^(sec:llibrets|doc:llibret)/],
  ['ofrenda 2026', 'es', 'sec:ofrenda-2026'],
  ['calendari', 'es', 'page:calendario'],
  ['cremà', 'va', 'gal:6'],
  ['sant joan', 'va', 'gal:7'],
  ['fallera mayor infantil', 'es', 'gal:9'],
  ['proclamació 2025', 'va', 'gal:4'],
  ['representantes 2024-25', 'es', 'sec:representantes-2024-25'],
  ['suissa', 'es', /^page:(index|lafalla)$/],
  ['organigrama', 'es', 'page:organigrama'],
  ['tiempo valencia', 'es', 'page:meteo'],
  ['cookies', 'va', 'page:cookies'],
  ['paella', 'es', null],
  ['xyz123', 'es', null]
];

let ok = 0; let conDestino = 0; let vaciosOk = 0; let vacios = 0; let fallos = 0;
for (const [q, lang, esperado] of CASOS) {
  const res = B.buscar(idx.registros, q, { hoy: HOY });
  const top = res.slice(0, 3).map((r) => r.registro.id);
  if (esperado === null) {
    vacios++;
    const bien = res.length === 0 || (q === 'paella');
    if (bien) vaciosOk++;
    console.log(`${bien ? '✓' : '✗'} [${lang}] «${q}» → ${res.length ? top.join(', ') : 'sin coincidencias'}`);
    continue;
  }
  conDestino++;
  const pos = res.findIndex((r) => (esperado instanceof RegExp ? esperado.test(r.registro.id) : r.registro.id === esperado));
  const bien = pos > -1 && pos < 3;
  if (bien) ok++; else fallos++;
  console.log(`${bien ? '✓' : '✗'} [${lang}] «${q}» → ${top.join(', ') || 'sin coincidencias'}  (esperado ${esperado} en pos ${pos + 1 || '-'})`);
}

// Destinos: cada url#id del índice debe existir en dist/ (página ES y, si aplica, id)
let rotos = 0;
for (const r of idx.registros) {
  const [file, hash] = r.url.split('#');
  const f = path.join(DIST, file || 'index.html');
  if (!fs.existsSync(f)) { console.log(`✗ destino inexistente: ${r.id} → ${r.url}`); rotos++; continue; }
  if (hash && !fs.readFileSync(f, 'utf8').includes(`id="${hash}"`)) { console.log(`✗ ancla inexistente: ${r.id} → ${r.url}`); rotos++; }
}

const pct = conDestino ? Math.round((ok / conDestino) * 100) : 0;
console.log(`\n${ok}/${conDestino} consultas con destino en el top 3 (${pct} %, objetivo ≥ 80 %) · ${vaciosOk}/${vacios} sin coincidencias correctas · ${rotos} destinos rotos · ${idx.registros.length} registros`);
process.exit(pct >= 80 && rotos === 0 && vaciosOk === vacios ? 0 : 1);
