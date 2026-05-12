# 🏗️ Build y Despliegue (Gulp)

Esta guía describe cómo construir el proyecto, qué genera `dist/`, y cómo desplegarlo de forma reproducible.

## ✅ Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

El modo desarrollo ejecuta un build inicial y deja watchers activos.

```bash
npm run dev
```

Qué observa (watch): cambios en `src/scss/`, `src/js/`, `src/data/`, `src/pdf/`, `src/img/`, `src/favicon_io/`, `src/seo/` y ficheros públicos en `src/` (robots, sitemaps, manifest, `src/google*.html`, etc.). Desde v4.6.24 todo el source vive bajo `src/`.

## 🧱 Build de producción

Genera/actualiza `dist/` con HTML, CSS minificado, assets, datos y SEO.

```bash
npm run build
```

Si por error ejecutas `gulp` (sin tarea) o `npm run dev`, Gulp se quedará en modo watch y el comando no terminará.

En esos casos, para forzar un build “one-shot” explícito:

```bash
npx gulp build
```

### Contenido típico de `dist/`

- `dist/css/`: CSS compilado desde `src/scss/main.scss` + autoprefixer + cssnano
- `dist/img/`: copia de `src/img/` + generación incremental de WebP/AVIF (para PNG/JPG/JPEG)
- `dist/js/`, `dist/data/`, `dist/pdf/`, `dist/favicon_io/` (copias de `src/js/`, `src/data/`, `src/pdf/`, `src/favicon_io/`)
- `dist/*.html` (copias de `src/*.html`; gulp strips the `src/` prefix)
- `dist/robots.txt`, `dist/sitemap*.xml`, `dist/manifest.json`, `dist/sw.js`, `dist/google*.html`, `dist/ai-discovery.json`, `dist/ai-info.html` (copias de los ficheros públicos en `src/`)
- `dist/seo/` (copia de `src/seo/`)

## 🧩 Tareas Gulp útiles

Puedes ejecutar tareas individuales si solo quieres regenerar una parte:

```bash
npx gulp css
npx gulp images
npx gulp html
npx gulp rootFiles
npx gulp seo
npx gulp updateDistSitemapsLastmod
```

Para scripts utilitarios que no forman parte del flujo diario de Gulp, consulta [`scripts-utilities.md`](./scripts-utilities.md).

## 🌍 Pre-render de valenciano (v4.6.23)

Desde v4.6.23 el build pre-renderiza las traducciones VA en `dist/va/*.html`: el cuerpo HTML se sirve con texto valenciano horneado, sin depender de que JS arranque. Lo gestiona `gulpfile.js → prerenderTranslations()` reusando `src/data/translations.json`.

**Variable de entorno disponible** (kill switch):

```bash
DISABLE_I18N_PRERENDER=1 npm run build
```

Cuando se setea, el build registra `[i18n-prerender] desactivado por DISABLE_I18N_PRERENDER=1` y `dist/va/*.html` queda sin traducir (igual que `dist/*.html`). Útil para diagnosticar problemas en producción sin revertir el commit.

Detalles funcionales y reglas: [`i18n-translations.md`](./i18n-translations.md). Aspecto SEO: [`google-search-console.md`](./google-search-console.md).

Tras editar `src/data/translations.json` corre `npm run build` para regenerar el HTML pre-renderizado, y `npm run test:e2e` (incluye `i18n-prerender.e2e.spec.js` en el smoke).

## 🗺️ Sitemaps y `lastmod`

El build ejecuta `updateDistSitemapsLastmod` para actualizar `lastmod` en:

- `dist/sitemap.xml`
- `dist/sitemap-index.xml`

La fecha se calcula usando el `mtime` real de los archivos en `dist/`.

## ⚙️ Configuración del Servidor (.htaccess)

El proyecto incluye un archivo `.htaccess` optimizado para servidores Apache. Este archivo se debe subir a la raíz del servidor (`dist/` incluye el contenido que debe ir al servidor, pero asegúrate de que el archivo `.htaccess` oculto se copie también).

**Funcionalidades principales del archivo actual:**

