#!/usr/bin/env node
// Evalúa las consultas de aceptación del buscador contra el índice de dist/ con
// el MISMO matcher del cliente (dist/js/buscador.js minificado; también se
// comprueba que src/js/buscador.js da el mismo top 3). Comprueba además que
// cada destino url#id / url?dia= del índice existe en dist/ (ES y /va/).
// Uso: node scripts/search-eval.mjs   (o npm run search:eval; forma parte de
// npm run test:unit y de audit:project). Sale con 1 si no se cumple el objetivo:
// ≥ 90 % de las consultas con destino en el top 3, el 100 % de las críticas en
// el top 1, títulos en el idioma de la interfaz, sin destinos rotos.
// Fecha de referencia: SEARCH_EVAL_HOY o, por defecto, la fecha `generado` del
// índice (así el ranking no cambia con el calendario real).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DIST = path.resolve('dist');
const B = require(path.join(DIST, 'js', 'buscador.js'));
const BSRC = require('../src/js/buscador.js');
const idx = JSON.parse(fs.readFileSync(path.join(DIST, 'data', 'search-index.json'), 'utf8'));
const HOY = process.env.SEARCH_EVAL_HOY || idx.generado || new Date().toISOString().slice(0, 10);

// consulta | idioma UI | destino esperado (id, regex o null = sin coincidencias) | opciones
//   critico: debe ir en el top 1 · titulo: regex del título mostrado en el idioma de la UI
const CASOS = [
  // Páginas y navegación
  ['calendari', 'es', 'page:calendario', { critico: true, titulo: /^Calendario$/ }],
  ['calendario', 'va', 'page:calendario', { critico: true, titulo: /^Calendari$/ }],
  ['organigrama', 'es', 'page:organigrama', { critico: true }],
  ['tiempo valencia', 'es', 'page:meteo', { critico: true }],
  ['oratge', 'va', 'page:meteo', { critico: true }],
  ['cookies', 'va', 'page:cookies', { critico: true, titulo: /galetes|cookies/i }],
  ['avís legal', 'va', 'page:aviso-legal', { critico: true, titulo: /^Avís legal$/ }],
  ['privacidad', 'es', 'page:privacidad', { critico: true }],
  ['mapa', 'va', 'page:mapa', { critico: true, titulo: /^Mapa i ubicació$/ }],
  ['on estem', 'va', 'page:mapa', {}],
  ['suissa', 'es', /^page:(index|lafalla)$/, {}],
  ['blog', 'es', 'page:blog', { critico: true }],
  ['esports', 'va', 'page:deportes', { critico: true, titulo: /^Esports$/ }],
  // Nuevos falleros y formularios
  ['autorización menores', 'es', 'page:autorizacion-imagen-menor', { critico: true }],
  ['autorització menors', 'va', 'page:autorizacion-imagen-menor', { critico: true }],
  ['apuntarme', 'es', 'page:nuevos-falleros', { critico: true }],
  ['nuevos fallers', 'va', 'page:nuevos-falleros', {}],
  ['inscripció', 'va', 'page:nuevos-falleros', {}],
  // Personas y cargos (v4.33.0)
  ['lucía', 'es', 'per:lucia-gutierrez-martin', { critico: true }],
  ['lucia gutierrez', 'es', 'per:lucia-gutierrez-martin', { critico: true }],
  ['presidente', 'es', /^(sec:nosotros-presidente|per:jose-santos-quilis)$/, { critico: true }],
  ['presidenta', 'es', 'sec:nosotros-presidente', {}],
  ['fallera mayor', 'es', 'sec:nosotros-fallera-mayor', { critico: true, titulo: /Fallera Mayor$/ }],
  ['fallera major', 'va', 'sec:nosotros-fallera-mayor', { critico: true, titulo: /Fallera Major$/ }],
  ['fallera mayor infantil', 'es', /^(sec:nosotros-fallera-mayor-infantil|gal:9)$/, {}],
  ['pablo cortés', 'es', 'per:pablo-cortes', { critico: true }],
  ['directiva', 'es', 'sec:nosotros-directiva', { critico: true }],
  ['delegat web', 'va', 'per:javier-tamarit', {}],
  // Home: contacto, redes, subvención
  ['contacto', 'es', 'sec:contacto', { critico: true }],
  ['email', 'es', 'sec:contacto', {}],
  ['instagram', 'es', 'sec:redes', { critico: true }],
  ['xarxes socials', 'va', 'sec:redes', { critico: true, titulo: /^Xarxes socials$/ }],
  ['subvención', 'es', 'sec:subvencion', { critico: true }],
  // Archivos, galerías, documentos
  ['llibrets', 'es', /^doc:llibret/, { critico: true }],
  ['ofrenda 2026', 'es', 'sec:ofrenda-2026', { critico: true }],
  ['ofrena', 'va', /^(page:ofrenda|sec:ofrenda-2026)$/, {}],
  ['cremà', 'va', 'gal:6', { critico: true, titulo: /^Cremà 2025-26$/ }],
  ['sant joan', 'va', 'gal:7', { critico: true }],
  ['paella', 'es', 'gal:7', {}],
  ['cristo de nazaret', 'es', 'gal:10', { critico: true }],
  ['crist de natzaret', 'va', 'gal:10', { critico: true, titulo: /Natzaret 2026$/ }],
  ['proclamació 2025', 'va', 'gal:4', {}],
  ['representantes 2024-25', 'es', 'sec:representantes-2024-25', { critico: true }],
  ['representantes 2025', 'es', 'sec:representantes-2025-26', {}],
  ['vídeo dron', 'es', 'sec:monumento-2025-26', { critico: true }],
  ['fallas 2027', 'es', 'sec:monumento-2026-27', {}],
  ['fútbol', 'es', /^doc:bases-.*futbol/, { critico: true }],
  ['pádel', 'es', 'doc:normas-campeonato-padel-jcf', { critico: true }],
  ['hope', 'es', 'sec:hope', { critico: true }],
  ['fotos', 'es', 'page:galerias', {}],
  // Erratas (v4.34.0)
  ['calendrio', 'es', 'page:calendario', { critico: true }],
  ['organigrma', 'es', /^(page:organigrama|doc:organigrama-2026)$/, {}],
  // Sin coincidencias
  ['xyz123', 'es', null, {}],
  ['qwertyuiop', 'va', null, {}]
];

