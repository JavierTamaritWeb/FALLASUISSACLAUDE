// Verifica que el pre-render de traducciones VA (v4.6.23) genera HTMLs en
// dist/va/ con el texto valenciano horneado, sin romper la versión ES ni los
// atributos data-i18n* (que el toggle runtime sigue necesitando).

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

function readDist(relPath) {
  return fs.readFileSync(path.join(distDir, relPath), 'utf8');
}

test.describe('i18n pre-render: VA pre-renderizada en build (sin JS)', () => {
  test('dist/va/index.html contiene texto valenciano horneado', () => {
    const html = readDist('va/index.html');
    // nav.inicio: ES "Inicio" -> VA "Inici"
    expect(html).toMatch(/data-i18n="nav\.inicio"[^>]*>\s*Inici\s*</);
    // historia.archivos.titulo: ES "Archivos" -> VA "Arxius"
    expect(html).toMatch(/data-i18n="historia\.archivos\.titulo"[^>]*>\s*Arxius\s*</);
    // No debe haber rastro del texto ES en la posición canónica
    expect(html).not.toMatch(/data-i18n="nav\.inicio"[^>]*>\s*Inicio\s*</);
    expect(html).not.toMatch(/data-i18n="historia\.archivos\.titulo"[^>]*>\s*Archivos\s*</);
  });

  test('dist/index.html (ES) sigue intacto con el texto en español', () => {
    const html = readDist('index.html');
    expect(html).toMatch(/data-i18n="nav\.inicio"[^>]*>\s*Inicio\s*</);
    expect(html).toMatch(/data-i18n="historia\.archivos\.titulo"[^>]*>\s*Archivos\s*</);
    // Y NO debe contener la VA en la misma posición
    expect(html).not.toMatch(/data-i18n="nav\.inicio"[^>]*>\s*Inici\s*</);
    expect(html).not.toMatch(/data-i18n="historia\.archivos\.titulo"[^>]*>\s*Arxius\s*</);
  });

  test('los atributos data-i18n* siguen presentes en dist/va/ para el toggle runtime', () => {
    const html = readDist('va/index.html');
    // Si el pre-render eliminara los atributos, el toggle a ES en runtime se rompería.
    expect(html).toContain('data-i18n="nav.inicio"');
    expect(html).toContain('data-i18n="historia.archivos.titulo"');
    // Y debe haber muchos más (sanity check del orden de magnitud).
    const dataI18nCount = (html.match(/\bdata-i18n="/g) || []).length;
    expect(dataI18nCount).toBeGreaterThan(50);
  });

  test('dist/va/lafalla.html también queda pre-renderizada', () => {
    const html = readDist('va/lafalla.html');
    // nav.inicio sigue siendo "Inici" en valenciano
    expect(html).toMatch(/data-i18n="nav\.inicio"[^>]*>\s*Inici\s*</);
  });

  test('los assets de dist/va/ usan rutas absolutas (la variante VA no tiene css/js/img propios)', () => {
    const vaHtml = readDist('va/index.html');
    expect(vaHtml).toMatch(/href="\/css\/main\.css/);
    expect(vaHtml).toMatch(/src="\/js\/lang\.js/);
    // Ninguna referencia relativa que resolvería a /va/css|js|img|data|pdf (404)
    expect(vaHtml).not.toMatch(/\b(?:src|href|poster|srcset|data-board-source)="(?:css|js|img|data|pdf)\//);
    // La versión ES mantiene las rutas relativas del source
    const esHtml = readDist('index.html');
    expect(esHtml).toMatch(/href="css\/main\.css/);
  });

  test('lang attribute es "ca" en dist/va/ y "es" en dist/', () => {
    const vaHtml = readDist('va/index.html');
    const esHtml = readDist('index.html');
    expect(vaHtml).toMatch(/<html\s+lang="ca"/i);
    expect(esHtml).toMatch(/<html\s+lang="es"/i);
  });
});
