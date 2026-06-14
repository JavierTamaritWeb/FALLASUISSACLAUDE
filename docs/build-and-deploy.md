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

## 🌐 Despliegue

### Opción recomendada: `npm run deploy` (script automatizado)

El sitio se despliega en Hostinger vía SSH con `tools/deploy.sh`, que **construye y sincroniza en un solo paso**:

```bash
npm run deploy
```

Qué hace, en orden:

1. `npm run build` (regenera `dist/`).
2. Comprueba la conexión SSH y que `rsync` existe en el servidor; crea el directorio remoto si falta.
3. Pide confirmación (porque sincroniza en modo **espejo con `--delete`**: borra en el servidor lo que ya no esté en `dist/`).
4. `rsync -avz --delete` de `dist/` → `~/domains/fallasuissa.es/public_html/` (incluye dotfiles como `.htaccess` y `.well-known/`; excluye `.DS_Store`).
5. Verifica que `https://fallasuissa.es` responde **HTTP 200**.

**Flags** (pásalas tras `--` con npm, p. ej. `npm run deploy -- --dry-run`):

| Flag | Efecto |
|------|--------|
| `--dry-run` | Ensayo: muestra qué cambiaría rsync **sin** tocar el servidor. Úsalo antes de un deploy dudoso. |
| `--skip-build` | Sube el `dist/` actual sin reconstruir. |
| `-y`, `--yes` | No pide confirmación (automatización; salta la red de seguridad del `--delete`). |
| `--maintenance on\|off` | Enciende/apaga el modo mantenimiento (no construye ni sincroniza). Ver más abajo. |
| `-h`, `--help` | Ayuda. |

**Conexión** (datos en la cabecera del script, sobreescribibles por variable de entorno: `SSH_USER`, `SSH_HOST`, `SSH_PORT`, `REMOTE_DIR`, `LOCAL_DIR`):

- Servidor: `REDACTED_USER@REDACTED_HOST`, puerto `65002`.
- Directorio remoto: `~/domains/fallasuissa.es/public_html`.

**Autenticación**: Hostinger usa contraseña SSH por defecto. Para un deploy sin prompts, configura una clave una sola vez:

```bash
ssh-copy-id -p 65002 REDACTED_USER@REDACTED_HOST
```

El script funciona con o sin clave; sin ella, `ssh`/`rsync` pedirán la contraseña.

### Modo mantenimiento ("En mantenimiento")

Para mostrar una pantalla "En mantenimiento" durante un rediseño sin perder SEO:

```bash
tools/deploy.sh --maintenance on    # activa: el sitio devuelve 503 a los visitantes
tools/deploy.sh --maintenance off   # desactiva: vuelve a la normalidad (200)
```

Cómo funciona:
- Sube/borra por SSH un archivo centinela `.maintenance` en la raíz del servidor. **No reconstruye ni re-despliega** nada: es un interruptor instantáneo.
- Mientras el centinela existe, el bloque de mantenimiento del `.htaccess` responde **HTTP 503 + `Retry-After`** y sirve `mantenimiento.html` (página autocontenida, bilingüe ES/VA, `noindex`). El 503 evita que Google desindexe el sitio.
- **Bypass por IP**: la IP del equipo definida en `src/.htaccess` (`RewriteCond %{REMOTE_ADDR} !=...`) sigue viendo la web real. Por eso, si ejecutas el toggle desde esa IP, `curl`/el navegador te darán **200** aunque el mantenimiento esté activo; el resto de visitantes ve 503. Para confirmar el 503 real, abre el sitio desde otra red (móvil con datos).
- ⚠️ Si cambia la IP pública del equipo (las residenciales suelen ser dinámicas), actualiza la línea `RewriteCond %{REMOTE_ADDR} !=...` en `src/.htaccess`, `npm run build` y `npm run deploy`, o te quedarás fuera junto con todos.
- Un `npm run deploy` normal **no apaga** el mantenimiento: el rsync excluye `.maintenance` (`--exclude='.maintenance'`).

Primer despliegue: `mantenimiento.html` y el bloque del `.htaccess` deben subirse una vez con un `npm run deploy` normal. El bloque queda **dormido** hasta el primer `--maintenance on`, así que desplegarlo no afecta a producción.

### Alternativas manuales

Este repo mantiene `dist/` versionado, así que también puedes desplegar sin el script:

1. **Subir el contenido de `dist/`**: ejecuta `npm run build` y sube `dist/` a la raíz pública (FTP/panel del hosting). Asegúrate de incluir el `.htaccess` oculto.
2. **Desplegar desde Git con `dist/` incluido**: haz pull en el servidor y publica `dist/` como carpeta raíz.

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
- Si `npm run deploy` falla en el paso SSH: prueba `ssh -p 65002 REDACTED_USER@REDACTED_HOST` a mano para verificar acceso, y `npm run deploy -- --dry-run` para diagnosticar sin tocar el servidor
- Si el pre-render VA produce salida inesperada: usa el kill switch `DISABLE_I18N_PRERENDER=1 npm run build` y revisa los warnings `[i18n-prerender] missing key: ...` que emite el build cuando faltan claves en `translations.va`

---

Última actualización: 13 de junio de 2026 - v4.8.0
