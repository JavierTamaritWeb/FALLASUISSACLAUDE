#!/usr/bin/env node
// IndexNow: avisa a los buscadores (Bing, Yandex, Seznam, Naver, Yep…) de las URL
// cuyo contenido cambió. Un solo POST a api.indexnow.org propaga a todos los
// motores adheridos. Google no participa (retiró el ping de sitemaps en 2023 y
// descubre por robots.txt + Search Console). Guía: docs/seo-indexnow.md.
//
//   node scripts/indexnow-submit.mjs --changed [--previous <seo-history.json anterior>]
//   node scripts/indexnow-submit.mjs --all [--sitemap dist/sitemap.xml]
//   node scripts/indexnow-submit.mjs --urls https://fallasuissa.es/ https://fallasuissa.es/va/
//   … [--dry-run]
//
// Códigos de salida: 0 enviado o nada que enviar · 1 error nuestro (400/422, clave
// inválida, argumentos) · 2 el servicio no aceptó tras los reintentos (403/429/red):
// el deploy sigue siendo correcto y basta con volver a lanzar más tarde.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ORIGIN = 'https://fallasuissa.es';
export const HOST = 'fallasuissa.es';
export const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const KEY_LOCATION = `${ORIGIN}/indexnow.txt`;
export const MAX_URLS_PER_REQUEST = 10000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseArgs(argv) {
  const options = { mode: null, urls: [], dryRun: false, previous: null, sitemap: 'dist/sitemap.xml' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--changed' || arg === '--all') options.mode = arg.slice(2);
    else if (arg === '--urls') { options.mode = 'urls'; while (argv[i + 1] && !argv[i + 1].startsWith('--')) options.urls.push(argv[++i]); }
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--previous') options.previous = argv[++i] || null;
    else if (arg === '--sitemap') options.sitemap = argv[++i] || options.sitemap;
    else if (arg === '-h' || arg === '--help') options.mode = 'help';
    else throw new Error(`Argumento desconocido: ${arg}`);
  }
  if (!options.mode) throw new Error('Indica --changed, --all o --urls (ver --help).');
  return options;
}

export async function readKey(root = ROOT) {
  const key = (await fs.readFile(path.join(root, 'src/indexnow.txt'), 'utf8')).trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('src/indexnow.txt debe contener una clave de 8 a 128 caracteres alfanuméricos (o guiones).');
  return key;
}

// URL nuevas o con hash distinto, y las que desaparecen (IndexNow también sirve
// para que el buscador recrawlee un 404/410 y retire la página).
export function diffHistory(previous = {}, current = {}) {
  const changed = Object.keys(current).filter(url => !previous[url] || previous[url].hash !== current[url].hash);
  const removed = Object.keys(previous).filter(url => !current[url]);
  return { changed, removed };
}

export function collectSitemapUrls(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
}

export function chunk(list, size = MAX_URLS_PER_REQUEST) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function describeStatus(code) {
  return {
    200: 'OK: URL recibidas.',
    202: 'Aceptado: la clave se validará en breve (normal en el primer envío).',
    400: 'Petición mal formada (JSON o parámetros): error del script.',
    403: 'Clave no válida o no accesible en keyLocation: ¿la CDN sirve ya /indexnow.txt?',
    422: 'Alguna URL no pertenece al host o la clave no coincide con el archivo publicado.',
    429: 'Demasiadas peticiones: reintentar más tarde.'
  }[code] || `Respuesta inesperada HTTP ${code}.`;
}

export async function submit(urlList, { key, fetch = globalThis.fetch, retries = 2, waitMs = 10000, log = () => {} } = {}) {
  const body = JSON.stringify({ host: HOST, key, keyLocation: KEY_LOCATION, urlList });
  let status = 0;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
      status = response.status;
    } catch (error) {
      status = 0;
      log(`Intento ${attempt}: error de red (${error.message}).`);
    }
    if (status === 200 || status === 202 || status === 400 || status === 422) return { status, attempts: attempt };
    if (attempt <= retries) { log(`Intento ${attempt}: HTTP ${status || 'sin respuesta'} — ${describeStatus(status)} Reintento en ${waitMs / 1000} s.`); await new Promise(resolve => setTimeout(resolve, waitMs)); }
  }
  return { status, attempts: retries + 1 };
}

function usage() {
  console.log('Uso: node scripts/indexnow-submit.mjs (--changed [--previous <json>] | --all [--sitemap <xml>] | --urls <url>…) [--dry-run]');
  console.log('Ver la cabecera del script y docs/seo-indexnow.md.');
}

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function collectUrls(options, root = ROOT) {
  if (options.mode === 'urls') return { urls: options.urls, reason: 'URL indicadas' };
  if (options.mode === 'all') {
    const xml = await fs.readFile(path.resolve(root, options.sitemap), 'utf8');
    return { urls: collectSitemapUrls(xml), reason: `todas las URL de ${options.sitemap}` };
  }
  const current = await readJson(path.join(root, 'src/data/seo-history.json'));
  if (!current) throw new Error('No existe src/data/seo-history.json: ejecuta npm run build.');
  let previous = options.previous ? await readJson(path.resolve(root, options.previous)) : null;
  let reason = `cambios frente a ${options.previous}`;
  if (!previous && !options.previous) {
    try { previous = JSON.parse(execFileSync('git', ['show', 'HEAD:src/data/seo-history.json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); reason = 'cambios frente al último commit (git HEAD)'; }
    catch { previous = null; }
  }
  if (!previous) {
    const xml = await fs.readFile(path.resolve(root, options.sitemap), 'utf8');
    return { urls: collectSitemapUrls(xml), reason: 'sin historial anterior: se envían todas las URL del sitemap' };
  }
  const { changed, removed } = diffHistory(previous, current);
  return { urls: [...changed, ...removed], reason: `${changed.length} cambiadas/nuevas y ${removed.length} retiradas (${reason})` };
}

export async function main(argv = process.argv.slice(2), { fetch = globalThis.fetch, root = ROOT } = {}) {
  let options;
  try { options = parseArgs(argv); } catch (error) { console.error(error.message); return 1; }
  if (options.mode === 'help') { usage(); return 0; }
  let key;
  try { key = await readKey(root); } catch (error) { console.error(error.message); return 1; }
  let collected;
  try { collected = await collectUrls(options, root); } catch (error) { console.error(error.message); return 1; }
  const urls = [...new Set(collected.urls)];
  const foreign = urls.filter(url => !url.startsWith(`${ORIGIN}/`));
  if (foreign.length) { console.error(`URL fuera de ${ORIGIN}: ${foreign.join(', ')}`); return 1; }
  if (!urls.length) { console.log(`IndexNow: nada que notificar (${collected.reason}).`); return 0; }
  console.log(`IndexNow: ${urls.length} URL (${collected.reason}).`);
  if (options.dryRun) {
    console.log(JSON.stringify({ host: HOST, key: `${key.slice(0, 4)}…`, keyLocation: KEY_LOCATION, urlList: urls }, null, 2));
    console.log('DRY-RUN: no se ha enviado nada.');
    return 0;
  }
  let worst = 0;
  for (const lot of chunk(urls)) {
    const { status, attempts } = await submit(lot, { key, fetch, log: message => console.warn(`  ${message}`) });
    console.log(`  → ${lot.length} URL · HTTP ${status || 'sin respuesta'} tras ${attempts} intento(s): ${describeStatus(status)}`);
    if (status === 400 || status === 422) return 1;
    if (status !== 200 && status !== 202) worst = 2;
  }
  return worst;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(code => { process.exitCode = code; }, error => { console.error(error); process.exitCode = 1; });
}
