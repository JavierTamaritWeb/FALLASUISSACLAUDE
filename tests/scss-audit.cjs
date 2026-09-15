// Análisis estático del SCSS compartido por tests/scss-guardrails.e2e.spec.js y
// scripts/scss-baseline.mjs (auditoría SCSS de sep-2026, docs/auditoria-scss-2026-09.md).
// Todo trabaja sobre texto: sin compilar, sin navegador.
const fs = require('node:fs');
const path = require('node:path');
const { globSync } = require('glob');

const repoRoot = path.resolve(__dirname, '..');

function leer(file) {
  return fs.readFileSync(file, 'utf8');
}

function sinComentarios(scss) {
  return scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function ficherosScss() {
  return globSync('src/scss/**/*.scss', { cwd: repoRoot, absolute: true, nodir: true }).sort();
}

function relativo(file) {
  return path.relative(repoRoot, file);
}

// Elimina los bloques `@media <cond> { … }` cuya condición cumpla `regexCond`, contando llaves.
function sinBloquesMedia(scss, regexCond) {
  let out = scss;
  const abre = /@media\s+([^{]+)\{/g;
  let m;
  while ((m = abre.exec(out)) !== null) {
    if (!regexCond.test(m[1])) continue;
    let depth = 0;
    let i = out.indexOf('{', m.index);
    for (; i < out.length; i++) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}' && --depth === 0) break;
    }
    out = out.slice(0, m.index) + out.slice(i + 1);
    abre.lastIndex = 0;
  }
  return out;
}

// Selectores de nivel raíz (profundidad 0, fuera de cualquier at-rule) con su línea.
function selectoresRaiz(scss) {
  const limpio = sinComentarios(scss);
  const res = [];
  let depth = 0;
  let inicio = 0; // índice donde empieza el "preámbulo" de la regla actual
  let enAtRule = false;
  let atDepth = 0;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === '{') {
      const cabecera = limpio.slice(inicio, i).trim();
      if (depth === 0) {
        if (cabecera.startsWith('@')) { enAtRule = true; atDepth = 1; }
        else if (cabecera) {
          const linea = limpio.slice(0, i).split('\n').length;
          for (const sel of cabecera.split(',')) {
            const s = sel.replace(/\s+/g, ' ').trim();
            if (s) res.push({ selector: s, linea });
          }
        }
      }
      depth++;
      inicio = i + 1;
    } else if (c === '}') {
      depth--;
      if (enAtRule && depth === 0) enAtRule = false;
      inicio = i + 1;
    } else if (c === ';' && depth === 0) {
      inicio = i + 1;
    }
  }
  return res.filter((r) => !r.selector.startsWith('@'));
}

