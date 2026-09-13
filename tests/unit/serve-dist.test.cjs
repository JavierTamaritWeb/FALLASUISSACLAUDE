const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'falla-server-'));
  const root = path.join(dir, 'site');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(dir, 'site-private'));
  fs.writeFileSync(path.join(root, 'index.html'), 'sitio');
  fs.writeFileSync(path.join(dir, 'site-private', 'private.txt'), 'fuera del sitio');
  fs.symlinkSync(path.join(dir, 'site-private'), path.join(root, 'enlace'));
  const child = spawn(process.execPath, [path.resolve(__dirname, '../../scripts/serve-dist.mjs'), '--port', '0', '--root', root], { stdio: ['ignore', 'pipe', 'pipe'] });
  const errors = [];
  child.stderr.on('data', chunk => errors.push(String(chunk)));
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const done = once(child, 'exit');
      child.kill();
      await done;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const output = await Promise.race([
    once(child.stdout, 'data').then(([chunk]) => String(chunk)),
    once(child, 'exit').then(() => { throw new Error(errors.join('')); })
  ]);
  const port = Number(output.match(/127\.0\.0\.1:(\d+)/)[1]);
  return (url) => new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: url }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    }).on('error', reject);
  });
}

test('una URL mal codificada responde 400 y el servidor sigue disponible', async t => {
  const request = await fixture(t);
  assert.equal((await request('/%ZZ')).status, 400);
  assert.equal((await request('/')).status, 200);
});

test('la ruta no puede salir a un directorio hermano con el mismo prefijo', async t => {
  const request = await fixture(t);
  assert.equal((await request('/..%2fsite-private/private.txt')).status, 400);
});

test('un enlace simbólico no puede publicar archivos externos a la raíz servida', async t => {
  const request = await fixture(t);
  assert.equal((await request('/enlace/private.txt')).status, 400);
});
