// Apache real con HTTPS local: el servidor estático de Playwright no interpreta .htaccess.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const https = require('node:https');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: pause } = require('node:timers/promises');

test('Apache: URL canónicas, errores HTTP y portada independiente de Accept', {
  skip: !fs.existsSync('/usr/sbin/httpd') || !fs.existsSync('/usr/libexec/apache2/mod_ssl.so'), timeout: 20000
}, async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'falla-apache-'));
  const docroot = path.join(dir, 'public');
  fs.mkdirSync(path.join(docroot, 'va'), { recursive: true });
  fs.mkdirSync(path.join(docroot, 'seo'));
  fs.copyFileSync(path.join(__dirname, '../../src/.htaccess'), path.join(docroot, '.htaccess'));
  fs.writeFileSync(path.join(docroot, 'index.html'), '<h1>Portada HTML</h1>');
  fs.writeFileSync(path.join(docroot, 'va/index.html'), '<h1>Inici HTML</h1>');
  fs.writeFileSync(path.join(docroot, 'blog.html'), '<h1>Blog</h1>');
  fs.writeFileSync(path.join(docroot, 'seo/ai-training-data.md'), '# Guía independiente');
  const cert = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'), '-days', '1', '-subj', '/CN=localhost'], { encoding: 'utf8' });
  assert.equal(cert.status, 0, 'No se pudo crear el certificado efímero de la prueba');
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const modules = ['mpm_event', 'unixd', 'authz_core', 'authz_host', 'dir', 'mime', 'rewrite', 'headers', 'ssl', 'socache_shmcb'];
  const config = `ServerRoot "${dir}"
ServerName fallasuissa.es
Listen 127.0.0.1:${port}
PidFile "${dir}/httpd.pid"
ErrorLog "${dir}/error.log"
${modules.map(name => `LoadModule ${name}_module /usr/libexec/apache2/mod_${name}.so`).join('\n')}
SSLEngine on
SSLCertificateFile "${dir}/cert.pem"
SSLCertificateKeyFile "${dir}/key.pem"
SSLSessionCache none
TypesConfig /dev/null
AddType text/html .html
DirectoryIndex index.html
DocumentRoot "${docroot}"
<Directory "${docroot}">
AllowOverride All
Require all granted
</Directory>
`;
  fs.writeFileSync(path.join(dir, 'httpd.conf'), config);
  const child = spawn('/usr/sbin/httpd', ['-f', path.join(dir, 'httpd.conf'), '-DFOREGROUND'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stderr.on('data', data => { logs += data; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const done = once(child, 'exit'); child.kill(); await done;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const request = (url, accept = 'text/html') => new Promise((resolve, reject) => {
    const req = https.get({ hostname: '127.0.0.1', port, path: url, rejectUnauthorized: false, headers: { Host: 'fallasuissa.es', Accept: accept } }, response => {
      let body = ''; response.on('data', data => { body += data; });
      response.on('end', () => resolve({ status: response.statusCode, location: response.headers.location, body }));
    });
    req.on('error', reject);
  });
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try { await request('/'); ready = true; break; } catch { await pause(50); }
    if (child.exitCode !== null) break;
  }
  assert.ok(ready, logs);
  for (const accept of ['text/html', 'text/markdown', '*/*']) {
    const response = await request('/', accept);
    assert.equal(response.status, 200, response.body);
    assert.match(response.body, /Portada HTML/);
  }
  for (const [url, target] of [['/index.html', '/'], ['/va/index.html', '/va/'], ['/blog', '/blog.html'], ['/?lang=ca', '/va/'], ['/va/?lang=es', '/']]) {
    const response = await request(url);
    assert.equal(response.status, 301, url);
    const location = new URL(response.location);
    assert.equal(location.pathname, target, url);
    assert.equal(location.search, '', url);
  }
  assert.equal((await request('/no-existe.html')).status, 404);
  assert.equal((await request('/base.html')).status, 410);
  assert.equal((await request('/va/base.html')).status, 410);
});
