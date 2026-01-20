import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const repoRoot = process.cwd();

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function extractVariableNames(variablesFilePath) {
  const content = read(variablesFilePath);
  const names = new Set();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*\$([A-Za-z0-9_-]+)\s*:/);
    if (match) names.add(match[1]);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function replaceUseNamespaces(content) {
  // Variables
  content = content.replace(
    /@use\s+(['"][^'\"]*variables['"])\s+as\s+\*\s*;?/g,
    '@use $1 as v;'
  );
  // If already importing variables with other alias (rare), normalize to v
  content = content.replace(
    /@use\s+(['"][^'\"]*variables['"])\s+as\s+([A-Za-z_][\w-]*)\s*;?/g,
    (full, file, alias) => (alias === 'v' ? `@use ${file} as v;` : `@use ${file} as v;`)
  );

  // Mixins
  content = content.replace(
    /@use\s+(['"][^'\"]*mixins['"])\s+as\s+\*\s*;?/g,
    '@use $1 as m;'
  );
  content = content.replace(
    /@use\s+(['"][^'\"]*mixins['"])\s+as\s+([A-Za-z_][\w-]*)\s*;?/g,
    (full, file, alias) => (alias === 'm' ? `@use ${file} as m;` : `@use ${file} as m;`)
  );

  return content;
}

function replaceVariableUses(content, variableNames) {
  for (const name of variableNames) {
    // Replace $name when it's not already namespaced (v.$name)
    // - ensure word boundary on the name
    // - avoid matching definitions like "$name:" in local contexts (rare for these names)
    const pattern = new RegExp(`(^|[^\\w.])\\$${name}\\b`, 'g');
    content = content.replace(pattern, `$1v.$${name}`);
  }
  return content;
}

function replaceMixinIncludes(content) {
  // Standardize mixin namespace from mix. to m.
  content = content.replace(/@include\s+mix\./g, '@include m.');

  // Special-case: legacy bare fadeIn include (meteo.scss)
  content = content.replace(/@include\s+fadeIn\s*\(/g, '@include m.fadeIn(');

  return content;
}

const variablesFile = path.join(repoRoot, 'scss/abstracts/_variables.scss');
const variableNames = extractVariableNames(variablesFile);

const scssFiles = globSync('scss/**/*.scss', {
  cwd: repoRoot,
  absolute: true,
  nodir: true,
});

let changed = 0;
for (const file of scssFiles) {
  if (file === variablesFile) continue;

  const original = read(file);
  let updated = original;

  updated = replaceUseNamespaces(updated);

  const usesVariables = /@use\s+['"][^'\"]*variables['"]\s+as\s+v\s*;/.test(updated);
  if (usesVariables) {
    updated = replaceVariableUses(updated, variableNames);
  }

  updated = replaceMixinIncludes(updated);

  // Normalize trailing newline
  if (!updated.endsWith('\n')) updated += '\n';

  if (updated !== original) {
    write(file, updated);
    changed += 1;
  }
}

console.log(`Updated ${changed} SCSS files.`);