- **HTTPS y Rutas:** Redirección forzada a HTTPS y eliminación de `www`.
- **Compresión:** Gzip activado para HTML, CSS, JS, fuentes e imágenes SVG.
- **Caché:** Políticas de expiración eficientes para assets estáticos.
- **Seguridad:** Cabeceras de seguridad como `X-Content-Type-Options`, `X-Frame-Options` y `Permissions-Policy`.
- **Tipos MIME:** Soporte para WebP, AVIF y ficheros webmanifest.
- **URLs Amigables:** Redirección automática de URLs sin extensión a `.html`.

## 🌐 Despliegue (opciones)

Este repo mantiene `dist/` versionado. Eso permite desplegar en hosts simples (FTP/hosting estático) sin necesidad de Node en el servidor.

Opciones habituales:

1. **Desplegar el contenido de `dist/`**

- Ejecuta `npm run build`
- Sube `dist/` al servidor (raíz pública)

1. **Desplegar desde Git con `dist/` ya incluido**

- Pull en el servidor/hosting
- Publicar `dist/` como carpeta raíz (según tu proveedor)

## 🧪 Tests E2E (Playwright)

Los tests E2E se ejecutan contra `dist/` para asegurar que lo que se despliega es lo que se valida.

Esto es especialmente importante para cambios de **tema/modo oscuro** y **scrollbar** (Safari/WebKit), ya que la validación se hace sobre el CSS minificado real.

```bash
# Instala navegadores (una vez por máquina)
npm run test:e2e:install

# Ejecuta la smoke suite diaria
npm run test:e2e

# Ejecuta la suite completa si el cambio toca tema, navegación, reveal, OG, meteo o snapshots
npm run test:e2e:full
```

Si el cambio visual es intencional y la regresión visual necesita nueva baseline:

```bash
npx playwright test tests/visual-regression.e2e.spec.js --update-snapshots --workers=1
npx playwright test tests/visual-regression.e2e.spec.js --workers=1
```

Guía completa: [`e2e-testing.md`](./e2e-testing.md).

Guía técnica (modo oscuro + scrollbar Safari/WebKit): [`scrollbar-theme.md`](./scrollbar-theme.md).

Si el cambio toca el banner de subvención, recuerda que la validación real ocurre sobre `dist/`. Para comprobaciones manuales rápidas en la home servida puedes usar `index.html?resetBanner=1` o `index.html?forzarBanner=1`.

## 🟦 Open Graph (WhatsApp): imagen y cache-buster

WhatsApp cachea de forma muy agresiva la URL de `og:image`. Por eso:

- La imagen de Open Graph del proyecto es `src/img/og-share.png` (en `dist/` aparece como `dist/img/og-share.png`).
- Los HTML deben referenciarla con un query param `?v=...` (por ejemplo `?v=20260122`) para forzar recacheo.

Flujo recomendado cuando cambie la imagen OG:

```bash
# Regenera la imagen (1200×630, fondo sólido, <300KB)
npm run generate:og

# Rebuild de dist/
npm run build

# Ejecuta la smoke suite diaria
npm run test:e2e

# Ejecuta la suite completa si has tocado navegación, tema, gradientes, reveal, OG, meteo o snapshots
npm run test:e2e:full
```

Guía completa: [`open-graph-whatsapp.md`](./open-graph-whatsapp.md).

Guía de utilidades relacionadas: [`scripts-utilities.md`](./scripts-utilities.md).

## 📄 PDFs

Los PDFs en `src/pdf/` se copian al build como `dist/pdf/`. Si añades un PDF nuevo (por ejemplo `src/pdf/Presentaciones/Prensentacion_Fallera_2026.pdf`), solo necesitas ejecutar `npm run build` para que aparezca en `dist/`.

## 🧹 Troubleshooting

- Si el build falla por dependencias: `rm -rf node_modules && npm install`
- Si no ves cambios en producción: confirma que has subido `dist/` y no la raíz del repo
- Si el pre-render VA produce salida inesperada: usa el kill switch `DISABLE_I18N_PRERENDER=1 npm run build` y revisa los warnings `[i18n-prerender] missing key: ...` que emite el build cuando faltan claves en `translations.va`

---

Última actualización: 7 de mayo de 2026 - v4.6.23
