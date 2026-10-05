const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const load = () => import('../../scripts/indexnow-submit.mjs');

test('diffHistory detecta URL nuevas, cambiadas y retiradas e ignora las iguales', async () => {
  const { diffHistory } = await load();
  const previous = { 'https://fallasuissa.es/': { hash: 'a' }, 'https://fallasuissa.es/vieja.html': { hash: 'v' }, 'https://fallasuissa.es/igual.html': { hash: 'i' } };
  const current = { 'https://fallasuissa.es/': { hash: 'b' }, 'https://fallasuissa.es/nueva.html': { hash: 'n' }, 'https://fallasuissa.es/igual.html': { hash: 'i' } };
  assert.deepEqual(diffHistory(previous, current), { changed: ['https://fallasuissa.es/', 'https://fallasuissa.es/nueva.html'], removed: ['https://fallasuissa.es/vieja.html'] });
});

test('collectSitemapUrls y chunk', async () => {
  const { collectSitemapUrls, chunk } = await load();
  assert.deepEqual(collectSitemapUrls('<urlset><url><loc>https://a/</loc></url><url><loc> https://b/x.html </loc></url></urlset>'), ['https://a/', 'https://b/x.html']);
  assert.deepEqual(chunk([1, 2, 3], 2), [[1, 2], [3]]);
});

test('parseArgs exige un modo y rechaza argumentos desconocidos', async () => {
  const { parseArgs } = await load();
  assert.equal(parseArgs(['--changed', '--previous', 'x.json', '--dry-run']).previous, 'x.json');
  assert.deepEqual(parseArgs(['--urls', 'https://a/', 'https://b/']).urls, ['https://a/', 'https://b/']);
  assert.throws(() => parseArgs([]), /--changed, --all o --urls/);
  assert.throws(() => parseArgs(['--foo']), /desconocido/);
});

test('submit reintenta en 429 y devuelve el último estado tras agotar los intentos', async () => {
  const { submit, ENDPOINT, KEY_LOCATION } = await load();
  const calls = [];
  const fetchOk = async (url, init) => { calls.push(JSON.parse(init.body)); return { status: calls.length === 1 ? 429 : 200 }; };
  const result = await submit(['https://fallasuissa.es/'], { key: 'clave1234', fetch: fetchOk, waitMs: 1 });
  assert.deepEqual(result, { status: 200, attempts: 2 });
  assert.equal(calls[0].keyLocation, KEY_LOCATION);
  assert.equal(calls[0].host, 'fallasuissa.es');
  assert.ok(ENDPOINT.startsWith('https://api.indexnow.org/'));
  const forbidden = await submit(['https://fallasuissa.es/'], { key: 'clave1234', fetch: async () => ({ status: 403 }), retries: 2, waitMs: 1 });
  assert.deepEqual(forbidden, { status: 403, attempts: 3 });
  const invalid = await submit(['https://fallasuissa.es/'], { key: 'clave1234', fetch: async () => ({ status: 422 }), retries: 2, waitMs: 1 });
  assert.deepEqual(invalid, { status: 422, attempts: 1 }, '400/422 no se reintentan');
});

test('readKey rechaza claves vacías y acepta la publicada', async t => {
  const { readKey } = await load();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'falla-indexnow-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'src'));
  await fs.writeFile(path.join(root, 'src/indexnow.txt'), '\n');
  await assert.rejects(readKey(root), /8 a 128/);
  await fs.writeFile(path.join(root, 'src/indexnow.txt'), 'abcdef0123456789\n');
  assert.equal(await readKey(root), 'abcdef0123456789');
  const real = await readKey();
  assert.match(real, /^[a-f0-9]{32}$/, 'src/indexnow.txt lleva una clave hex de 32 caracteres');
});

test('main --dry-run con URL explícitas no llama a la red y rechaza URL de otro host', async () => {
  const { main } = await load();
  let called = false;
  const fetch = async () => { called = true; return { status: 200 }; };
  assert.equal(await main(['--urls', 'https://fallasuissa.es/', '--dry-run'], { fetch }), 0);
  assert.equal(called, false);
  assert.equal(await main(['--urls', 'https://example.com/'], { fetch }), 1);
  assert.equal(called, false);
});
