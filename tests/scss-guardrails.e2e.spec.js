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

  test('`src/scss/abstracts/_mixins.scss` contiene mixins esperados', () => {
    const mixinsFile = path.join(repoRoot, 'src/scss/abstracts/_mixins.scss');
    const content = stripScssComments(readUtf8(mixinsFile));

    expect(content).toMatch(/@mixin\s+transition\s*\(/);
    expect(content).toMatch(/@mixin\s+fadeIn\s*\(/);
  });
});
