#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WARNING_BYTES = 50 * 1000 * 1000;
const ERROR_BYTES = 95 * 1000 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const scope = readScope(process.argv.slice(2));

try {
  const report = scope === 'staged' ? inspectStagedBlobs() : inspectUnpushedBlobs();
  printReport(report);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

function readScope(args) {
  const scopeArg = args.find((arg) => arg.startsWith('--scope='));
  const value = scopeArg ? scopeArg.slice('--scope='.length) : '';

  if (value === 'staged' || value === 'unpushed') {
    return value;
  }

  console.error('Uso: node scripts/check-git-file-size.mjs --scope=staged|unpushed');
  process.exit(1);
}

function inspectStagedBlobs() {
  const output = runGit([
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=AM',
    '-z'
  ]).stdout;
  const entries = splitNullSeparated(output).map((filePath) => ({
    path: filePath,
    size: readStagedBlobSize(filePath)
  }));

  return {
    label: 'los archivos staged añadidos o modificados',
    entries
  };
}

function inspectUnpushedBlobs() {
  if (!hasHeadCommit()) {
    return {
      label: 'los commits locales pendientes de push',
      entries: []
    };
  }

  const upstream = getCurrentUpstream();
  const args = upstream
    ? ['rev-list', '--objects', `${upstream}..HEAD`]
    : ['rev-list', '--objects', 'HEAD', '--not', '--remotes'];
  const label = upstream
    ? `los commits locales no presentes en ${upstream}`
    : 'los commits locales no presentes en los remotes';
  const lines = runGit(args).stdout.split('\n').filter(Boolean);

  return {
    label,
    entries: buildBlobEntries(lines)
  };
}

function hasHeadCommit() {
  return runGit(['rev-parse', '--verify', 'HEAD'], { allowFailure: true }).status === 0;
}

function getCurrentUpstream() {
  const result = runGit(
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
    { allowFailure: true }
  );

  return result.status === 0 ? result.stdout.trim() : '';
}

function readStagedBlobSize(filePath) {
  const result = runGit(['rev-parse', `:${filePath}`], { allowFailure: true });

  if (result.status !== 0) {
    throw new Error(`No se pudo resolver el blob staged de ${filePath}.`);
  }

  const objectId = result.stdout.trim();
  const size = Number.parseInt(runGit(['cat-file', '-s', objectId]).stdout.trim(), 10);

  if (!Number.isFinite(size)) {
    throw new Error(`No se pudo leer el tamaño staged de ${filePath}.`);
  }

  return size;
}

function buildBlobEntries(lines) {
  if (lines.length === 0) {
    return [];
  }

  const objectPaths = new Map();

  for (const line of lines) {
    const separatorIndex = line.indexOf(' ');

    if (separatorIndex === -1) {
      continue;
    }

    const objectId = line.slice(0, separatorIndex);
    const objectPath = line.slice(separatorIndex + 1);

    if (!objectPath) {
      continue;
    }

    if (!objectPaths.has(objectId)) {
      objectPaths.set(objectId, new Set());
    }

    objectPaths.get(objectId).add(objectPath);
  }

  const objectIds = [...objectPaths.keys()];

  if (objectIds.length === 0) {
    return [];
  }

  const batchInput = `${objectIds.join('\n')}\n`;
  const batchOutput = runGit(
    ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'],
    { input: batchInput }
  ).stdout;
  const entries = [];

  for (const line of batchOutput.split('\n').filter(Boolean)) {
    const [objectId, objectType, objectSize] = line.trim().split(/\s+/);

    if (objectType !== 'blob') {
      continue;
    }

    const size = Number.parseInt(objectSize, 10);

    if (!Number.isFinite(size)) {
      continue;
    }

    for (const filePath of objectPaths.get(objectId) ?? []) {
      entries.push({
        path: filePath,
        size,
        objectId
      });
    }
  }

  return entries;
}

function printReport(report) {
  const flaggedEntries = report.entries
    .filter((entry) => entry.size >= WARNING_BYTES)
    .sort((left, right) => right.size - left.size || left.path.localeCompare(right.path, 'es'));

  if (flaggedEntries.length === 0) {
    console.log(`OK: no se han detectado blobs de 50 MB o más en ${report.label}.`);
    return;
  }

  console.log(`Revisión completada sobre ${report.label}:`);

  for (const entry of flaggedEntries) {
    const level = entry.size >= ERROR_BYTES ? 'ERROR' : 'AVISO';
    console.log(`- [${level}] ${entry.path}: ${formatSize(entry.size)}`);
  }

  const blockingEntries = flaggedEntries.filter((entry) => entry.size >= ERROR_BYTES);

  if (blockingEntries.length > 0) {
    console.error(
      `Error: hay ${blockingEntries.length} ${blockingEntries.length === 1 ? 'blob' : 'blobs'} de 95 MB o más. Reduce el archivo, sácalo del commit o usa Git LFS antes de continuar.`
    );
    process.exit(1);
  }

  console.warn(
    `Aviso: hay ${flaggedEntries.length} ${flaggedEntries.length === 1 ? 'blob' : 'blobs'} de 50 MB o más. GitHub advertirá a partir de ese tamaño.`
  );
}

function formatSize(bytes) {
  const formatter = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  if (bytes >= 1000 * 1000 * 1000) {
    return `${formatter.format(bytes / (1000 * 1000 * 1000))} GB`;
  }

  if (bytes >= 1000 * 1000) {
    return `${formatter.format(bytes / (1000 * 1000))} MB`;
  }

  if (bytes >= 1000) {
    return `${formatter.format(bytes / 1000)} KB`;
  }

  return `${bytes} B`;
}

function splitNullSeparated(value) {
  return value ? value.split('\u0000').filter(Boolean) : [];
}

function runGit(args, { allowFailure = false, input } = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    input,
    maxBuffer: 100 * 1024 * 1024
  });

  if (result.error) {
    throw new Error(`No se pudo ejecutar git ${args.join(' ')}: ${result.error.message}`);
  }

  const status = typeof result.status === 'number' ? result.status : 1;

  if (!allowFailure && status !== 0) {
    const stderr = (result.stderr ?? '').trim();
    throw new Error(stderr || `git ${args.join(' ')} devolvió código ${status}.`);
  }

  return {
    status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}