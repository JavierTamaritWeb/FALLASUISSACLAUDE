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
  const scssFiles = globSync('scss/**/*.scss', { cwd: repoRoot, absolute: true, nodir: true });

  test('No existe `@use ... as *;` en scss/**', () => {
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

  test('`scss/abstracts/_variables.scss` no tiene variables duplicadas', () => {
    const variablesPath = path.join(repoRoot, 'scss/abstracts/_variables.scss');
    const defs = findVariableDefinitions(readUtf8(variablesPath));

    const seen = new Map();
    const duplicates = new Set();
    for (const name of defs) {
      if (seen.has(name)) duplicates.add(name);
      else seen.set(name, 1);
    }

    expect([...duplicates].sort(), `Variables duplicadas encontradas: ${[...duplicates].join(', ')}`).toEqual([]);
  });

  test('No hay `@mixin` fuera de `scss/abstracts/_mixins.scss`', () => {
    const mixinsFile = path.join(repoRoot, 'scss/abstracts/_mixins.scss');
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

  test('`scss/abstracts/_mixins.scss` contiene mixins esperados', () => {
    const mixinsFile = path.join(repoRoot, 'scss/abstracts/_mixins.scss');
    const content = stripScssComments(readUtf8(mixinsFile));

    expect(content).toMatch(/@mixin\s+transition\s*\(/);
    expect(content).toMatch(/@mixin\s+fadeIn\s*\(/);
  });
});
