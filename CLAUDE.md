# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

**Versión:** 4.11.0 · **Última actualización:** 22 de junio de 2026

> El historial de versiones está en el **Changelog** al final. El comportamiento del estado actual se documenta en **Arquitectura** y **Restricciones**.

## Visión general del proyecto

WEBFALLASUISSA es el sitio web oficial de Falla Suissa - L'Alqueria del Favero (#396), una comisión fallera valenciana tradicional. Sitio estático con eventos, galerías, integración meteorológica y soporte de idiomas español/valenciano.

- **Producción**: [fallasuissa.es](https://fallasuissa.es)
- **Repositorio**: [xavitamarit74-code/FALLASUISSACLAUDE](https://github.com/xavitamarit74-code/FALLASUISSACLAUDE)

## Comandos de build

```bash
npm run dev              # Build + watch de cambios
npm run build            # Build de producción (salida a dist/)
npm run test:e2e         # Ejecuta la suite smoke de Playwright E2E
npm run test:e2e:full    # Ejecuta la suite completa de Playwright E2E
npm run test:e2e:visual  # Solo snapshots de regresión visual
npm run test:e2e:install # Instala los navegadores de Playwright (primera vez)
npm run test:e2e:ui      # UI interactiva de la suite smoke
npm run test:e2e:ui:full # UI interactiva de la suite completa

# Tareas de Gulp individuales
npx gulp css             # Compila solo SCSS
npx gulp images          # Optimiza imágenes (WebP/AVIF)
npx gulp js              # Copia JavaScript
npx gulp html            # Procesa HTML
npx gulp data            # Copia archivos JSON de datos

# Ejecutar un test concreto
npx playwright test tests/nav.e2e.spec.js
npx playwright test -g "mobile"       # Filtrar por patrón
npx playwright test --headed           # Navegador visible
npx playwright test --debug            # Modo debug
PLAYWRIGHT_REUSE_SERVER=true npx playwright test  # Evita reiniciar el servidor (debugging)

# SEO y Open Graph
npm run seo:dist         # Copia la carpeta SEO a dist/
npm run generate:og      # Regenera src/img/og-share.png (1200x630)
```

## Reglas importantes

- TODOS los archivos fuente viven bajo `src/`. NUNCA pongas nuevos archivos fuente (HTML, JS, SCSS, datos JSON, imágenes, PDFs, sitemaps, etc.) en la raíz del repo — ahí solo van configs/tooling (`package.json`, `gulpfile.js`, `playwright*.config.js`, `.gitignore`, `README.md`, `CLAUDE.md`, `LICENSE*`)
- SIEMPRE ejecuta `npm run build` antes de hacer commit
- SIEMPRE ejecuta `npm run test:e2e` tras cambios en CSS/JS
- Ejecuta `npm run test:e2e:full` al tocar navegación, modo oscuro, transiciones de gradiente, metadatos OG, UI de meteo, Swiper o snapshots visuales
- NUNCA edites archivos en `dist/` directamente (son generados)
- NUNCA elimines variables SCSS sin revisar `tests/scss-guardrails.e2e.spec.js`
- NUNCA referencies `og-share.png` sin el cache-buster `?v=YYYYMMDD` (caché de WhatsApp)
- NUNCA cambies fondos de gradiente a colores sólidos directamente — usa el patrón de opacidad con `::before` (ver `docs/global-styles.md`)
- Al añadir traducciones: actualiza `src/data/translations.json` para AMBOS `es` y `va`
- Los comentarios en el código se escriben en español

## Arquitectura

### Stack tecnológico

- **Build**: Gulp 5 + Dart Sass + PostCSS (autoprefixer) + CSSNano + Terser (minificación JS) + Sharp
- **Frontend**: HTML5, SCSS (BEM), módulos JavaScript ES6+
- **Librerías (CDN)**: Swiper.js v11 (carruseles, jsDelivr), Anime.js v3.2.1 (animaciones, cdnjs), EmailJS v4 (formulario de contacto, jsDelivr)
- **Librerías (npm)**: Flatpickr v4.6.13 (selector de fechas)
- **Testing**: Playwright E2E (34 suites en la matriz completa, 8 suites smoke por defecto). La suite smoke (`npm run test:e2e`) ejecuta: nav, i18n, board, reveal-on-scroll, countdown, banner-subvencion, index-colaboraciones, scss-guardrails

### Estructura de directorios

Todo el código fuente vive bajo `src/`; la raíz del repo solo contiene tooling/configs/docs y la salida del build.

- `src/` — **Todos los archivos fuente**:
  - `src/scss/` — SCSS modular (orden de imports en `main.scss`: abstracts > base > optimization > layout > animaciones > components > sociales)
  - `src/js/` — Módulos ES6+ cargados por página
  - `src/data/` — JSON: `translations.json`, `board.json`, `sports-board.json`, `eventos.json`, `calendarData.json`, `fallas.json`, `config.json`, `dataPages[1-8].json` (una por galería `galeria_1`–`galeria_8`; `blog.json` eliminado en v4.6.0)
  - `src/img/` — Imágenes fuente raster + vectoriales (el build copia + genera WebP/AVIF en `dist/img/`)
  - `src/pdf/` — PDFs con wrappers HTML para favicon/preview social
  - `src/seo/` — Sitemaps, schema, variantes de robots
  - `src/favicon_io/` — Assets de favicon
  - `src/.well-known/` — Archivos de agent-readiness (api-catalog, agent-skills)
  - `src/*.html` — Todo el HTML de páginas (`index.html`, `lafalla.html`, páginas de blog, galerías, legal, `deportes.html`, `nuevos-falleros.html`, etc.)
  - `src/manifest.json`, `src/robots*.txt`, `src/sitemap*.xml`, `src/sw.js`, `src/.htaccess`, `src/ai-discovery.json` — archivos de raíz pública copiados tal cual a `dist/`
- `dist/` — Salida generada (NO editar). Misma estructura con el prefijo `src/` eliminado por las tareas de gulp.
- `tests/` — Specs E2E de Playwright
- `scripts/` — Utilidades Node: `serve-dist.mjs` (servidor de tests), `generate-og-image.mjs` (imagen OG)
- `docs/` — Documentación técnica (Markdown)

> 📌 **Convención de rutas en este documento**: las referencias a archivos fuente siempre llevan el prefijo `src/` (p. ej. `src/js/lang.js`, `src/data/translations.json`). Las rutas URL dentro del código HTML/JS (`<script src="js/foo.js">`, `fetch('/data/...')`, `<img src="img/...">`) son URLs del `dist/` servido y por tanto NO llevan el prefijo `src/`.

### Patrones arquitectónicos clave

**Modo oscuro** (`src/js/dark.js`): aplica las clases `.modo-oscuro`/`.modo-claro`. El CSS usa pseudo-elementos `::before` para las transiciones de gradiente a sólido porque CSS no puede animar directamente entre `linear-gradient` y un color sólido. El gradiente de fondo vive en `body::before` para permitir un cross-fade de opacidad a negro.

**Multi-idioma** (`src/js/lang.js` + `src/js/initTranslations.js` + `gulpfile.js → prerenderTranslations`): los elementos usan `data-i18n="section.key"` (más `data-i18n-aria-label`, `data-i18n-placeholder`, `data-i18n-alt`, `data-i18n-title`, `data-i18n-format="paragraphs"`, `data-i18n-dynamic`). Carga `src/data/translations.json` al cargar la página y persiste la elección en localStorage. `lang.js` dispara `translationsReady` tras la carga y `langChanged` al cambiar. Los componentes dinámicos (board) deben comprobar `window.translations` primero; si no está listo, escuchar `translationsReady` antes de renderizar. Desde v4.6.23 el build **pre-renderiza el valenciano**: `dist/va/*.html` lleva el texto VA horneado en el body antes de que cargue JS (mejor SEO + accesibilidad sin JS). El toggle ES/VA del header sigue funcionando en runtime porque los atributos `data-i18n*` permanecen en el HTML; al alternar, se reescribe el DOM. Ver restricción *Pre-render i18n VA*.

**Pipeline de build HTML** (`gulpfile.js` → `htmlTask` → `modifyHtmlStream`): única fuente de verdad para el SEO multi-idioma. Para cada HTML fuente (1) elimina cualquier `<link rel="canonical">` y `<link rel="alternate" hreflang>` preexistente para que los archivos fuente no diverjan, (2) reinyecta un `canonical` autoreferencial (`https://fallasuissa.es/<file>` para ES, `https://fallasuissa.es/va/<file>` para VA) más un bloque `hreflang` bidireccional (`es`, `ca`, `x-default`), y (3) fusiona el JSON-LD de Schema.org `Event` desde `src/data/board.json` en `index.html`/`eventos.html`. También genera una variante `/va/` de cada página con `lang="ca"`. Los `<lastmod>` del sitemap se autoactualizan según los mtimes de los archivos en `dist/`. El `canonical`/`hreflang` legado en el HTML fuente es inofensivo (se elimina en el build); NO añadas nuevos manuales. Ver restricción *SEO multi-idioma*.

**Tablón de anuncios (Bulletin Board)** (`src/js/board.js`): multi-instancia desde v4.7.2. El script descubre **todos** los `<div class="board">`, lee `data-board-source` por elemento (default `data/board.json`) y renderiza cada uno independientemente. Tableros desplegados: `#notesBoard` (fuente por defecto, en `index.html`/`eventos.html`) y `#sportsBoard` (`data-board-source="data/sports-board.json"`, en `deportes.html`). Las fuentes JSON se cachean en `boardSourceCache` (Map url→Promise); re-render coordinado al recibir `langChanged`/`translationsReady`. Cada nota admite un campo opcional `imagen` (`{ url, alt: { es, va } }`) renderizado como `<figure class="board__figure"><img class="board__image" loading="lazy">`. Las notas con `imagen` y/o `adjuntos` se envuelven en `<article class="board__card">`; las notas simples renderizan como `<article class="board__note">`. Los adjuntos aparecen como enlaces "Ver imagen"/"Descargar". **Empty-state (v4.11.0):** si un tablón no tiene notas activas, `renderBoardInto` pinta una nota de marcador con el mismo aspecto que una real (`<article class="board__note board__empty">` con pinza + `board__note-content`), cuyo texto sale de la clave i18n `board.empty` (re-render en `langChanged`/`translationsReady`); en cuanto se añaden notas al JSON se muestran automáticamente y el marcador desaparece. Actualmente `board.json` (Eventos) se sirve **vacío** (solo el empty-state); `sports-board.json` (Deportes) mantiene sus notas. Añade un tablón en cualquier sitio con `<div class="board" data-board-source="data/mi-board.json" id="miBoard"></div>` + `<script src="js/board.js" defer>` — sin tocar JS. Ver restricción *Multi-board* y *Empty-state del tablón*.

**Deportes** (`src/scss/components/_deportes.scss` + `deportes.html` + `.deportes--teaser` en `index.html`): el orden de la página (desde v4.7.5) es hero → intro → aside delegados → `#sportsBoard` (tablón JCF). El iframe Drive + el CTA "Abrir en pestaña nueva" se MOVIERON a `nuevos-falleros.html` en v4.7.5 — `deportes.html` ya no embebe ningún documento Drive. El tablón lee `src/data/sports-board.json`; los PDFs viven en `src/pdf/JCF-2026-27/` (añadir/quitar notas ahí sin tocar HTML/JS). El teaser de home (`.deportes--teaser`, `data-index="8"`) es solo intro + CTA `Ver Deportes` → `deportes.html` (sin iframe/tablón en home — preserva LCP/CLS). Fondo con gradiente `linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%)` (azul institucional) con overlay `::before` que se desvanece a `v.$negro` opaco en modo oscuro. Traducciones bajo `deportes.{titulo,intro,ctaIndex,ctaIndexAria,tablonTitulo,tablonAriaLabel,delegadosTitulo}` (es/va/en/fr); las keys `regionLabel/iframeTitle/fallback/abrirExterno/abrirExternoAria` quedan en el JSON sin uso (reutilizables si vuelve un iframe Drive). Los CTA usan la clase global `.boton` — NO redefinas estilos de botón en `_deportes.scss`.

**Nuevos Falleros** (`src/scss/components/_nuevos-falleros.scss` + `nuevos-falleros.html` + `.nuevos-falleros--teaser` en `index.html`): sección de onboarding (añadida en v4.7.5). Orden de la página: header-inner → `<h3>Documentos de interés general</h3>` (alineado a la izquierda, `.nuevos-falleros__subtitulo--left`) → **iframe Drive** (file ID `1suCLG0EG6eU5TN5b2fIdOE89U17i-l3o-m_AjaSdYxU`) + skeleton + fallback `<noscript>` → CTA "Abrir en pestaña nueva" (enlace directo a `/view`) → `<h3>Formularios descargables</h3>` (centrado) → grid de 2 tarjetas que enlazan a `autorizacion-imagen.html` (mayores) y `autorizacion-imagen-menor.html` (menores). El teaser de home (`.nuevos-falleros--teaser`, `data-index="12"`) es heading (icono `logo-escudo-cutty.svg`) + intro corta + CTA "Saber más" → `nuevos-falleros.html`. Fondo `v.$blanco-hueso` (claro) → `v.$negro-casi` (oscuro). Traducciones: `nuevosFalleros.{titulo,introIndex,ctaIndex,ctaIndexAria,intro,formulariosTitulo,docInteresTitulo,formMayores,formMenores,regionLabel,iframeTitle,fallback,abrirExterno,abrirExternoAria}` + `nav.nuevosFalleros` (4 idiomas). La doble banda separadora del doc-wrapper y la alineación del subtítulo se rigen por la restricción *Nuevos Falleros*.

**Representantes** (`src/scss/components/_representantes.scss` + `src/js/acc.js` + acordeón en `index.html`/`lafalla.html`): subsección dentro de Historia/Archivos (añadida en v4.7.7). Acordeón `accordion--representantes` con dos paneles cerrados por defecto: "Representantes 2025-26" (4 miniaturas — Fallera Mayor, Presidente, Fallera Mayor Infantil, Presidente Infantil, los mismos 4 cargos que la Plana Mayor) y "Representantes 2024-25" ("En construcción" hasta que haya datos publicables; el slot de Presidente reutilizará a José Santos Quiles de 2025-26). Grid `representantes-grid`: 2 columnas <768px, 4 columnas en una fila ≥768px (gap 2.5rem ≥1200px). El salto 2→4 se hace a 768px (no a 1200px) para que las miniaturas se mantengan pequeñas en tablets/laptops. Imágenes: `aspect-ratio: 3/4`, `max-width: 24rem`, borde coral `2px solid v.$primary-color`, hover `translateY(-0.4rem)` (neutralizado con `prefers-reduced-motion`); reutiliza las JPGs existentes en `src/img/` (FalleraMayor, Presidente, FalleraMayorInfantil, PresidenteInfantil — el pipeline autogenera AVIF/WebP). Bloque i18n `historia.archivos.representantes` (`titulo`, `edicion202425/202526`, `enConstruccion`, `cargos.{falleraMayor,presidente,falleraMayorInfantil,presidenteInfantil}`) — solo ES/VA (EN/FR no tienen `archivos`), pre-renderizado en VA. IDs únicos por página: sufijo `-index` en `index.html`, `-lafalla` en `lafalla.html`. **Visual (v4.7.8)**: el panel hereda el gradiente azul institucional del `.accordion__content` base (mismo fondo que Plana Mayor/HOPE; `v.$negro` en modo oscuro). Texto de cargo + placeholder en `v.$blanco-hueso`; nombre en coral (`v.$primary-color`, como `.accordion__nombre-plana-mayor`). `box-shadow` de miniaturas `rgba(0,0,0,.35)` en reposo / `.5` en hover; placeholder de imagen `rgba(255,255,255,.08)`. Modo oscuro: titular `v.$negro`, hover `v.$negro-casi`, glow coral `rgba(255,111,97,.18-.32)`, cargo/placeholder `v.$gris-muy-claro` (contraste ≈14:1, WCAG AAA). Ver restricción *Acordeón Representantes*.

**Blog** (`blog.html`, `blog-somni.html`, `blog-anima.html`): blog estático con SEO por artículo. Cada artículo es una página HTML independiente con su propio `<title>`, `<meta description>`, Schema.org `BlogPosting`, Open Graph (`og:type=article`, `article:published_time`) y Twitter Card. Las tarjetas de blog en `blog.html`/`index.html` son HTML estático hardcodeado (sin render JS); el texto traducible usa `data-i18n` desde `src/data/translations.json`. SCSS en `src/scss/components/_blog.scss` con los bloques `.blog` (listado) y `.blog-detail` (artículo); `.blog-detail__article` usa el mismo overlay de gradiente con `::before` que countdown/quieres-mas, y las imágenes interiores usan `z-index: 2` para quedar por encima. Nuevo post = página HTML estática + traducciones + tarjetas en `blog.html`/`index.html` + entrada en `sitemap.xml`.

**Colaboraciones** (`src/scss/components/_colaboraciones.scss` + `src/js/colaboraciones-lightbox.js`): sección compartida HOPE en `index.html` y `colaboraciones.html`. Grid responsivo (2 columnas en móvil, 3 desde `768px`), `object-fit: contain`, lightbox accesible. Tests: `tests/index-colaboraciones.e2e.spec.js`.

**Vídeo Dron** (`src/js/video-dron.js` + `src/scss/components/_video-dron.scss`): reproductor de vídeo aéreo dentro de `<main class="falla">` en `index.html` y `lafalla.html`, entre el slider del monumento y la sección falleros/nosotros. Póster custom + SVG de play. Controles: play/pause, reinicio, pantalla completa, mute, slider de volumen (wrapper tipo píldora, relleno color primario) y barra de progreso seekable — todos sincronizados entre el reproductor inline y el de pantalla completa. Vídeo en `src/img/dron/`. Usa `reveal reveal--soft` para la animación de scroll.

**Ofrenda** (`src/scss/components/_ofrenda.scss` + `src/js/ofrenda-video.js` + `ofrenda.html`): sección en `index.html` (entre "La Falla" y "Colaboraciones") y página dedicada `ofrenda.html`. Galería de 3 imágenes (grid, `aspect-ratio: 3/4`, imágenes `position: absolute` sobre `.ofrenda__figura` — ver restricción) con lightbox vía `.colaboraciones-mosaic__trigger`, más un reproductor de vídeo (mismos controles que video-dron). Fondo `fondo_traje.png` con overlay `::before` `rgba(245,245,245,0.85)` (claro) → `rgba(0,0,0,0.85)` (oscuro). Enlace de nav "Ofrenda" entre "La Falla" y "Colaboraciones" (`nav.ofrenda`). Secciones separadas por `<hr class="seccion-hr">` (visible en todos los tamaños).

**Navegación Timeline** (`src/js/timeline.js` + `src/scss/components/_timeline.scss`): indicador de progreso lateral con un punto por cada sección `[data-index]` (salta el hero en el índice 0). Solo desktop (≥768px), oculto cuando el hero es visible. Construye un `<nav class="timeline">` con puntos clicables + líneas conectoras; el punto activo se rastrea vía IntersectionObserver.

**Páginas legales** (`aviso-legal.html`, `privacidad.html`, `cookies.html` + `src/scss/components/_contenido-legal.scss`): páginas RGPD/LSSI/ePrivacy usando el patrón `header-inner` y el componente `.contenido-legal` (tarjeta blanca sobre gris, soporte modo oscuro). El footer de cada página incluye `<nav class="footer__legal">` enlazando las 3 páginas legales.

**Banner de cookies** (`src/js/cookie-banner.js` + `src/scss/components/_cookie-banner.scss`): banner de consentimiento RGPD; aparece en la primera visita si `localStorage.cookieConsent` no está definido. Botones "Aceptar todas" / "Solo necesarias", barra inferior fija con backdrop-filter. Tests: `tests/cookie-banner.e2e.spec.js`. Ver restricción *Banner cookies Safari*.

**Visor de imagen a pantalla completa** (`src/js/fullscreen.js`): las imágenes tipo bloc de la galería se pueden ampliar vía la Fullscreen API nativa (Chrome, Firefox, Safari macOS); en iPhone Safari (sin API) cae a un lightbox overlay dinámico. Tests: `tests/fullscreen-fallback.e2e.spec.js`.

**Testing**: los tests sirven `dist/` vía `scripts/serve-dist.mjs` en `http://127.0.0.1:4173`. Playwright pre-establece `localStorage.bannerSubvencionCerrado=true` para ocultar el banner. Usa `PLAYWRIGHT_REUSE_SERVER=true` para evitar reiniciar el servidor al depurar. **Tests flaky conocidos** (no regresiones): snapshots de regresión visual, animación de meteo (timing de opacidad), UI de countdown (timing), `reveal-on-scroll` de calendario (timing de IntersectionObserver — pasa al reintentar).

### Nota de versión

`package.json` y `package-lock.json` están sincronizados con la versión de release actual (4.11.0).

## Decisiones y restricciones de arquitectura

Estas restricciones surgen de bugs pasados. Violarlas reintroducirá los problemas.

- **Deploy, secretos y mantenimiento (v4.9.0):**
  1. **NUNCA versionar datos sensibles.** El repo es público. Las credenciales SSH (`SSH_USER/HOST/PORT/REMOTE_DIR`) y el token de mantenimiento (`MAINT_TOKEN`) viven en `tools/deploy.env` (en `.gitignore`); plantilla en `tools/deploy.env.example`. `tools/deploy.sh` los lee al arrancar y aborta si faltan `SSH_USER/HOST`. Antes (v4.8.x) se hardcodeó una IP del equipo y datos SSH en `src/.htaccess`/`deploy.sh`/docs; se purgaron del historial con `git filter-repo` + force-push (los hashes cambiaron — re-clona cualquier clon antiguo).
  2. **Modo mantenimiento** (`tools/deploy.sh --maintenance on|off`): sube/borra el centinela `.maintenance` en la raíz web. El bloque del `.htaccess` da **HTTP 503 + Retry-After** mientras exista, sirviendo `mantenimiento.html` vía `ErrorDocument 503`. Queda **dormido** sin el centinela. NO uses 200 para una pantalla de mantenimiento (Google la indexaría / pensaría que el contenido se fue).
  3. **Bypass por token, NO por IP**: `?preview=<MAINT_TOKEN>` fija una cookie de bypass. El `.htaccess` versionado lleva el placeholder `__MAINT_TOKEN__`; `deploy.sh → inject_maint_token()` sustituye el valor real en el `.htaccess` del servidor **después de cada rsync** (por eso el token nunca entra en git). El rsync usa `--exclude='.maintenance'` para no apagar un mantenimiento en curso al desplegar.
  4. **`mantenimiento.html` es standalone** como `ai-info.html`: excluida del glob `html` de `gulpfile.js` y copiada por `rootFilesTask` (sin canonical/hreflang ni variante `/va/`). Debe ser autocontenida (CSS inline, sin assets externos) para no depender de la CSP ni de archivos que podrían faltar durante un rediseño.

- **Rutas de assets en /va/ y URLs en JS — independientes del subdirectorio (v4.7.9):** `dist/va/` solo contiene HTML; los assets viven un nivel arriba. Antes de v4.7.9 las rutas relativas resolvían a `/va/css|js|img|data` (404) y toda la sección VA se servía sin estilos ni JS. El fix usa rutas `../` y `window.SITE_ROOT` — NUNCA rutas absolutas `/...`, porque el sitio debe funcionar también servido desde un subdirectorio (Live Server sirviendo la raíz del repo con la web en `/dist/` o `/src/`):
  1. **El build reescribe los assets de la variante VA con `../`** (`gulpfile.js → rewriteAssetUrlsToRoot`, solo `lang === 'ca'`): atributos `src/href/poster/srcset/data-board-source` con prefijo `css/|js/|img/|data/|pdf/` (+ `manifest.json`) pasan a `../css/...` etc. Los enlaces entre páginas (`lafalla.html`) se mantienen relativos para que la navegación permanezca en `/va/`. La reescritura va DESPUÉS de `optimizeHtmlAssetTags` (sus regex esperan rutas sin prefijo) y antes de `appendAssetVersionToHtml`. NO la muevas, NO uses rutas absolutas `/...` (rompen el servido desde subdirectorio) ni añadas `<base href>` (rompería los enlaces relativos entre páginas VA).
  2. **Todo `fetch()` y toda URL construida en runtime en `src/js/` usa `window.SITE_ROOT`** (p. ej. `fetch(window.SITE_ROOT + 'data/translations.json')`): translations, eventos, calendarData, config, dataPages1-6, imágenes de `envia.js`/`meteo.js` y los scripts diferidos de `home-deferred.js`. `SITE_ROOT` se autocalcula en cada módulo con la línea idempotente `window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/(?:va\/)?[^/]*$/, '')` (quita el nombre de archivo y el segmento `va/`): da `/` en producción y `/dist/` bajo Live Server. Un fetch relativo crudo nuevo volvería a 404ear en `/va/`; uno absoluto `/...` rompería Live Server.
  3. **`board.js → resolveBoardUrl()`** antepone `SITE_ROOT` al `data-board-source` y a las `url` de `imagen`/`adjuntos` del JSON (los JSON del tablón siguen usando rutas tipo `img/...`/`pdf/...` — no hace falta cambiarlos); deja intactas las URLs con esquema, absolutas, con `../`/`./` o anclas.
  4. **`home-deferred.js` deduplica por URL resuelta** (`new URL(...).href` contra `document.scripts[].src`), no por igualdad de string: el tag estático del HTML y la carga diferida (con `SITE_ROOT`) deben reconocerse como el mismo script o `cookie-banner.js` se ejecuta dos veces (duplica `#cookie-banner` y rompe sus tests).
  5. **Red de seguridad en `.htaccess`** (regla A2): `^va/(css|js|img|data|favicon_io)/` → 301 a la raíz, para el HTML `/va/` antiguo aún cacheado/indexado. NO la quites al menos hasta que GSC deje de registrar esas URLs.
  6. **Idioma por defecto según la página**: `lang.js` e `initTranslations.js` derivan el fallback de `document.documentElement.lang` (`ca` → `va`, resto → `es`) cuando no hay `localStorage.lang`. Sin esto, un visitante nuevo en `/va/` vería el contenido pre-renderizado VA reescrito a español al cargar el JS. La elección guardada en localStorage sigue ganando sobre la URL.
  7. **Test guardia**: `tests/i18n-prerender.e2e.spec.js` comprueba que `dist/va/index.html` usa `../css|js|manifest` y no contiene referencias relativas crudas; la versión ES conserva las suyas.

- **Acordeón Representantes (v4.7.7):**
  1. **El titular accesible** usa `<button type="button" class="accordion__titular" aria-expanded aria-controls>` con focus-visible coral (los acordeones antiguos siguen siendo `<div>` — no migrados). `src/js/acc.js` sincroniza `aria-expanded` solo cuando el titular tiene ese atributo (retro-compatible). NO toques el `hidden`/`inert` del panel: la animación base `max-height: 0 → 100rem` necesita que `.accordion__content` quede en el flujo del DOM; el `aria-expanded` del botón basta para los lectores de pantalla.
  2. **NO modifiques el `.accordion` base.** Dentro de `.accordion--representantes`, el flex de `.accordion__content-inner` base se sobrescribe a `display: block` para que funcione el grid; el panel hereda el gradiente azul institucional base (el override `background: v.$blanco-hueso` de v4.7.7 se eliminó en v4.7.8).
  3. **Jerarquía tipográfica h5→h6**: el `.accordion__header` base sube a 2.4rem en desktop, lo que igualaba/superaba al `.historia__archivos-subtitulo` h5 (1.8rem). En `.accordion--representantes` se sobrescribe a 1.3rem (móvil) / 1.4rem (768-1024px) / 1.5rem (≥1025px) — siempre por debajo del subtítulo en cada breakpoint.

- **Sección Nuevos Falleros (v4.7.5):** el iframe Drive de actividades (file ID `1suCLG0EG6eU5TN5b2fIdOE89U17i-l3o-m_AjaSdYxU`) vive ahora en `nuevos-falleros.html`, **NO** en `deportes.html`.
  1. **No reintroduzcas el iframe ni el CTA "Abrir en pestaña nueva" en `deportes.html`.** Si vuelve un documento Drive a Deportes, créalo aparte y mantén `nuevos-falleros.html` independiente. Las keys `deportes.regionLabel/iframeTitle/fallback/abrirExterno/abrirExternoAria` quedan en `translations.json` para esa reutilización.
  2. **CSP `frame-ancestors`**: el documento Drive embebido requiere visibilidad pública ("Cualquier usuario con el enlace - Lector"). Sin eso el iframe se bloquea en cualquier origen distinto a `drive.google.com` (errores `Framing 'https://drive.google.com/' violates ... "frame-ancestors https://drive.google.com"` + redirecciones a `accounts.google.com/RotateCookiesPage`). Es Drive quien envía el CSP — NO añadas `<meta http-equiv="Content-Security-Policy">` al HTML.
  3. **Doble banda separadora** (mismo mecanismo que el antiguo iframe de Deportes, ver *Deportes iframe doble franja*): `.nuevos-falleros__...doc-wrapper::before height: 2rem` (coral) + iframe `border-top: 4rem solid #1f1f1f` (la mitad superior queda tapada por el `::before`) + skeleton `inset: 4rem 0 0 0`. **Cambia esos cuatro valores en lockstep**; NO añadas `padding-top` al wrapper ni `margin-top` al iframe.
  4. **Subtítulo izquierdo alineado al iframe**: `.nuevos-falleros__subtitulo--left` debe mantener los **mismos max-widths que el doc-wrapper** por breakpoint (`110rem` ≤1024px / `100rem` ≥1025px). Si cambias uno, cambia el otro.
  5. **La página dedicada no tiene `<h2>` ni párrafo intro** (eliminados por el usuario en v4.7.5). El `id="nuevos-falleros-title"` se trasladó a `<h3>Formularios descargables</h3>` para que el `aria-labelledby` de la `<section>` siga apuntando a un elemento real. NO añadas otro elemento con ese id, ni lo quites del `<h3>`. Para restaurar el `<h2>`, devuélvele el id antes.
  6. **Los formularios son HTMLs imprimibles, NO PDFs**: las tarjetas enlazan a `autorizacion-imagen.html` y `autorizacion-imagen-menor.html` (imprimibles vía Cmd+P → "Guardar como PDF", con ES/VA dinámico). NO crees PDFs duplicados. Los formularios nuevos siguen el mismo patrón: HTML imprimible + nueva tarjeta en el grid + nuevo bloque i18n bajo `nuevosFalleros`.

- **Deportes iframe — doble franja separadora superior (v4.6.21):** la franja separadora de 4rem sobre el documento embebido se produce con **dos mecanismos coordinados** (CSS no permite un `border-top` multicolor):
  1. `.deportes__doc-wrapper::before` pinta una franja coral de 2rem: `position: absolute; top/left/right: 0; height: 2rem; background-color: v.$primary-color; z-index: 2; pointer-events: none`.
  2. `.deportes__doc` tiene `border-top: 4rem solid #1f1f1f; height: 100%; box-sizing: border-box`. Los primeros 2rem quedan tapados bajo el `::before`; solo se ven los 2rem inferiores.
  3. `.deportes__doc-skeleton` usa `inset: 4rem 0 0 0` para que el shimmer empiece debajo de ambas bandas (en modo oscuro usa `v.$gris-oscuro`/`v.$gris-muy-oscuro`).

  Layout neto (arriba→abajo): 2rem coral → 2rem `#1f1f1f` → documento. **No** añadas `padding-top` al wrapper, `margin-top` al iframe, ni pongas el iframe a `inset: 0`. Para cambiar las alturas de banda, edita CUATRO valores en lockstep: la `height` del `::before` del wrapper, el ancho del `border-top` del iframe (= suma de ambas bandas), el primer valor del `inset` del skeleton, y la jerarquía de z-index si hace falta.

- **Multi-board paramétrico y tablón JCF en Deportes (v4.7.2):** el componente `board` admite N instancias por página.
  1. **No vuelvas a hardcodear `#notesBoard` ni `data/board.json`** en `src/js/board.js`. El render itera `document.querySelectorAll('div.board')`; cada tablero lleva su propio `data-board-source` e `id`. Las features que falten (p. ej. filtros) deben añadirse de forma paramétrica, no por nombre fijo.
  2. **Las notas deportivas viven en `src/data/sports-board.json`, NO en `board.json`.** Mover una a `board.json` la saca en `index.html`/`eventos.html`. Solo `board.json` alimenta el JSON-LD de Schema.org `Event` inyectado ahí (vía `getSchemaEvents`, `gulpfile.js`); las notas JCF no son Events (no tienen `📝 Cita<br>` + fecha) y no afectan al schema.
  3. **La skill agent-ready `sports-board`** (en el array `skills` de `wellKnownTask`) apunta a `/data/sports-board.json`. Si renombras el archivo → actualiza `distPath` y `url` o la skill se omite silenciosamente.
  4. **El marco del tablón en Deportes es transparente en modo claro.** `.deportes__marco-tablon` sobrescribe `background: transparent; box-shadow: none; padding: 0` para que solo se vea el corcho gris del `.board` sobre el azul institucional. NO reintroduzcas el fondo heredado `$naranja-suave` (naranja sobre azul es ilegible).
  5. **Título alineado a la izquierda y en blanco.** `.deportes__tablon-titulo` sobrescribe `color: v.$blanco; justify-content: flex-start; text-align: left`. NO centres ni recolorees sin comprobar el contraste con el velo del modo oscuro.
  6. **`<script src="js/board.js" defer>` debe cargarse en `deportes.html`.** Quitarlo deja `#sportsBoard` vacío (sin error explícito). Tres tests en `tests/board.e2e.spec.js > Tablón Deportes (#sportsBoard)` validan las 6 cards JCF.
  7. **Guía operativa para delegados**: ver [`docs/gestion-tablon.md`](./docs/gestion-tablon.md).

- **Empty-state del tablón (v4.11.0):** cuando un tablón se queda sin notas activas, `board.js → renderBoardInto` renderiza el marcador como **nota real** (`<article class="board__note board__empty" role="article">` con `clamp-screw`/`clamp-spring` + `board__note-content`), NO como el antiguo `<p class="board__empty">` plano sobre el corcho. El texto viene de la clave i18n `board.empty` (ES/VA en `translations.json`); el mismo string está duplicado como fallback en `board.js` para evitar el flash del texto antiguo antes de que carguen las traducciones — si cambias el mensaje, actualiza AMBOS sitios.
  1. **Estilo**: en `_board.scss` el modificador `&__empty` solo centra el `board__note-content`; el resto del aspecto (tarjeta blanca + pinza) lo hereda de `board__note`. El **modo oscuro** es propio: `body.modo-oscuro .board__empty` pasa la tarjeta a `v.$negro-casi` con texto `v.$blanco-hueso` (las notas reales no llevan modo oscuro, pero el empty-state solo aparece con el tablón vacío, nunca junto a notas blancas — sin inconsistencia visible).
  2. **Tests**: como el tablón de Eventos (`#notesBoard`) ahora se sirve vacío, las aserciones de render de notas de `tests/board.e2e.spec.js` se apoyan en el de Deportes (`#sportsBoard`, que sí tiene notas); Eventos valida el empty-state (`.board__empty` visible, `article:not(.board__empty)` == 0). `tests/reveal-on-scroll.e2e.spec.js` apunta al `.board__empty` para el reveal del tablón. Si repueblas `board.json`, revisa esos tests.
  3. **Schema.org Event**: con `board.json` vacío, `getSchemaEvents` no inyecta ningún `Event` JSON-LD en `index.html`/`eventos.html`. Al volver a añadir notas con el patrón `📝 Cita<br>` + fecha `DD-MM-YYYY`, los Events reaparecen solos.

- **Agent-readiness — `/.well-known/` y orden del build (v4.7.1):** el soporte abarca tres sitios coordinados; cambiar uno sin los otros rompe el descubrimiento. Guía completa: [`docs/well-known-agent-readiness.md`](./docs/well-known-agent-readiness.md).
  1. `src/.htaccess` emite el header `Link:` sobre `*.html`. Su lista de relaciones (`api-catalog`, `agent-skills`, `describedby`) debe coincidir con los archivos servidos bajo `/.well-known/` y con `/ai-discovery.json`. Añadir una relación (p. ej. `mcp-server`) → súmala al `Header set Link` y publica el recurso a la vez.
  2. `/.well-known/api-catalog` se sirve **sin extensión** (RFC 9727); `<Files "api-catalog"> ForceType application/linkset+json </Files>` fija su MIME. NO lo renombres a `api-catalog.json` ni borres el bloque `<Files>`, o se sirve como `text/html` y los agentes lo descartan.
  3. `wellKnownTask` se ejecuta **después** de `dataTask`, `rootFilesTask` y `seoTask` porque calcula el `sha256` de archivos en `dist/`. NO la muevas antes (las skills quedarían sin hash). Una skill que apunta a un archivo inexistente se omite con warning (el build no falla).
  4. Para añadir/quitar skills: edita el array `skills` en `wellKnownTask`; el `sha256` se recalcula en cada build. NO escribas a mano `dist/.well-known/agent-skills/index.json` — el build lo sobrescribe.
  5. La negociación de contenido Markdown solo afecta a `/` (sirve `seo/ai-training-data.md` para `Accept: text/markdown`) y a páginas con un `.md` hermano. Para markdown por página, genera un `.md` junto a cada `.html` en el build y la regla de `.htaccess` los sirve automáticamente.
  6. `Content-Signal` en `robots.txt` está en `yes/yes/yes` (contenido cultural público que busca exposición). Para bloquear el training, pon `ai-train=no` — el resto del agent-readiness sigue funcionando.

- **Pre-render i18n VA en build (v4.6.23):** el pipeline pre-renderiza valenciano en `gulpfile.js → prerenderTranslations()`.
  1. **Los atributos `data-i18n*` DEBEN permanecer en el HTML servido** — son la única forma de que el toggle a ES funcione en runtime sin recargar. NO los elimines/filtres.
  2. **Editar `src/data/translations.json` no hace nada sin rebuild** — el pre-render es en build-time. Tras editar: `npm run build`.
  3. **Añadir un nuevo atributo i18n** (p. ej. `data-i18n-aria-describedby`) requiere actualizar A LA VEZ el array `attrMappings` en `gulpfile.js → prerenderTranslations` Y el array de selectores en `src/js/lang.js → updateTranslations()`, o el build y el runtime se desincronizan.
  4. **Claves VA faltantes** no rompen el build; el HTML conserva el texto fuente como fallback y emite `[i18n-prerender] missing key: <clave> @ <archivo>` (warning). Revisar tras cada cambio en `translations.json`.
  5. **Kill switch**: `DISABLE_I18N_PRERENDER=1 npm run build` desactiva el pre-render sin revertir.
  6. **`data-i18n-dynamic`** (meteo) lo skipea el pre-render — `src/js/meteo.js` lo rellena con datos en vivo. NO pre-renderices contenido ahí.
  7. **`data-i18n-format="paragraphs"`** genera un `<p>` por bloque dividido por `\n+`, replicando `renderParagraphTranslation` de `lang.js` — mantén ambos simétricos.
  8. **Solo VA pre-renderiza; ES queda byte-idéntico al source.** Para pre-renderizar también ES (detección de drift), añade un flag opt-in `PRERENDER_ES=1` — NO lo actives por defecto.
  9. **Test guardia**: `tests/i18n-prerender.e2e.spec.js` (en smoke) comprueba que `dist/va/index.html` tiene texto VA, `dist/index.html` ES, y que los `data-i18n*` siguen presentes.

- **SEO multi-idioma — gulpfile como única fuente (v4.6.22):** el bloque `canonical` + `hreflang` lo gestiona **exclusivamente** `gulpfile.js` (`modifyHtmlStream`); cada build elimina todos los `<link rel="canonical">`/`<link rel="alternate" hreflang>` del source y reinyecta la versión correcta.
  1. **NO añadas** `canonical`/`hreflang` a mano en el HTML de la raíz — el build los borra. Edita `modifyHtmlStream` en su lugar.
  2. El `canonical` debe ser **autoreferencial** (cada URL apunta a sí misma): ES → `https://fallasuissa.es/<file>`, VA → `https://fallasuissa.es/va/<file>`. NUNCA apuntes el canonical de `/va/X.html` a `/X.html` — eso reproduce el aviso de GSC "Duplicada: el usuario no ha indicado ninguna versión canónica".
  3. **NO uses URLs `?lang=ca`/`?lang=es`** como destino de hreflang — no son crawlables (el cambio de idioma es client-side).
  4. `sitemap.xml` mantiene ambas entradas ES y VA por página, cada una con `<xhtml:link rel="alternate">` para `es`, `ca`, `x-default`. Al añadir una página, añade SUS DOS entradas con los 3 alternates.

- **Stacking z-index del menú móvil (v4.0.0):** el backdrop se inserta dentro de `.header__barra` (no en `body`). Z-index: menú 2500, backdrop 1500, botón de menú 2600. Mover el backdrop a `body` rompe el contexto de apilamiento.

- **Transiciones de gradiente (v4.1.0):** `.quieres-mas` y `.countdown__contenedor` usan `::before` para el overlay de gradiente; el modo oscuro desvanece la opacidad a 0. Tests: `quieres-mas-transition.e2e.spec.js`, `countdown-transition.e2e.spec.js`. (`.countdown__contenedor` lleva además un `border: 2px solid v.$primary-color` base en ambos modos, añadido en v4.7.6.)

- **Z-index de navegación desktop (v4.1.1):** `.navegacion` necesita `position: relative; z-index: 5` en desktop (>768px) para quedar por encima del overlay glassmorphism.

- **Animaciones de notificación (v4.2.7):** solo UNA regla de animación para notificaciones. `_notificaciones.scss` es dueño de `#notificacion.mostrar`. NO añadas una regla competidora en `_accessibility.scss` para `.header__notificacion:not(:empty)` — provoca un flash de notificación fantasma.

- **Banner subvención (v4.2.11-4.2.16):**
  - **Visible en cada carga de home**: `banner-subvencion.js` NO persiste el cierre en `localStorage` ni debe usar una cookie de sesión para condicionar la visibilidad real del usuario. La comprobación `localStorage.getItem('bannerSubvencionCerrado')` existe únicamente para los tests de Playwright. NO reañadas `localStorage.setItem` en `cerrarBanner()`.
  - **Tarjeta no-modal**: una tarjeta flotante, no un modal bloqueante a pantalla completa con backdrop. NO lo reviertas a un overlay bloqueante.
  - **Secuencia de ocultado accesible**: el estado oculto usa `inert` + `aria-hidden="true"`. Al cerrar, mueve el foco fuera del botón de cierre antes de aplicar `aria-hidden` al ancestro, o Chromium loguea un warning de accesibilidad.
  - **Imagen en modo oscuro**: usa `filter: invert(1) hue-rotate(180deg)` — NO `invert(1)` solo (vuelve verde el escudo rojo del Ajuntament). `hue-rotate(180deg)` restaura los tonos rojos.
  - **Fix Safari**: usa `<picture>` con AVIF/WebP/PNG en lugar de SVG (el bug de WebKit [#246106](https://bugs.webkit.org/show_bug.cgi?id=246106) rompe el `filter` CSS sobre SVGs con filtros internos). NO reviertas a `<img src="subvencion.svg">`. Tamaño: SVG 289KB → AVIF 25KB (-91%).

- **Fixes de Safari del banner de cookies (v4.6.10):** dos workarounds críticos para macOS/iOS Safari en `cookie-banner.js`:
  1. **Bloqueo de localStorage**: Safari lanza `SecurityError` cuando `localStorage` está totalmente bloqueado. Tanto `getItem` como `setItem` DEBEN ir envueltos en `try/catch`, o el script crashea y el banner no renderiza nunca.
  2. **Bug de reflow y transición**: Safari salta las transiciones CSS (`transform: translateY(100%) → 0`) cuando la clase de transición se añade en el mismo frame que la inserción en el DOM. El script DEBE usar `setTimeout(() => {...}, 50)` — NO `requestAnimationFrame` ni `void banner.offsetWidth`.

- **Stacking de imagen de Ofrenda (v4.6.9):** `.ofrenda__figura` es `position: relative` + `aspect-ratio: 3/4` (el bloque contenedor). El `<button class="colaboraciones-mosaic__trigger">` interior es `position: absolute; inset: 0`. La `<img class="ofrenda__imagen">` debe rellenarlo (`width/height: 100%; object-fit: cover`). Para sobrescribir los estilos heredados del trigger (`padding`, `display: flex`, `object-fit: contain`), el trigger se sobrescribe localmente en `_ofrenda.scss` con `padding: 0 !important;` y `display: block;`, y la imagen se anida dentro del trigger por especificidad. NO: anides la imagen fuera del trigger, quites el `!important` de la regla de padding, ni cambies el display de vuelta a `flex`.

- **Stacking de imagen de Blog-detail (v4.3.11):** `.blog-detail__figure` necesita `z-index: 2` para quedar por encima del `::before` (gradiente azul, z-index: 0) de `.blog-detail__article`. El centrado usa `margin: 1.5rem auto` + `max-width: 48rem` (no flexbox, que rompe `<picture>`); la imagen es `display: block; width: 100%`. En móvil: la figura cambia a `max-width: 100%`.

- **Patrón de subrayado hover de nav y footer (v4.6.15):** `.navegacion__enlace` (header) y `.footer__enlace` comparten un patrón — un subrayado `::after` (2px `v.$primary-color`) que anima `width: 0 → calc(100% - padding*2)` y `opacity: 0 → 1`. El texto pasa a `v.$primary-color` en `:hover`, `:focus-visible`, `.active`/`[aria-current="page"]`. Sin pastilla de fondo en estado activo — el texto coloreado + el subrayado permanente SON el indicador. NO reañadas overrides de `background-color` para el estado activo. El bloque del footer mantiene `!important` en varias declaraciones por batallas históricas de especificidad — consérvalos al editar.

- **Sin `text-transform: capitalize` (v4.6.8):** nunca lo uses — pone en mayúscula cada palabra incluyendo preposiciones/artículos a mitad de frase ("Blog De Nuestra Falla"). Toda la capitalización viene del texto fuente (translations.json, HTML). Usa `text-transform: none` u omítelo.

- **"Falla/Fallas" siempre con mayúscula (v4.6.8):** "Falla"/"Fallas" deben llevar SIEMPRE F mayúscula en todo el texto visible, en todos los idiomas (ES "Falla/Fallas", VA "Falla/Falles"). Escribe "nuestra Falla", no "nuestra falla".

## Patrones comunes

### Subir de versión (release)
Actualiza los CUATRO sitios en lockstep — olvidar `sw.js` deja a los visitantes recurrentes viendo la versión anterior cacheada:
1. `package.json` y `package-lock.json` (campo `version`)
2. `CLAUDE.md`: cabecera **Versión**, *Nota de versión* y entrada de **Changelog**
3. `src/sw.js`: `CACHE_NAME` y `CRITICAL_CACHE` (`falla-suissa-vX.Y.Z` / `falla-critical-vX.Y.Z`) — al cambiar los nombres, el `activate` del service worker purga los caches antiguos en los clientes que aún lo tengan registrado
4. Ejecuta `npm run build` (copia `sw.js` a `dist/`)

### Añadir una traducción
1. Añade la clave a `src/data/translations.json` bajo `es` y `va`
2. Úsala en HTML: `<span data-i18n="section.subsection.key"></span>`
3. Ejecuta `npm run build`

### Añadir una página nueva
1. Crea el archivo HTML en `src/` (NO añadas `canonical`/`hreflang` — los inyecta el build)
2. Añade **dos** entradas a `src/sitemap.xml` (ES + `/va/`), cada una con `<xhtml:link rel="alternate">` para `es`, `ca`, `x-default`
3. Añade la URL a `src/sitemap-index.xml` si hace falta
4. Ejecuta `npm run build`

### Actualizar la imagen Open Graph
1. Ejecuta `npm run generate:og` (escribe `src/img/og-share.png`)
2. Actualiza el cache-buster `?v=YYYYMMDD` en TODOS los archivos HTML (og:image, twitter:image, image_src)
3. Ejecuta `npm run build` y luego `npm run test:e2e:full`

### Añadir un post de blog
1. Crea una página HTML estática (`src/blog-{slug}.html`) basada en `src/blog-somni.html` o `src/blog-anima.html`. Incluye SEO: `<title>`, `<meta description>`, Schema.org `BlogPosting` (headline, datePublished, author), Open Graph (`og:type=article`, `article:published_time`), Twitter Card
2. Añade todo el texto traducible a `src/data/translations.json` bajo `es` y `va` (cardTitle, title, lead, date, excerpt, author, back, backAria, ctaAria, bloques de contenido, alt/caption de imagen)
3. Añade tarjetas de blog estáticas a `src/blog.html` y `src/index.html`
4. Añade la URL a `src/sitemap.xml`
5. Ejecuta `npm run build`

### Añadir un PDF con preview social
Usa wrappers HTML (ver `src/pdf/Llibrets/`). Incluye favicon, Open Graph, Twitter Card. Embebe el PDF con `<object>` + botón de descarga de fallback. Enlaza al wrapper `.html`, no al `.pdf`.

## Estilo de código

- El CSS sigue BEM (Block__Element--Modifier)
- Los commits de Git usan Conventional Commits (feat:, fix:, docs:, style:, refactor:)
- Breakpoints: móvil `max-width: 767px`, desktop `min-width: 768px`
- Variables SCSS clave en `src/scss/abstracts/_variables.scss` (primario: `$primary-color` #FF6F61, azul institucional: `$color-azul-falla` #004BCF)

## Changelog

Los detalles del estado actual están en **Arquitectura** y **Restricciones**; esto es el índice cronológico.

- **4.11.0** — Dos bloques: **(1) Nueva galería Representantes 2026-27** (`galeria_8`, octava galería) replicando el patrón de bloc-notes: `src/galeria_8.html` (+ `/va/` y SEO por el build), `src/js/galeria_8.js` (fetch a `dataPages8.json`), `src/data/dataPages8.json` (3 fotos en `src/img/representantes/representantes-2026-27/`, orden narrativo preparación→retrato→grupo), tarjeta en `galerias.html` + teaser de la home, i18n `galeria.galeria8`/`galeria8-texto` (ES "Representantes 2026-27" / VA "Representants 2026-27") y dos `<url>` en `sitemap.xml`. **(2) Tablón de Eventos vaciado + empty-state simpático**: `board.json` se sirve vacío y `board.js` renderiza un marcador de "sin anuncios" con el aspecto de una nota real (tarjeta blanca + pinza), texto bilingüe en `board.empty`, modo oscuro propio (`v.$negro-casi` + `v.$blanco-hueso`); los anuncios reaparecen solos al repoblar el JSON. Tests del tablón repuntados (Eventos valida el empty-state; el render de notas se valida en `#sportsBoard`). El de Deportes (`sports-board.json`) queda intacto. Ver patrón *Tablón de anuncios* y restricción *Empty-state del tablón*.
- **4.10.1** — Galería **San Juan 2026** (`galeria_7`): +3 fotos diurnas (`sanjuan-2026-014/015/016.jpeg`), pasa de 13 a 16 imágenes. Las nuevas se intercalan en su posición cronológica dentro del bloque de día reordenando el array de `src/data/dataPages7.json` (paella servida tras la paella, chicas+niña junto a las familias, grupo del patrocinador posando junto a su foto análoga). El orden de visualización lo fija el array del JSON, no el número de archivo, así que no se renombra ninguna de las 13 existentes; el conteo "/ 16" y el render se calculan solos. Sin cambios en HTML/teaser/i18n/sitemap.
- **4.10.0** — Nueva galería **San Juan 2026** (`galeria_7`), séptima galería del sitio, replicando el patrón de bloc-notes existente: nueva `src/galeria_7.html` (+ variante `/va/` y SEO inyectados por el build), `src/js/galeria_7.js` (fetch a `dataPages7.json`), `src/data/dataPages7.json` (13 imágenes) y 13 fotos fuente en `src/img/sanjuan/sanjuan-2026/` (`sanjuan-2026-001…013.jpeg`; el build genera AVIF/WebP). Las fotos se ordenan cronológicamente día→noche (convivencia/cócteles/paella/niños → reparto de camisetas y lotes → retratos nocturnos → hoguera como clímax). Tarjeta añadida en `galerias.html` y en el teaser de la home (`index.html`, ahora 7 tarjetas), claves i18n `galeria.galeria7`/`galeria7-texto` en ES ("San Juan 2026") y VA ("Sant Joan 2026"), y dos `<url>` (ES + `/va/`) en `sitemap.xml`. Como en las 6 galerías previas, el `<h1>` lleva `<span>` anidado: el pre-render VA omite ese nodo (texto fuente en estático), pero el `data-i18n` se conserva y el toggle a valenciano funciona en runtime.
- **4.9.1** — Optimización de imagen: `Escudo_falla.png` (4.1MB, 1936×2400, con alfa) — fuente desproporcionado (se muestra ≤80×100) — pasa a 640px + pngquant (**120KB**, alfa intacto); el build regenera AVIF 30KB / WebP 48KB. Sin cambios de formato ni HTML (sigue PNG con el mismo nombre, referenciado en 39 archivos vía `<picture>`/schema/sitemap). Los blobs PNG antiguos de 4.1MB se purgaron del historial git (`git filter-repo --strip-blobs-with-ids` + force-push; hashes cambiados, re-clonar clones viejos).
- **4.9.0** — Tres bloques de trabajo: **(1) Modo mantenimiento** — nueva `mantenimiento.html` autocontenida (CSS inline, sin assets externos, bilingüe ES/VA, `noindex`), tratada como standalone igual que `ai-info.html` (excluida de `htmlTask`, copiada por `rootFilesTask`, sin `/va/`). El `.htaccess` devuelve **HTTP 503 + `Retry-After`** cuando existe el centinela `~/.../public_html/.maintenance`, con bypass por **token secreto** (`?preview=TOKEN` → cookie) y `ErrorDocument 503`. Se enciende/apaga con `tools/deploy.sh --maintenance on|off`. **(2) Seguridad del deploy** — los datos sensibles (SSH + token) salen del repo a `tools/deploy.env` (gitignored; plantilla `deploy.env.example`); `deploy.sh` los lee y aborta si faltan. El `.htaccess` versionado lleva el placeholder `__MAINT_TOKEN__` que `deploy.sh` inyecta en el servidor tras cada rsync (`--exclude='.maintenance'` para no apagar el modo en un deploy). Se reescribió el historial git (`git filter-repo` + force-push) para purgar una IP del equipo y credenciales SSH que se habían commiteado, y los blobs PNG gigantes. **(3) Optimización de imágenes** — `foto_2425_02.png` (67MB) y `foto_2425_01.png` (12MB), fotos de cámara solo usadas en slides comentados, pasan a JPEG 1920px; `fondo_traje.png` (8.4MB, fondo de 5 secciones) pasa a JPEG 2560px servido vía `image-set()` (AVIF/WebP con fallback) en `_falla/_meteo/_forecast/_galeria/_ofrenda.scss`. Ver restricción *Deploy, secretos y mantenimiento*.
- **4.8.2** — Fix responsive: `.seccion-hr` (separador de la sección Ofrenda, `_ofrenda.scss`) era `display: none` por defecto y solo visible en `@media (min-width: 768px)`; ahora es `display: block` fijo, visible en todos los tamaños (incluido <768px).
- **4.8.1** — Tooling de despliegue: nuevo `tools/deploy.sh` que construye (`npm run build`) y sincroniza `dist/` a Hostinger vía `rsync -avz --delete` sobre SSH (espejo a `~/domains/fallasuissa.es/public_html`), con verificación `curl 200` final y flags `--dry-run`/`--skip-build`/`-y`. Atajo `npm run deploy` en `package.json`. Documentado en [`docs/build-and-deploy.md`](./docs/build-and-deploy.md). Sin cambios en el sitio servido (solo herramienta de release).
- **4.8.0** — Auditoría de seguridad: añade `Content-Security-Policy` y `Strict-Transport-Security` (HSTS, max-age=1 año + preload) en `.htaccess`; elimina la cabecera obsoleta `X-XSS-Protection`. `mapa.html`: SRI (`integrity sha384`) en Font Awesome 6.5.0 (cdnjs). `board.js`: saneamiento de contenido del tablón con `escapeHtml()` en atributos, `isSafeUrl()` para rechazar esquemas peligrosos y `sanitizeBoardHtml()` con allowlist de etiquetas. `calendario.js`: sustituye `innerHTML +=` por `createElement + textContent` en `renderizarLista()`. Formulario de contacto: checkbox RGPD "He leído y acepto la Política de Privacidad" (`required`, enlace a `privacidad.html`, traducciones ES/VA, estilos en `_quieres.scss`).
- **4.7.9** — Fix crítico: la sección `/va/` se servía sin CSS/JS/imágenes (los assets relativos resolvían a `/va/css|js|img|data`, inexistentes). El build reescribe los assets de la variante VA con `../`, los `fetch()`/URLs runtime de `src/js/` usan `window.SITE_ROOT` (autocalculada; funciona en producción Y servido desde subdirectorio tipo Live Server — la primera iteración con rutas absolutas `/...` rompía ese flujo y se corrigió en la misma versión), `lang.js`/`initTranslations.js` toman el idioma por defecto del `lang` de la página, el `manifest.json` pasa a ruta relativa en las 28 páginas (y sus `icons`/`shortcuts`/`start_url`/`scope` internos también — el icono `/img/apple-touch-icon.png` absoluto 404eaba bajo subdirectorio) y `.htaccess` gana la regla A2 (301 de assets `/va/` cacheados a la raíz). Ver restricción *Rutas de assets en /va/*. Modal de resultado del formulario de contacto (`envia.js`) arreglado: la imagen inyectada pierde `loading="lazy"` (quedaba atrapada en el skeleton `opacity: 0.1` de `_image-optimization.scss` porque `accessibility.js` solo marca `.loaded` en imágenes presentes al cargar la página) y `_quieres.scss` gana estilos para `.modal-header`/`.btn-close`/`.modal-body`/`.lead` (el texto heredaba el blanco de `.quieres-mas` y era ilegible sobre el modal blanco; en modo oscuro el `.lead` pasa a `$blanco-hueso`). Además, fixes de HTML roto: `organigrama.html` (etiqueta `Ada Palerm/p>` visible en producción + 3 `</div>` y 1 `</section>` huérfanos — la leyenda vuelve dentro de `.organigrama-contenedor`) e `index.html` (cierre de `.current-icon` ausente en la sección meteo + atributo malformado `data-i18n="meteo.humedad"=""`). Endurecimiento Safari: TODOS los accesos a `localStorage` de `src/js/` van ahora en try/catch (lang, initTranslations, banner-subvencion, dark, board, calendario, ofrenda-video, video-dron — patrón de cookie-banner.js; con storage bloqueado el sitio queda 100% funcional, verificado simulando `SecurityError`). Regla C de `.htaccess`: el `%20` de la sustitución se escapa como `\%20` (sin escapar, mod_rewrite lo parsea como backreference `%2`+`0` y el 301 del Llibret 2024 apuntaba a otro 404). Carreras de traducciones: `galeria_1-6.js` usan formato neutro (`1 / 15`) si `translate()` devuelve la clave y re-renderizan el indicador en `translationsReady` (antes mostraban "notepad.indicator" literal y no reaccionaban al cambio de idioma); `countdown.js` conserva el texto estático del HTML si `getNestedTranslation` devuelve la clave (antes flasheaba "countdown.message"); `calendario.js` guarda `Array.isArray(window.eventos)` antes de renderizar (TypeError si `langChanged` llegaba antes que los fetch). Texto: typo "Delagado"→"Delegado" (9 ocurrencias) y "la falla"→"la Falla" en `autorizacionImagen.casillaFotoRRSS` (translations.json es/va + 4 fallbacks HTML). Saneamiento SCSS: los `@keyframes fadeIn` triplicados pasan a nombres únicos — queda solo el canónico de `_mixins.scss`, el de notificaciones se renombra `fadeInNotificacion` (recupera el `translateX(-50%)` que lo centra) y el de `_header.scss` (sin uso) se elimina; el bloque legacy `.board` duplicado en `_eventos.scss` (239 líneas) se elimina — `_board.scss` es el único dueño; solo se conservó el ajuste móvil de `.marco-tablon` y el `gap` de `__file-link` que aportaba el legacy (verificado con diff de estilos computados: 0 diferencias en 3 páginas × 2 viewports); breakpoints saneados a la convención 767/768 en `_deportes.scss` (max-width 768→767) y rangos tablet de `_mapa`/`_organigrama`/`_calendario` (769→768) — los snapshots visuales *tablet* de esas 3 páginas cambian a 768px exactos (render desktop, intencionado); reasignaciones Sass muertas de `$frieze-size` eliminadas (el clamp() de la variable ya resuelve el responsive); `&__cta-wrapper` desduplicado en `_nuevos-falleros.scss`. Tanda final: `base.html` (plantilla interna) excluida del build (`!src/base.html` en el glob de htmlTask) y con 410 en `.htaccess` (regla E) — estaba publicada indexable sin entrada en sitemap; módulos muertos eliminados (`performance-optimizer.js`, `pwa-manager.js`, `image-optimizer.js` — ningún HTML los cargaba y contenían rutas inexistentes); `video-dron.js` gana `safePlay()` (promesa de `play()` controlada, patrón de ofrenda-video); `fullscreen.js` solo encadena `.catch` si `requestFullscreen` devuelve promesa (la API prefijada de Safari devuelve `undefined`); glob de rootFilesTask ampliado a `src/robots*.txt` (publica `robots-ai-optimized.txt` como documentaba CLAUDE.md); jerarquía de headings saneada — countdown h3→h2 en `index.html`, h2 `sr-only` en `blog.html`/`galerias.html` (los visibles siguen comentados).
- **4.7.8** — Pulido visual de Representantes (modo claro): el panel hereda el gradiente azul institucional (se eliminó el override `$blanco-hueso` de v4.7.7), cargo/placeholder en `$blanco-hueso`, nombre coral, `box-shadow` de miniaturas reforzada. Ver patrón *Representantes*.
- **4.7.7** — Nueva subsección **Representantes** en Historia/Archivos (`index.html`/`lafalla.html`). Ver patrón + restricción *Representantes*.
- **4.7.6** — `.countdown__contenedor` gana `border: 2px solid v.$primary-color` (ambos modos). Icono del teaser Nuevos Falleros renombrado `fondo-nuevos-falleros.svg` → `logo-nuevos-falleros.svg` (`.nuevos-falleros__icono`); el PNG antiguo (`logo-nuevos-falleros.png`) queda en `src/img/logos/` sin uso.
- **4.7.5** — Nueva sección **Nuevos Falleros**; iframe Drive movido desde Deportes. Teaser `data-index="12"`, `.quieres-mas` → `13`; enlace de nav añadido (header + footer) en 27 páginas; sitemap +2 (54 `<url>`). Ver patrón/restricción *Nuevos Falleros*.
- **4.7.4** — Limpieza de 404 (GSC) en `src/.htaccess` (`mod_rewrite`, tras `www→no-www`): A) `/va/pdf/*` → 301 `/pdf/*`; B) `migany2025*.pdf` → 410 Gone; C) `2024_LLIBRET_FALLA _MORERES_DIGITAL.pdf` → 301 `/pdf/Llibrets/`; D) `C6xxx_*.pdf` → 301 `/deportes.html`. Procedimiento: [`docs/google-search-console.md`](./docs/google-search-console.md).
- **4.7.3** — Pulido del tablón JCF: `.deportes__tablon-titulo` coral (claro) / blanco (oscuro), responsivo <768px (centrado, `font-size-regular`, padding compacto); notas del board 1.4 → 1.25rem en móvil (`_board.scss`). Nuevo [`docs/well-known-agent-readiness.md`](./docs/well-known-agent-readiness.md).
- **4.7.2** — `board.js` refactorizado a multi-instancia paramétrica + tablón JCF en Deportes (`#sportsBoard` / `sports-board.json`). Ver restricción *Multi-board*.
- **4.7.1** — Pase de agent-readiness (`/.well-known/`, header `Link:`, `Content-Signal`, negociación markdown, `wellKnownTask`). Ver restricción *Agent-readiness*.
- **4.7.0** — Fix de condición de carrera en `calendario.html`: `#lista-anuncios`/`#descripcion-eventos-mes` cambian de `data-i18n` a `data-i18n-aria-label` para que `lang.js` no borre el contenido renderizado por `calendario.js`. Test guardia en `tests/reveal-on-scroll.e2e.spec.js`.
- **4.6.24** — Reestructuración del repo: todo el source movido bajo `src/` vía `git mv` (historial preservado). Ver *Estructura de directorios*.
- **4.6.23** — Pre-render VA en build time (`prerenderTranslations`). Ver restricción *Pre-render i18n VA*.
- **4.6.22** — El `gulpfile` pasa a ser la única fuente de `canonical` + `hreflang`. Ver restricción *SEO multi-idioma*.
- **4.6.21** — Doble banda separadora del iframe de Deportes. Ver restricción *Deportes iframe*.
- **4.6.20** — Nueva sección Deportes (iframe Drive vía embed) + limpieza de `src/js/miboton.js` (rompía el primer `.boton` con un side-effect de inline style); todos los botones comparten ahora `.boton` con `:active` definido vía SCSS.
