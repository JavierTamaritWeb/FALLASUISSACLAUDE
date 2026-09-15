const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const gulpfile = path.resolve(__dirname, '../../gulpfile.js');

for (const scenario of [
  { task: 'css', file: 'src/scss/main.scss', content: '.error { color: $variable-inexistente; }', error: /Undefined variable/ },
  { task: 'js', file: 'src/js/error.js', content: 'const = sintaxis rota;', error: /SyntaxError/ }
]) {
  test(`el build ${scenario.task} falla con código distinto de cero ante un fuente inválido`, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'falla-build-'));
    try {
      mkdirSync(path.dirname(path.join(dir, scenario.file)), { recursive: true });
      writeFileSync(path.join(dir, scenario.file), scenario.content);
      const script = `require(${JSON.stringify(gulpfile)}).${scenario.task}().then(() => process.exit(0), error => { console.error(error); process.exit(1); })`;
      const result = spawnSync(process.execPath, ['-e', script], { cwd: dir, encoding: 'utf8', timeout: 15000 });
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0, 'No debe publicarse un build aparentemente correcto con CSS/JS inválido');
      assert.match(result.stderr, scenario.error);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('un build válido escribe CSS y JavaScript antes de resolver', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'falla-build-'));
  try {
    mkdirSync(path.join(dir, 'src/scss'), { recursive: true });
    mkdirSync(path.join(dir, 'src/js'), { recursive: true });
    writeFileSync(path.join(dir, 'src/scss/main.scss'), '.ejemplo { color: #123456; }');
    writeFileSync(path.join(dir, 'src/js/ejemplo.js'), 'window.ejemplo = true;');
    const script = `const tasks = require(${JSON.stringify(gulpfile)}); Promise.all([tasks.css(), tasks.js()]).catch(error => { console.error(error); process.exitCode = 1; });`;
    const result = spawnSync(process.execPath, ['-e', script], { cwd: dir, encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(path.join(dir, 'dist/css/main.css'), 'utf8'), /#123456/);
    assert.match(readFileSync(path.join(dir, 'dist/js/ejemplo.js'), 'utf8'), /window\.ejemplo/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Sharp convierte PNG y JPEG a WebP y AVIF y conserva las dimensiones', async () => {
  const sharp = require('sharp');
  for (const inputFormat of ['png', 'jpeg']) {
    const input = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#ff6f61' } }).toFormat(inputFormat).toBuffer();
    for (const outputFormat of ['webp', 'avif']) {
      const output = await sharp(input).toFormat(outputFormat).toBuffer();
      const metadata = await sharp(output).metadata();
      assert.equal(metadata.width, 16);
      assert.equal(metadata.height, 12);
    }
  }
});

test('el SCSS real compila sin avisos y dentro del presupuesto de peso (auditoría sep-2026)', async () => {
  const sass = require('sass');
  const zlib = require('node:zlib');
  const avisos = [];
  const logger = { warn: (message, options) => avisos.push(`${message} @ ${options?.span?.url ?? ''}:${options?.span?.start?.line ?? ''}`), debug: () => {} };
  const entrada = path.resolve(__dirname, '../../src/scss/main.scss');
  const { css } = sass.compile(entrada, { style: 'compressed', logger, loadPaths: [path.dirname(entrada)] });
  assert.deepEqual(avisos, [], `Dart Sass emite avisos (deprecaciones o mezclas de reglas):\n${avisos.join('\n')}`);
  const bytes = Buffer.byteLength(css);
  const gz = zlib.gzipSync(css).length;
  assert.ok(bytes <= 230 * 1024, `main.css comprimido por Sass pesa ${bytes} B (> 230 KB): revisa CSS muerto o duplicados`);
  assert.ok(gz <= 42 * 1024, `main.css gzip pesa ${gz} B (> 42 KB)`);
  // backdrop-filter siempre con su par -webkit- (browserslist + autoprefixer, 4.39.0)
});

test('autoprefixer genera -webkit-backdrop-filter para cada backdrop-filter (browserslist, 4.39.0)', () => {
  const distCss = path.resolve(__dirname, '../../dist/css/main.css');
  if (!require('node:fs').existsSync(distCss)) return; // sin build previo no hay nada que comprobar
  const css = readFileSync(distCss, 'utf8');
  const sinPrefijo = (css.match(/(?<![-\w])backdrop-filter:/g) || []).length;
  const conPrefijo = (css.match(/-webkit-backdrop-filter:/g) || []).length;
  assert.equal(conPrefijo, sinPrefijo, `dist/css/main.css: ${sinPrefijo} backdrop-filter y ${conPrefijo} -webkit-backdrop-filter; falta browserslist o autoprefixer`);
});
