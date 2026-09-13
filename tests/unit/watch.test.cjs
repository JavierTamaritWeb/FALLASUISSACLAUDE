const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: pause } = require('node:timers/promises');

test('gulp watch regenera traducciones VA, hashes de assets y esquema SEO', { timeout: 20000 }, async t => {
  const repo = path.resolve(__dirname, '../..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'falla-watch-'));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
  fs.copyFileSync(path.join(repo, 'gulpfile.js'), path.join(dir, 'gulpfile.js'));
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(dir, 'node_modules'));
  for (const folder of ['pdf', 'img', 'favicon_io', '.well-known']) fs.mkdirSync(path.join(dir, 'src', folder), { recursive: true });
  write('src/scss/main.scss', '.ejemplo { color: #123456; }');
  write('src/js/ejemplo.js', 'window.ejemplo = 1;');
  const html = '<html lang="es"><head><title>Inicio</title><link href="css/main.css" rel="stylesheet"></head><body><p data-i18n="nav.inicio">Inicio</p><script src="js/ejemplo.js"></script></body></html>';
  write('src/index.html', html);
  write('src/llibret_2026.html', html);
  write('src/mantenimiento.html', '<p>Mantenimiento inicial</p>');
  for (const name of ['translations.json', 'board.json', 'sports-board.json', 'eventos.json']) {
    write(`src/data/${name}`, fs.readFileSync(path.join(repo, 'src/data', name)));
  }
  write('src/seo/schema-organization.json', fs.readFileSync(path.join(repo, 'src/seo/schema-organization.json')));
  const script = `const gulp = require('gulp'); const original = gulp.watch;
    gulp.watch = (...args) => { const watcher = original(...args); watcher.on('ready', () => console.log('WATCH_READY')); return watcher; };
    const tasks = require('./gulpfile'); gulp.series(tasks.build, tasks.dev)(error => { if (error) { console.error(error); process.exit(1); } });`;
  const child = spawn(process.execPath, ['-e', script], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const done = once(child, 'exit');
      child.kill();
      await done;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  async function until(predicate) {
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      assert.equal(child.exitCode, null, logs);
      if (predicate()) return;
      await pause(50);
    }
    assert.fail(`No se regeneraron los derivados esperados. ${logs}`);
  }
  await until(() => logs.includes('WATCH_READY'));
  const versionBefore = read('dist/index.html').match(/main\.css\?v=([^"']+)/)[1];
  const translations = JSON.parse(read('src/data/translations.json'));
  translations.va.nav.inicio = 'Inici revisat en la prova';
  write('src/data/translations.json', JSON.stringify(translations));
  await until(() => read('dist/va/index.html').includes('Inici revisat en la prova'));
  write('src/js/ejemplo.js', 'window.ejemplo = 2;');
  await until(() => read('dist/index.html').match(/main\.css\?v=([^"']+)/)[1] !== versionBefore);
  const schema = JSON.parse(read('src/seo/schema-organization.json'));
  schema.organization.description = 'Descripción actualizada durante watch';
  write('src/seo/schema-organization.json', JSON.stringify(schema));
  await until(() => read('dist/index.html').includes('Descripción actualizada durante watch'));
  write('src/mantenimiento.html', '<p>Mantenimiento revisado</p>');
  await until(() => read('dist/mantenimiento.html').includes('Mantenimiento revisado'));
});
