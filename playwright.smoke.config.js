// @ts-check
const { defineConfig } = require('@playwright/test');
const baseConfig = require('./playwright.config');

module.exports = defineConfig({
  ...baseConfig,
  testMatch: [
    '**/nav.e2e.spec.js',
    '**/i18n.e2e.spec.js',
    '**/board.e2e.spec.js',
    '**/countdown.e2e.spec.js',
    '**/banner-subvencion.e2e.spec.js',
    '**/index-colaboraciones.e2e.spec.js',
    '**/scss-guardrails.e2e.spec.js'
  ]
});
