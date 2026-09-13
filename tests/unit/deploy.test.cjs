const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function simulate(args, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'falla-deploy-'));
  try {
    for (const sub of ['tools', 'dist', 'bin']) fs.mkdirSync(path.join(dir, sub));
    fs.copyFileSync(path.resolve(__dirname, '../../tools/deploy.sh'), path.join(dir, 'tools/deploy.sh'));
    if (options.config) fs.writeFileSync(path.join(dir, 'tools/deploy.env'), options.config);
    fs.writeFileSync(path.join(dir, 'dist/index.html'), 'sitio');
    for (const command of ['ssh', 'rsync', 'curl']) {
      const body = command === 'curl'
        ? 'printf "%s" "${TEST_HTTP_CODE:-200}"\ncase "$*" in *-fsS*) [ "$TEST_HTTP_CODE" != 503 ] ;; esac\n'
        : 'printf "%s %s\\n" "' + command + '" "$*" >> "$TEST_COMMAND_LOG"\n';
      fs.writeFileSync(path.join(dir, 'bin', command), '#!/bin/bash\n' + body, { mode: 0o755 });
    }
    const log = path.join(dir, 'commands.log');
    const env = { ...process.env, PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`, SSH_USER: 'prueba', SSH_HOST: 'example.invalid',
      MAINT_TOKEN: '', TEST_COMMAND_LOG: log, TEST_HTTP_CODE: options.code || '200' };
    if (options.configOnly) {
      for (const key of ['SSH_USER', 'SSH_HOST', 'SSH_PORT', 'REMOTE_DIR', 'LOCAL_DIR', 'SITE_URL', 'MAINT_TOKEN']) delete env[key];
    }
    const result = spawnSync('bash', [path.join(dir, 'tools/deploy.sh'), ...args], { encoding: 'utf8', timeout: 10000,
      env
    });
    return { ...result, commands: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('dry-run de mantenimiento no ejecuta comandos remotos', () => {
  const result = simulate(['--dry-run', '--maintenance', 'on']);
  assert.equal(result.status, 0);
  assert.equal(result.commands, '');
});

test('dry-run de despliegue no crea directorios remotos', () => {
  const result = simulate(['--dry-run', '--skip-build']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.commands, /mkdir|touch|sed -i/);
  assert.match(result.commands, /rsync .* -n /);
});

test('mantenimiento reconoce HTTP 503 sin concatenar un segundo código', () => {
  const result = simulate(['--maintenance', 'on'], { code: '503' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Mantenimiento ACTIVO/);
  assert.doesNotMatch(result.stderr, /503000/);
});

test('una verificación de mantenimiento fallida devuelve código de error', () => {
  const result = simulate(['--maintenance', 'off'], { code: '503' });
  assert.notEqual(result.status, 0);
});

test('la configuración exportada tiene prioridad sobre deploy.env', () => {
  const result = simulate(['--dry-run', '--skip-build'], { config: 'SSH_HOST=host-del-archivo.invalid\n' });
  assert.equal(result.status, 0);
  assert.match(result.commands, /prueba@example\.invalid/);
  assert.doesNotMatch(result.commands, /host-del-archivo/);
  const fromFile = simulate(['--dry-run', '--skip-build'], {
    configOnly: true, config: 'SSH_USER=prueba\nSSH_HOST=host-del-archivo.invalid\n'
  });
  assert.equal(fromFile.status, 0, fromFile.stderr);
  assert.match(fromFile.commands, /prueba@host-del-archivo\.invalid/);
});
