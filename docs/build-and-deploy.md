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

Qué observa (watch): cambios en `scss/`, `js/`, `data/`, `pdf/`, `img/`, `favicon_io/`, `seo/` y ficheros raíz (robots, sitemaps, manifest, `google*.html`, etc.).

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

- `dist/css/`: CSS compilado desde `scss/main.scss` + autoprefixer + cssnano
- `dist/img/`: copia de `img/` + generación incremental de WebP/AVIF (para PNG/JPG/JPEG)
- `dist/js/`, `dist/data/`, `dist/pdf/`, `dist/favicon_io/`
- `dist/*.html` (páginas del root)
- `dist/robots.txt`, `dist/sitemap*.xml`, `dist/manifest.json`, `dist/sw.js`, `dist/google*.html`, `dist/ai-discovery.json`, `dist/ai-info.html`
- `dist/seo/` (copia de la carpeta `seo/`)

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

## 🗺️ Sitemaps y `lastmod`

El build ejecuta `updateDistSitemapsLastmod` para actualizar `lastmod` en:

- `dist/sitemap.xml`
- `dist/sitemap-index.xml`

La fecha se calcula usando el `mtime` real de los archivos en `dist/`.

## 🌐 Despliegue (opciones)

Este repo mantiene `dist/` versionado. Eso permite desplegar en hosts simples (FTP/hosting estático) sin necesidad de Node en el servidor.

Opciones habituales:

1) **Desplegar el contenido de `dist/`**
- Ejecuta `npm run build`
- Sube `dist/` al servidor (raíz pública)

2) **Desplegar desde Git con `dist/` ya incluido**
- Pull en el servidor/hosting
- Publicar `dist/` como carpeta raíz (según tu proveedor)

## 🧪 Tests E2E (Playwright)

Los tests E2E se ejecutan contra `dist/` para asegurar que lo que se despliega es lo que se valida.

Esto es especialmente importante para cambios de **tema/modo oscuro** y **scrollbar** (Safari/WebKit), ya que la validación se hace sobre el CSS minificado real.

```bash
# Instala navegadores (una vez por máquina)
npm run test:e2e:install

# Ejecuta tests
npm run test:e2e
```

Guía completa: [`e2e-testing.md`](./e2e-testing.md).

Guía técnica (modo oscuro + scrollbar Safari/WebKit): [`scrollbar-theme.md`](./scrollbar-theme.md).

## 📄 PDFs

Los PDFs en `pdf/` se copian al build como `dist/pdf/`. Si añades un PDF nuevo (por ejemplo `pdf/Presentaciones/Prensentacion_Fallera_2026.pdf`), solo necesitas ejecutar `npm run build` para que aparezca en `dist/`.

## 🧹 Troubleshooting

- Si el build falla por dependencias: `rm -rf node_modules && npm install`
- Si no ves cambios en producción: confirma que has subido `dist/` y no la raíz del repo

---

*Última actualización: 22 de enero de 2026*
