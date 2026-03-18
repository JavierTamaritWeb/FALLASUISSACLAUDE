// @ts-check
const { defineConfig } = require('@playwright/test');

const shouldReuseServer = process.env.PLAYWRIGHT_REUSE_SERVER === 'true';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled'
    }
  },
  fullyParallel: true,
  reporter: [['list']],
  snapshotDir: './tests/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Ocultar el banner de subvención en tests (el script lee esta clave y hace remove())
    contextOptions: {
      storageState: {
        cookies: [],
        origins: [{
          origin: 'http://127.0.0.1:4173',
          localStorage: [{ name: 'bannerSubvencionCerrado', value: 'true' }]
        }]
      }
    }
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs --port 4173 --root dist',
    url: 'http://127.0.0.1:4173',
    // Para snapshots y E2E visuales es más seguro arrancar siempre dist limpio.
    // Si hace falta reutilizar un servidor local ya levantado, habilitarlo explícitamente.
    reuseExistingServer: shouldReuseServer,
    timeout: 60_000
  }
});
