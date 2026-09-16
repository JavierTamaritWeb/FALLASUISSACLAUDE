const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { globSync } = require('glob');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripScssComments(input) {
  // Remove /* ... */ blocks first, then // ... line comments.
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function findVariableDefinitions(scssContent) {
  const cleaned = stripScssComments(scssContent);
  const matches = cleaned.matchAll(/^\s*\$([A-Za-z0-9_-]+)\s*:/gm);
  return Array.from(matches, (m) => m[1]);
}

test.describe('SCSS guardrails (namespaces, mixins, variables)', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const scssFiles = globSync('src/scss/**/*.scss', { cwd: repoRoot, absolute: true, nodir: true });

  test('No existe `@use ... as *;` en src/scss/**', () => {
    const offenders = [];
    for (const file of scssFiles) {
      const content = readUtf8(file);
      if (/@use\s+[^;]+\s+as\s+\*\s*;/.test(content)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
    expect(offenders, `Encontrados @use as * en:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('Imports de variables usan namespace `v`', () => {
    const offenders = [];
    for (const file of scssFiles) {
      const content = readUtf8(file);
      const hasVariablesUse = /@use\s+['"][^'"]*variables['"]\s+as\s+/.test(content);
      if (!hasVariablesUse) continue;

      if (!/@use\s+['"][^'"]*variables['"]\s+as\s+v\s*;/.test(content)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
    expect(offenders, `Imports de variables no usan alias v en:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('Imports de mixins usan namespace `m`', () => {
    const offenders = [];
    for (const file of scssFiles) {
      const content = readUtf8(file);
      const hasMixinsUse = /@use\s+['"][^'"]*mixins['"]\s+as\s+/.test(content);
      if (!hasMixinsUse) continue;

      if (!/@use\s+['"][^'"]*mixins['"]\s+as\s+m\s*;/.test(content)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
    expect(offenders, `Imports de mixins no usan alias m en:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('`src/scss/abstracts/_variables.scss` no tiene variables duplicadas', () => {
    const variablesPath = path.join(repoRoot, 'src/scss/abstracts/_variables.scss');
    const defs = findVariableDefinitions(readUtf8(variablesPath));

    const seen = new Map();
    const duplicates = new Set();
    for (const name of defs) {
      if (seen.has(name)) duplicates.add(name);
      else seen.set(name, 1);
    }

    expect([...duplicates].sort(), `Variables duplicadas encontradas: ${[...duplicates].join(', ')}`).toEqual([]);
  });

  test('No hay `@mixin` fuera de `src/scss/abstracts/_mixins.scss`', () => {
    const mixinsFile = path.join(repoRoot, 'src/scss/abstracts/_mixins.scss');
    const offenders = [];

    for (const file of scssFiles) {
      if (path.resolve(file) === path.resolve(mixinsFile)) continue;
      const content = stripScssComments(readUtf8(file));
      if (/@mixin\s+/.test(content)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }

    expect(offenders, `@mixin encontrado fuera de _mixins.scss en:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('Toda variable de `_variables.scss` se usa al menos una vez (v4.38.0)', () => {
    // Evita que vuelvan a acumularse tokens muertos (en 4.38.0 se retiraron 9).
    const variablesPath = path.join(repoRoot, 'src/scss/abstracts/_variables.scss');
    const defs = findVariableDefinitions(readUtf8(variablesPath));
    const corpus = scssFiles.map((f) => stripScssComments(readUtf8(f))).join('\n');
    const sinUso = defs.filter((name) => {
      const re = new RegExp(`\\$${name}(?![A-Za-z0-9_-])`, 'g');
      const total = (corpus.match(re) || []).length;
      return total <= 1; // solo su propia declaración
    });
    expect(sinUso, `Variables sin ningún uso: ${sinUso.join(', ')}`).toEqual([]);
  });

  test('Ningún literal de color que ya tenga token (v4.38.0)', () => {
    // Coincidencias exactas con tokens de _variables.scss. Se ignoran los bloques
    // @media print (impresión en blanco/negro literal) y los dos ficheros de tokens.
    const prohibidos = [
      [/#333(?:333)?(?![0-9a-f])/gi, '$secondary-color'],
      [/#f{3}(?:f{3})?(?![0-9a-f])/gi, '$blanco'],
      [/#0{3}(?:0{3})?(?![0-9a-f])/gi, '$negro'],
      [/#1{3}(?:1{3})?(?![0-9a-f])/gi, '$negro-casi'],
      [/#444(?:444)?(?![0-9a-f])/gi, '$gris-muy-oscuro'],
      [/#555(?:555)?(?![0-9a-f])/gi, '$gris-medio-oscuro'],
      [/#f5f5f5(?![0-9a-f])/gi, '$blanco-hueso'],
      [/#fdf2e9(?![0-9a-f])/gi, '$naranja-suave'],
      [/rgba\(\s*255\s*,\s*111\s*,\s*97/g, 'rgba(var(--coral-marca-rgb), a) (coral antiguo #FF6F61)'],
      [/rgba\(\s*255\s*,\s*215\s*,\s*0\b/g, 'rgba($dorado, a)'],
      [/rgba\(\s*245\s*,\s*245\s*,\s*245/g, 'rgba($blanco-hueso, a)'],
    ];
    const sinPrint = (css) => {
      // Elimina cada bloque `@media print { ... }` contando llaves
      let out = css;
      let idx;
      while ((idx = out.search(/@media\s+print\s*\{/)) !== -1) {
        let depth = 0; let i = out.indexOf('{', idx);
        for (; i < out.length; i++) {
          if (out[i] === '{') depth++;
          else if (out[i] === '}' && --depth === 0) break;
        }
        out = out.slice(0, idx) + out.slice(i + 1);
      }
      return out;
    };
    const offenders = [];
    for (const file of scssFiles) {
      const rel = path.relative(repoRoot, file);
      if (/abstracts\/_(variables|globales)\.scss$/.test(rel)) continue;
      const content = sinPrint(stripScssComments(readUtf8(file)));
      for (const [re, token] of prohibidos) {
        const hits = content.match(re);
        if (hits) offenders.push(`${rel}: ${hits[0]} ×${hits.length} → usa ${token}`);
      }
    }
    expect(offenders, `Literales con token existente:\n${offenders.join('\n')}`).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Auditoría SCSS de sep-2026 (docs/auditoria-scss-2026-09.md): cada categoría se
  // compara con tests/fixtures/scss-baseline.json. La deuda registrada solo puede
  // bajar: un hallazgo nuevo falla; uno que desaparece se consolida con
  // `npm run lint:scss:baseline`.
  // ---------------------------------------------------------------------------
  const audit = require('./scss-audit.cjs');
  const baseline = JSON.parse(readUtf8(path.join(repoRoot, 'tests/fixtures/scss-baseline.json')));
  const permitidos = JSON.parse(readUtf8(path.join(repoRoot, 'tests/fixtures/scss-allowed-unused.json')));
  const nuevos = (actual, base) => actual.filter((x) => !base.includes(x));
  const mensaje = (titulo, lista) => `${titulo} (no están en la baseline; corrige o justifica y actualiza con npm run lint:scss:baseline):\n${lista.join('\n')}`;

  test('Auditoría: ningún selector de nivel raíz duplicado nuevo', () => {
    const actual = audit.duplicados(scssFiles);
    expect(nuevos(actual, baseline.duplicados), mensaje('Selectores duplicados nuevos', nuevos(actual, baseline.duplicados))).toEqual([]);
  });

  test('Auditoría: ninguna clase nueva sin uso en HTML/JS/JSON (CSS muerto)', () => {
    const distCss = path.join(repoRoot, 'dist/css/main.css');
    test.skip(!fs.existsSync(distCss), 'Requiere npm run build');
    const actual = audit.clasesMuertas(distCss, permitidos);
    expect(nuevos(actual, baseline.clasesMuertas), mensaje('Clases sin uso nuevas (o añádelas a scss-allowed-unused.json con motivo)', nuevos(actual, baseline.clasesMuertas))).toEqual([]);
  });

  test('Auditoría: el número de `!important` por fichero no sube (fuera de print y reduced-motion)', () => {
    const actual = audit.importantPorFichero(scssFiles);
    const excesos = Object.entries(actual).filter(([f, n]) => n > (baseline.important[f] || 0)).map(([f, n]) => `${f}: ${n} (baseline ${baseline.important[f] || 0})`);
    expect(excesos, mensaje('Ficheros con más !important que la baseline', excesos)).toEqual([]);
  });

  test('Auditoría: ningún `z-index` literal nuevo (usa la escala $z-* de _variables.scss)', () => {
    const actual = audit.zIndexLiterales(scssFiles);
    expect(nuevos(actual, baseline.zIndex), mensaje('z-index literales nuevos', nuevos(actual, baseline.zIndex))).toEqual([]);
  });

  test('Auditoría: media queries dentro de la convención (480/767/768/1024/1025/1200/1201, con espacio tras los dos puntos, sin `screen and`)', () => {
    const actual = audit.mediaQueries(scssFiles);
    expect(nuevos(actual, baseline.mediaQueries), mensaje('Media queries fuera de convención nuevas', nuevos(actual, baseline.mediaQueries))).toEqual([]);
  });

  test('Auditoría: ningún comentario cita una ruta SCSS que no existe', () => {
    expect(audit.rutasObsoletas(scssFiles)).toEqual([]);
  });

  test('Auditoría: ningún selector de etiqueta sin ámbito nuevo a nivel raíz en components/', () => {
    const actual = audit.etiquetasGlobales(scssFiles);
    expect(nuevos(actual, baseline.etiquetasGlobales), mensaje('Reglas de etiqueta globales nuevas en components/', nuevos(actual, baseline.etiquetasGlobales))).toEqual([]);
  });

  test('Auditoría: todo bloque de components/ con fondo claro tiene contrapartida en themes/_modo-oscuro.scss', () => {
    const actual = audit.coberturaTema(scssFiles);
    expect(nuevos(actual, baseline.coberturaTema), mensaje('Bloques con fondo claro sin regla oscura', nuevos(actual, baseline.coberturaTema))).toEqual([]);
  });

  test('Auditoría: ningún `:hover` fuera de `@media (hover: hover)` (v4.40.0)', () => {
    expect(audit.hoverSinMedia(scssFiles)).toEqual([]);
  });

  test('Auditoría: la baseline no conserva deuda ya resuelta (consolidar con npm run lint:scss:baseline)', () => {
    const datos = audit.analizarTodo();
    const sobrantes = [];
    for (const k of ['duplicados', 'clasesMuertas', 'zIndex', 'mediaQueries', 'etiquetasGlobales', 'coberturaTema']) {
      for (const x of baseline[k]) if (!datos[k].includes(x)) sobrantes.push(`${k}: ${x}`);
    }
    for (const [f, n] of Object.entries(baseline.important)) if ((datos.important[f] || 0) < n) sobrantes.push(`important: ${f} ${datos.important[f] || 0} < ${n}`);
    expect(sobrantes, `Entradas de la baseline que ya no ocurren:\n${sobrantes.join('\n')}`).toEqual([]);
  });

  test('`src/scss/abstracts/_mixins.scss` contiene mixins esperados', () => {
    const mixinsFile = path.join(repoRoot, 'src/scss/abstracts/_mixins.scss');
    const content = stripScssComments(readUtf8(mixinsFile));

    expect(content).toMatch(/@mixin\s+transition\s*\(/);
    expect(content).toMatch(/@mixin\s+fadeIn\s*\(/);
  });
});