// 1. Reglas de nivel raíz abiertas más de una vez con la MISMA lista de selectores (mismo
// fichero o entre ficheros), como `no-duplicate-selectors` de stylelint. Se ignoran: las
// excepciones de tema, los selectores de solo etiqueta (capas base: normalize, reset,
// typography, globales, accessibility) y las listas sin ámbito de themes/ (transiciones).
const EXCEPCIONES_DUPLICADOS = new Set([':root', 'body.modo-oscuro', 'html.modo-oscuro', 'body.modo-claro', 'html.modo-claro']);
function listasRaiz(scss) {
  const limpio = sinComentarios(scss);
  const res = [];
  let depth = 0; let inicio = 0;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === '{') {
      const cabecera = limpio.slice(inicio, i).trim();
      if (depth === 0 && cabecera && !cabecera.startsWith('@')) {
        const linea = limpio.slice(0, i).split('\n').length;
        const lista = cabecera.split(',').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean).sort().join(', ');
        res.push({ lista, linea });
      }
      depth++; inicio = i + 1;
    } else if (c === '}') { depth--; inicio = i + 1; }
    else if (c === ';' && depth === 0) inicio = i + 1;
  }
  return res;
}
function duplicados(files) {
  const mapa = new Map();
  for (const f of files) {
    const rel = relativo(f);
    for (const { lista, linea } of listasRaiz(leer(f))) {
      if (EXCEPCIONES_DUPLICADOS.has(lista)) continue;
      if (!/[.#[]/.test(lista)) continue; // solo etiquetas: capas base
      if (rel.includes('/themes/') && !/^(body|html)\.(modo|transicion)/.test(lista)) continue;
      if (!mapa.has(lista)) mapa.set(lista, []);
      mapa.get(lista).push(`${rel}:${linea}`);
    }
  }
  return [...mapa.entries()].filter(([, sitios]) => sitios.length > 1).map(([lista, sitios]) => `${lista} → ${[...sitios].sort().join(', ')}`).sort();
}

// 2. Clases presentes en dist/css/main.css sin uso en HTML/JS/JSON/gulpfile.
function clasesEnCss(css) {
  const set = new Set();
  const re = /\.(-?[_a-zA-Z][\w-]*)/g;
  const sinCadenas = css.replace(/url\([^)]*\)/g, 'url()').replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
  let m;
  while ((m = re.exec(sinCadenas)) !== null) {
    // Descarta números con punto (0.5) y extensiones dentro de valores
    if (/^\d/.test(m[1])) continue;
    set.add(m[1]);
  }
  return set;
}
function corpusUso() {
  const globs = ['src/*.html', 'src/js/**/*.js', 'src/data/*.json', 'gulpfile.js', 'src/seo/**/*.json', 'scripts/*.mjs'];
  const files = globs.flatMap((g) => globSync(g, { cwd: repoRoot, absolute: true, nodir: true }));
  return files.map(leer).join('\n');
}
function clasesMuertas(distCss, permitidos) {
  if (!fs.existsSync(distCss)) return [];
  const corpus = corpusUso();
  const permitidasExactas = new Set(permitidos.exactas || []);
  const prefijos = permitidos.prefijos || [];
  const out = [];
  for (const cls of clasesEnCss(leer(distCss))) {
    if (permitidasExactas.has(cls) || prefijos.some((p) => cls.startsWith(p))) continue;
    const re = new RegExp(`(?<![\\w-])${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`);
    if (!re.test(corpus)) out.push(cls);
  }
  return out.sort();
}

// 3. `!important` por fichero, sin contar @media print ni prefers-reduced-motion.
function importantPorFichero(files) {
  const out = {};
  for (const f of files) {
    const txt = sinBloquesMedia(sinComentarios(leer(f)), /print|prefers-reduced-motion:\s*reduce/);
    const n = (txt.match(/!\s*important/g) || []).length;
    if (n) out[relativo(f)] = n;
  }
  return out;
}

// 4. z-index con literal (fuera de 0, 1, -1, auto y tokens $z-*).
function zIndexLiterales(files) {
  const out = [];
  for (const f of files) {
    const txt = sinComentarios(leer(f));
    const re = /z-index\s*:\s*([^;}]+)/g;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const v = m[1].trim();
      if (/^(0|1|-1|auto|inherit|initial|unset)$/.test(v) || /\$z-/.test(v)) continue;
      out.push(`${relativo(f)}: z-index: ${v}`);
    }
  }
  return out.sort();
}