let ok = 0; let conDestino = 0; let vaciosOk = 0; let vacios = 0; let fallos = 0; let criticosMal = 0; let idiomaMal = 0; let divergencias = 0;
for (const [q, lang, esperado, opts] of CASOS) {
  const res = B.buscar(idx.registros, q, { hoy: HOY });
  const top = res.slice(0, 3).map((r) => r.registro.id);
  // El matcher de src/ debe coincidir con el minificado de dist/
  const topSrc = BSRC.buscar(JSON.parse(JSON.stringify(idx.registros)), q, { hoy: HOY }).slice(0, 3).map((r) => r.registro.id);
  if (topSrc.join() !== top.join()) { divergencias++; console.log(`✗ src/ y dist/ divergen para «${q}»: ${topSrc.join(', ')} vs ${top.join(', ')}`); }
  if (esperado === null) {
    vacios++;
    const bien = res.length === 0;
    if (bien) vaciosOk++;
    console.log(`${bien ? '✓' : '✗'} [${lang}] «${q}» → ${res.length ? top.join(', ') : 'sin coincidencias'}`);
    continue;
  }
  conDestino++;
  const pos = res.findIndex((r) => (esperado instanceof RegExp ? esperado.test(r.registro.id) : r.registro.id === esperado));
  const bien = pos > -1 && pos < 3;
  if (bien) ok++; else fallos++;
  let nota = '';
  if (opts.critico && pos !== 0) { criticosMal++; nota += ' · CRÍTICA fuera del top 1'; }
  if (bien && opts.titulo) {
    const mostrado = res[pos].registro.titulo[lang] || res[pos].registro.titulo.es;
    if (!opts.titulo.test(mostrado)) { idiomaMal++; nota += ` · título en ${lang} «${mostrado}» no cumple ${opts.titulo}`; }
  }
  console.log(`${bien && !nota ? '✓' : '✗'} [${lang}] «${q}» → ${top.join(', ') || 'sin coincidencias'}  (esperado ${esperado} en pos ${pos + 1 || '-'})${nota}`);
}

// Destinos: cada url del índice debe existir en dist/ (ES y /va/) y, si lleva
// ancla, el id debe existir en la página; `?dia=` solo se admite en calendario.html
const anclaRe = (hash) => new RegExp(`\\sid="${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
let rotos = 0;
for (const r of idx.registros) {
  const [ruta, hash] = r.url.split('#');
  const [file, query] = ruta.split('?');
  const nombre = file || 'index.html';
  const variantes = /^pdf\//.test(nombre) ? [nombre] : [nombre, path.join('va', nombre)];
  for (const rel of variantes) {
    const f = path.join(DIST, rel);
    if (!fs.existsSync(f)) { console.log(`✗ destino inexistente: ${r.id} → ${rel}`); rotos++; continue; }
    if (hash && !anclaRe(hash).test(fs.readFileSync(f, 'utf8'))) { console.log(`✗ ancla inexistente: ${r.id} → ${rel}#${hash}`); rotos++; }
  }
  if (query && !(nombre === 'calendario.html' && /^dia=\d{4}-\d{2}-\d{2}$/.test(query))) { console.log(`✗ parámetro no previsto: ${r.id} → ${r.url}`); rotos++; }
}

const pct = conDestino ? Math.round((ok / conDestino) * 100) : 0;
console.log(`\n${ok}/${conDestino} consultas con destino en el top 3 (${pct} %, objetivo ≥ 90 %) · críticas fuera del top 1: ${criticosMal} · títulos en otro idioma: ${idiomaMal} · ${vaciosOk}/${vacios} sin coincidencias correctas · ${rotos} destinos rotos · ${divergencias} divergencias src/dist · ${idx.registros.length} registros · hoy=${HOY}`);
process.exit(pct >= 90 && criticosMal === 0 && idiomaMal === 0 && rotos === 0 && vaciosOk === vacios && divergencias === 0 ? 0 : 1);
