#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const gitDir = path.join(repoRoot, '.git');
const hooksDir = path.join(repoRoot, '.githooks');

if (!fs.existsSync(gitDir)) {
  console.log('OK: no se ha detectado .git. Se omite la instalación de hooks.');
  process.exit(0);
}

fs.mkdirSync(hooksDir, { recursive: true });

const configResult = spawnSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: repoRoot,
  encoding: 'utf8'
});

if (configResult.error) {
  console.error(`Error: no se pudo ejecutar git config: ${configResult.error.message}`);
  process.exit(1);
}

const configStatus = typeof configResult.status === 'number' ? configResult.status : 1;

if (configStatus !== 0) {
  const stderr = (configResult.stderr ?? '').trim();
  console.error(`Error: no se pudo configurar core.hooksPath. ${stderr || `Código ${configStatus}.`}`);
  process.exit(configStatus);
}

for (const hookName of ['pre-commit', 'pre-push']) {
  const hookPath = path.join(hooksDir, hookName);

  if (!fs.existsSync(hookPath)) {
    continue;
  }

  fs.chmodSync(hookPath, 0o755);
  console.log(`OK: permisos 755 aplicados a .githooks/${hookName}.`);
}

console.log('OK: core.hooksPath configurado en .githooks.');