// 5. Media queries fuera de la convención (480/767/768/1024/1025/1200/1201) o mal formateadas.
const MQ_PERMITIDAS = [
  /^\(max-width: (480|767|1024)px\)$/,
  /^\(min-width: (768|1024|1025|1200|1201)px\)$/,
  /^\(min-width: (481|768|1025)px\) and \(max-width: (767|1024|1200)px\)$/,
  /^print$/, /^screen$/,
  /^\(prefers-[a-z-]+: [a-z-]+\)$/, /^\(hover: (hover|none)\)$/, /^\(pointer: (fine|coarse)\)$/,
  /^\(display-mode: standalone\)$/, /^\(forced-colors: active\)$/,
  /^screen and \(-webkit-min-device-pixel-ratio: 0\)$/,
];
function mediaQueries(files) {
  const out = [];
  for (const f of files) {
    const txt = sinComentarios(leer(f));
    const re = /@media\s+([^{]+)\{/g;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const cond = m[1].replace(/\s+/g, ' ').trim();
      if (!MQ_PERMITIDAS.some((p) => p.test(cond))) out.push(`${relativo(f)}: @media ${cond}`);
    }
  }
  return out.sort();
}

// 6. Rutas de ficheros SCSS citadas en comentarios que ya no existen.
function rutasObsoletas(files) {
  const existentes = new Set(files.map((f) => relativo(f).replace(/^src\/scss\//, '')));
  const out = [];
  for (const f of files) {
    const txt = leer(f);
    const re = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const rutas = m[0].match(/\b(abstracts|base|optimization|layout|animaciones|components|sociales|themes)\/_[\w-]+\.scss/g) || [];
      for (const r of rutas) if (!existentes.has(r)) out.push(`${relativo(f)}: comentario cita ${r}`);
    }
  }
  return [...new Set(out)].sort();
}

// 7. Selectores de etiqueta sin ámbito a nivel raíz en components/ (p, a, img, button, h1-h6, ul, li…).
function etiquetasGlobales(files) {
  const out = [];
  const tag = /^(p|a|img|button|h[1-6]|ul|ol|li|span|div|input|textarea|select|label|table|body|html)(?![\w-])/;
  for (const f of files) {
    const rel = relativo(f);
    if (!rel.startsWith('src/scss/components/')) continue;
    for (const { selector, linea } of selectoresRaiz(leer(f))) {
      const primero = selector.split(/\s+/)[0];
      if (tag.test(primero) && !/[.#]/.test(primero)) out.push(`${rel}:${linea}: ${selector}`);
    }
  }
  return out.sort();
}

// 8. Bloques de components/ con fondo claro sin contrapartida en el tema oscuro.
const TOKENS_CLAROS = /\$(blanco|blanco-hueso|rosa-acordeon|turquesa-suave|turquesa-claro|naranja-suave|celeste-[1-5]|gradiente-celeste)\b/;
function coberturaTema(files) {
  const oscuro = files.find((f) => /themes\/_modo-oscuro\.scss$/.test(f));
  const temaTxt = oscuro ? sinComentarios(leer(oscuro)) : '';
  const out = [];
  for (const f of files) {
    const rel = relativo(f);
    if (!rel.startsWith('src/scss/components/')) continue;
    const txt = sinComentarios(leer(f));
    if (/modo-oscuro/.test(txt)) continue; // el componente gestiona su propio tema
    for (const { selector } of selectoresRaiz(txt)) {
      const m = selector.match(/^\.([a-z0-9-]+)/);
      if (!m) continue;
      const bloque = m[1];
      // ¿declara un fondo claro en su bloque?
      const re = new RegExp(`\\.${bloque}\\b[^{]*\\{[^}]*background(?:-color)?\\s*:[^;]*${TOKENS_CLAROS.source.slice(0, -2)}`);
      if (!re.test(txt)) continue;
      if (!new RegExp(`modo-oscuro[^{]*\\.${bloque}(?![\\w-])`).test(temaTxt)) out.push(`${rel}: .${bloque} (fondo claro sin regla en themes/_modo-oscuro.scss)`);
    }
  }
  return [...new Set(out)].sort();
}

function analizarTodo() {
  const files = ficherosScss();
  const permitidos = JSON.parse(leer(path.join(repoRoot, 'tests/fixtures/scss-allowed-unused.json')));
  return {
    duplicados: duplicados(files),
    clasesMuertas: clasesMuertas(path.join(repoRoot, 'dist/css/main.css'), permitidos),
    important: importantPorFichero(files),
    zIndex: zIndexLiterales(files),
    mediaQueries: mediaQueries(files),
    rutasObsoletas: rutasObsoletas(files),
    etiquetasGlobales: etiquetasGlobales(files),
    coberturaTema: coberturaTema(files),
  };
}

module.exports = { repoRoot, ficherosScss, leer, sinComentarios, sinBloquesMedia, selectoresRaiz, duplicados, clasesMuertas, importantPorFichero, zIndexLiterales, mediaQueries, rutasObsoletas, etiquetasGlobales, coberturaTema, analizarTodo };
