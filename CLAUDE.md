# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 4.7.5
**Last Updated:** 18 de mayo de 2026

> 4.7.5 — Nueva sección **Nuevos Falleros** + reorganización del iframe Drive:
> 1. **Página dedicada `src/nuevos-falleros.html`** + teaser en `src/index.html` (data-index="12", entre Galería y "¿Quieres más?"). Renumerada `.quieres-mas` a `data-index="13"`. Patrón análogo a `deportes` / `colaboraciones`: teaser corto en index con CTA "Saber más" → página standalone con el contenido completo. Estructura final de la página dedicada (de arriba a abajo): `<h3>Documentos de interés general</h3>` (alineado a la izquierda) → iframe Drive + skeleton + `<noscript>` fallback → CTA "Abrir en pestaña nueva" → `<h3>Formularios descargables</h3>` → grid de 2 tarjetas linkando a `autorizacion-imagen.html` (mayores) y `autorizacion-imagen-menor.html` (menores). No se generan PDFs nuevos: las dos HTMLs preexistentes ya son imprimibles desde el navegador.
> 2. **iframe Drive MOVIDO de `deportes.html` → `nuevos-falleros.html`.** El file ID Drive (`1suCLG0EG6eU5TN5b2fIdOE89U17i-l3o-m_AjaSdYxU`) ya no se referencia desde `deportes.html` (que ahora solo contiene intro + delegados + tablón JCF). El CTA "Abrir en pestaña nueva" también se trasladó. Si vuelve un documento Drive a deportes, restaurar markup desde el commit anterior. Las keys `deportes.regionLabel/iframeTitle/fallback/abrirExterno/abrirExternoAria` siguen en `translations.json` (no rompen nada, reutilizables).
> 3. **CSS — nuevo `src/scss/components/_nuevos-falleros.scss`** (forward en `components/_index.scss` después de `'deportes'`). Contiene: heading + intro + cta-wrapper + abrir-externo (estilos derivados de `_deportes.scss`), subtítulo coral centrado, grid auto-fit minmax(28rem) + cards con hover translate, doc-wrapper coral (1px border, aspect-ratio 4/5 → 3/4 mobile → 1/1 tablet) con `::before` de 2rem coral cubriendo la mitad superior del `border-top: 4rem solid #1f1f1f` del iframe (mismo patrón doble-banda que tenía deportes), skeleton animado `inset: 4rem 0 0 0` con `@keyframes nuevos-falleros-skeleton`, fallback noscript absolute, modo oscuro con overrides para card/intro/doc-wrapper, `prefers-reduced-motion` desactiva el skeleton. `_deportes.scss` queda limpio sin huérfanos. **Constraint crítico**: el doc-wrapper usa los mismos 4 valores en lockstep (`::before height 2rem`, `border-top 4rem`, `skeleton inset 4rem`, z-index hierarchy) — no añadir `padding-top` ni `margin-top` o se rompe la alineación de las dos bandas.
> 4. **Subtítulo alineado con doc-wrapper.** Modificador BEM `.nuevos-falleros__subtitulo--left` con `text-align: left; max-width: 110rem` (≤1024px) / `max-width: 100rem` (≥1025px) — coincide píxel a píxel con los breakpoints del `__doc-wrapper`, así el borde izquierdo del título "Documentos de interés general" alinea exactamente con el borde izquierdo del iframe centrado.
> 5. **i18n**: bloque `nuevosFalleros` completo en es/va/en/fr de `translations.json` con: `titulo`, `introIndex` (teaser), `intro` (página dedicada), `ctaIndex`/`ctaIndexAria`, `formulariosTitulo`, `docInteresTitulo`, `formMayores.{titulo,desc,cta,ctaAria}`, `formMenores.{titulo,desc,cta,ctaAria}`, `regionLabel`, `iframeTitle`, `fallback`, `abrirExterno`, `abrirExternoAria`. Nueva key `nav.nuevosFalleros` en los 4 idiomas. ES/VA con pre-render correcto en `dist/va/`.
> 6. **Navegación**: enlace "Nuevos Falleros" añadido al `<nav class="navegacion">` (header) y `<nav class="footer__nav">` (footer) tras "Galería" en **27 páginas HTML** (todas las que tienen el menú principal). Sitemap `src/sitemap.xml` +2 entradas (ES + VA) con `<xhtml:link rel="alternate">` bidireccional. Total 54 `<url>`.
> 7. **Estructura visual de la página dedicada**: el `<h2>` con escudo + el `<p>` intro original se ELIMINARON tras petición del usuario. La página entra directamente con el subtítulo "Documentos de interés general" sobre el iframe. El `id="nuevos-falleros-title"` se trasladó del `<h2>` eliminado al `<h3>` "Formularios descargables" para que `aria-labelledby` de la `<section>` siga apuntando a un elemento real (sin IDs huérfanos).
>
> 4.7.4 — Limpieza de URLs 404 reportadas por Google Search Console. `src/.htaccess` añade 4 reglas dentro del bloque `<IfModule mod_rewrite.c>` (después de `www → no-www`, antes de la negociación Markdown) que cubren los 4 patrones detectados en GSC: **A)** `/va/pdf/*` → 301 a `/pdf/*` (variantes VA que Google inventó y que nunca existieron), **B)** `migany2025*.pdf` → 410 Gone (eliminados sin equivalente; 410 retira del índice más rápido que 404), **C)** `2024_LLIBRET_FALLA _MORERES_DIGITAL.pdf` en raíz `/pdf/` → 301 a `/pdf/Llibrets/` (reorganización a subcarpeta), **D)** `C6xxx_*.pdf` → 301 a `/deportes.html` (bases JCF temporada 2025-26 sustituidas por las 2026-27 en `/pdf/JCF-2026-27/`). Procedimiento operativo y reglas para futuros 404 documentados en [`docs/google-search-console.md`](./docs/google-search-console.md).
>
> 4.7.3 — Pulido visual del tablón JCF en Deportes y nueva documentación de `/.well-known/`:
> 1. **Título del tablón en color primario.** `.deportes__tablon-titulo` pasa de blanco a `v.$primary-color` (coral) en modo claro sobre el azul institucional; en modo oscuro se mantiene blanco mediante override en el bloque `body.modo-oscuro .deportes` para preservar el contraste WCAG sobre el velo `v.$negro` del `::before`.
> 2. **Tablón responsivo en `<768px`.** En mobile el `.deportes__tablon-titulo` se centra (`justify-content: center; text-align: center`), reduce a `font-size: v.$font-size-regular` (alineado con `.deportes__delegados-titulo`) y compacta padding a `1.5rem 1rem 1rem`. Las notas del board (`.board__note-content` y `.board__file-name` en `src/scss/components/_board.scss`) bajan de `1.4rem` a `1.25rem` (line-height `1.4 → 1.35` en notas) en el mismo breakpoint — afecta a ambos tableros (`#notesBoard` y `#sportsBoard`) para coherencia visual.
> 3. **Nuevo `docs/well-known-agent-readiness.md`**: guía canónica completa de la carpeta `/.well-known/` (RFC 8615/8288/9727, Agent Skills v0.2, `Content-Signal`), pipeline `wellKnownTask`, qué se actualiza automáticamente vs manualmente, flujo de descubrimiento por agentes IA en 3 requests, y receta para añadir nuevas skills. Enlazado desde `docs/README.md` (índice + categoría SEO/IA) y desde el constraint "Agent-readiness" en este archivo.
>
> 4.7.2 — Tablón de anuncios JCF exclusivo en `deportes.html` y refactor de `board.js` a multi-instancia paramétrica:
> 1. **Multi-board en `src/js/board.js`**: el script ya no asume un único `#notesBoard` con `data/board.json`. Ahora descubre todos los `<div class="board">` del DOM, lee `data-board-source` (default `data/board.json`) y `id` (default `board-N`), y renderiza cada uno con su JSON. Cache de fetches en memoria (`boardSourceCache`) para no duplicar peticiones si dos tableros comparten fuente. Registro en `boardRegistry` para re-render coherente al disparar `langChanged` / `translationsReady`. `index.html` y `eventos.html` siguen pintando byte-equivalentes porque omiten `data-board-source` y caen al default.
> 2. **Nuevo `src/data/sports-board.json`**: 6 notas trasladadas desde `board.json` (bases campeonatos JCF de pádel, fútbol femenino, fútbol infantil, vóley playa, fútbol playa, concurso fotografía 2026). Prefijo editorial `📌 JCF 2026-27` para diferenciarlas del tablón general. `board.json` queda con una sola nota (`apunta-2026`, única que cumple el patrón `📝 Cita<br>` + fecha y por tanto la única que genera `Schema.org Event` en `gulpfile.js → getSchemaEvents`).
> 3. **Nuevo bloque en `src/deportes.html`** entre `aside.deportes__delegados` y `.deportes__doc-wrapper`: `<div class="deportes__board-wrapper"><h2 class="tablon-titulo deportes__tablon-titulo">Tablón de Anuncios</h2><div class="marco-tablon deportes__marco-tablon"><div class="board" id="sportsBoard" data-board-source="data/sports-board.json"></div></div></div>` + carga de `js/board.js` al final del body. Título alineado a la izquierda; en modo claro el `.marco-tablon` se vuelve transparente (`background: transparent; box-shadow: none; padding: 0`) para mostrar solo el corcho gris del `.board` sin el naranja-suave por defecto.
> 4. **Skill agent-ready `sports-board`** añadida al array `skills` de `wellKnownTask` (gulpfile.js) con URL `/data/sports-board.json`; el `sha256` se calcula automáticamente y aparece en `dist/.well-known/agent-skills/index.json` junto a `events-board`.
> 5. **Traducciones** en `src/data/translations.json` para los 4 idiomas: `deportes.tablonTitulo` ("Tablón de Anuncios" / "Tauler d'Anuncis" / "Noticeboard" / "Tableau d'Annonces") y `deportes.tablonAriaLabel`. Texto pre-renderizado en `dist/va/deportes.html`; las notas se renderizan en runtime con su `contenido.va` propio.
> 6. **Tests Playwright**: 3 tests nuevos en `tests/board.e2e.spec.js` bajo `Tablón Deportes (#sportsBoard)` validando 6 cards JCF con PDFs en `pdf/JCF-2026-27/`, re-render ES↔VA y no-regresión de `#notesBoard` (sigue mostrando ≥1 nota). 90/90 tests del smoke verdes.
>
> 4.7.1 — Agent-readiness pass. Cinco mejoras coordinadas para que el sitio se publique correctamente ante agentes IA y crawlers que siguen los nuevos estándares (RFC 8288, RFC 9727, Agent Skills v0.2, contentsignals.org, negociación markdown):
> 1. `src/robots.txt` declara `Content-Signal: search=yes, ai-train=yes, ai-input=yes` (sitio cultural público, busca exposición).
> 2. `src/.htaccess` emite `Link:` header en respuestas `*.html` apuntando a `/.well-known/api-catalog`, `/.well-known/agent-skills/index.json` y `/ai-discovery.json` (`describedby`).
> 3. Negociación de contenido Markdown: cuando `Accept: text/markdown` apunta a `/`, Apache reescribe a `/seo/ai-training-data.md`; los `.md` reciben `Content-Type: text/markdown; charset=utf-8` + `Vary: Accept`.
> 4. Nuevo `src/.well-known/api-catalog` (RFC 9727, `application/linkset+json`) lista los JSON endpoints (board, eventos, calendario, traducciones, sitemap-index) con sus `service-doc`/`service-desc`. `<Files "api-catalog"> ForceType application/linkset+json </Files>` resuelve la falta de extensión.
> 5. Nueva tarea Gulp `wellKnownTask`: copia `src/.well-known/**` a `dist/.well-known/` y genera `dist/.well-known/agent-skills/index.json` (Agent Skills Discovery v0.2.0) con `sha256` calculado a partir del contenido real en `dist/`. La task se encadena en el build series **después** de `dataTask`/`rootFilesTask`/`seoTask` para que los archivos referenciados existan. Si un recurso falta, la skill se omite con warning (no rompe el build).
>
> 4.7.0 — Fix condición de carrera en `calendario.html`: `#lista-anuncios` y `#descripcion-eventos-mes` tenían `data-i18n="..."` en lugar de `data-i18n-aria-label="..."`. `lang.js` sobreescribía su `textContent` con las cadenas de traducción ("Lista de anuncios", "Detalles del mes"), borrando los items renderizados dinámicamente por `calendario.js`. Cambiado a `data-i18n-aria-label` para que solo actualice el atributo `aria-label` sin destruir el contenido interior. Test guardia: `tests/reveal-on-scroll.e2e.spec.js` ("calendario.html vuelve a registrar tarjetas tras filtrar y limpiar").
>
> 4.6.24 — Reestructuración del repositorio bajo `src/`. Todos los archivos source (las 7 carpetas `src/scss/`, `src/js/`, `src/data/`, `src/img/`, `src/pdf/`, `src/seo/`, `src/favicon_io/`; los 27 HTML; y los archivos sueltos `manifest.json`, `robots*.txt`, `sitemap*.xml`, `sw.js`, `.htaccess`, `ai-discovery.json`) se han movido a `src/` con `git mv` (historial preservado). La raíz queda con tooling y configs (`package.json`, `gulpfile.js`, `playwright*.config.js`, `tests/`, `scripts/`, `docs/`, `dist/`). Paths actualizados en `gulpfile.js`, `scripts/generate-og-image.mjs`, `scripts/refactor-scss-namespaces.mjs`, `tests/scss-guardrails.e2e.spec.js`. `dist/` sigue siendo byte-equivalente al anterior; ninguna URL pública ni el SW cambian.
>
> 4.6.23 — Pre-render de traducciones VA en build time. `gulpfile.js` añade `prerenderTranslations()` que sustituye contenido y atributos `data-i18n`, `data-i18n-aria-label`, `data-i18n-placeholder`, `data-i18n-alt` y `data-i18n-title` por el valor de `translations.va` antes de servir `dist/va/*.html`. Los atributos `data-i18n*` permanecen en el HTML para que el toggle ES/VA en runtime siga funcionando. `src/js/lang.js` extendido para procesar también `data-i18n-alt` y `data-i18n-title` en runtime (antes los ignoraba). Kill switch `DISABLE_I18N_PRERENDER=1 npm run build` desactiva el pre-render sin revertir. ES queda intacto. Resultado SEO: `dist/index.html` y `dist/va/index.html` ahora divergen en contenido (no solo en atributo `lang`), eliminando la señal de duplicado y permitiendo indexación valenciana real.
>
> 4.6.22 — Fix SEO multi-idioma para resolver el aviso de GSC "Duplicada: el usuario no ha indicado ninguna versión canónica". El `gulpfile` pasa a ser la **única fuente de verdad** de `canonical` y `hreflang`: en `modifyHtmlStream` se eliminan ambos del source antes de reinyectar un bloque coherente con `canonical` autoreferencial (`/` para ES, `/va/` para VA) y `hreflang` bidireccional (`es`, `ca`, `x-default`). Se eliminan las URLs fantasma `?lang=ca`/`?lang=es` que aparecían como hreflang. `sitemap.xml` se reescribe con 48 entradas (24 ES + 24 VA), cada una con bloques `<xhtml:link rel="alternate">`.
>
> 4.6.21 — Sección Deportes: doble franja separadora superior (2rem coral + 2rem `#1f1f1f`) producida con dos mecanismos coordinados: `::before` del wrapper para la coral y `border-top: 4rem solid #1f1f1f` del iframe para la oscura (los primeros 2rem quedan tapados por el `::before`). Wrapper con fondo `v.$primary-color` y skeleton alineado en `inset: 4rem 0 0 0`.
>
> 4.6.20 — Nueva sección Deportes (`deportes.html` + teaser en `index.html`) que embebe un documento de Google Drive vía iframe. El contenido se gestiona desde Drive sin tocar el repo. Limpieza de `src/js/miboton.js` (rompía el primer `.boton` con un side-effect de inline style); todos los botones del proyecto comparten ahora la clase `.boton` con `:active` definido vía SCSS.

## Project Overview

WEBFALLASUISSA is the official website for Falla Suissa - L'Alqueria del Favero (#396), a traditional Valencian falla commission. Static site with events, galleries, weather integration, and Spanish/Valenciano language support.

- **Production**: [fallasuissa.es](https://fallasuissa.es)
- **Repository**: [xavitamarit74-code/FALLASUISSACLAUDE](https://github.com/xavitamarit74-code/FALLASUISSACLAUDE)

## Build Commands

```bash
npm run dev              # Build + watch for changes
npm run build            # Production build (outputs to dist/)
npm run test:e2e         # Run the smoke Playwright E2E suite
npm run test:e2e:full    # Run the complete Playwright E2E suite
npm run test:e2e:visual  # Run visual regression snapshots only
npm run test:e2e:install # Install Playwright browsers (first time)
npm run test:e2e:ui      # Interactive smoke test UI
npm run test:e2e:ui:full # Interactive full test UI

# Individual Gulp tasks
npx gulp css             # Compile SCSS only
npx gulp images          # Optimize images (WebP/AVIF)
npx gulp js              # Copy JavaScript
npx gulp html            # Process HTML
npx gulp data            # Copy JSON data files

# Run a specific test
npx playwright test tests/nav.e2e.spec.js
npx playwright test -g "mobile"       # Match by pattern
npx playwright test --headed           # Visible browser
npx playwright test --debug            # Debug mode
PLAYWRIGHT_REUSE_SERVER=true npx playwright test  # Skip server restart (debugging)

# SEO & Open Graph
npm run seo:dist         # Copy SEO folder to dist/
npm run generate:og      # Regenerate src/img/og-share.png (1200x630)
```

## Important Rules

- ALL source files live under `src/`. NEVER put new source files (HTML, JS, SCSS, JSON data, images, PDFs, sitemaps, etc.) in the repo root — only configs/tooling belong there (`package.json`, `gulpfile.js`, `playwright*.config.js`, `.gitignore`, `README.md`, `CLAUDE.md`, `LICENSE*`)
- ALWAYS run `npm run build` before committing
- ALWAYS run `npm run test:e2e` after CSS/JS changes
- Run `npm run test:e2e:full` when touching navigation, dark mode, gradient transitions, OG metadata, meteo UI, Swiper, or visual snapshots
- NEVER edit files in `dist/` directly (they are generated)
- NEVER remove SCSS variables without checking `tests/scss-guardrails.e2e.spec.js`
- NEVER reference `og-share.png` without cache-buster `?v=YYYYMMDD` (WhatsApp caching)
- NEVER change gradient backgrounds to solid colors directly - use the `::before` opacity pattern (see `docs/global-styles.md`)
- When adding translations: update `src/data/translations.json` for BOTH `es` and `va`
- Comments in code are written in Spanish

## Architecture

### Tech Stack

- **Build**: Gulp 5 + Dart Sass + PostCSS (autoprefixer) + CSSNano + Terser (JS minification) + Sharp
- **Frontend**: HTML5, SCSS (BEM), ES6+ JavaScript modules
- **Libraries (CDN)**: Swiper.js v11 (carousels, jsDelivr), Anime.js v3.2.1 (animations, cdnjs), EmailJS v4 (contact form, jsDelivr)
- **Libraries (npm)**: Flatpickr v4.6.13 (date picker)
- **Testing**: Playwright E2E (34 suites in full matrix, 8 smoke suites by default). Smoke suite (`npm run test:e2e`) runs: nav, i18n, board, reveal-on-scroll, countdown, banner-subvencion, index-colaboraciones, scss-guardrails

### Directory Structure

All source lives under `src/`. The repo root contains only tooling/configs/docs and the build output.

- `src/` - **All source files**:
  - `src/scss/` - Modular SCSS (imports order in `main.scss`: abstracts > base > optimization > layout > animaciones > components > sociales)
  - `src/js/` - ES6+ modules loaded per page
  - `src/data/` - JSON: `translations.json`, `board.json`, `eventos.json`, `calendarData.json`, `fallas.json`, `config.json`, `dataPages[1-6].json` (note: `blog.json` removed in v4.6.0)
  - `src/img/` - Raster + vector source images (build copies + generates WebP/AVIF into `dist/img/`)
  - `src/pdf/` - PDFs with HTML wrappers for favicon/social preview
  - `src/seo/` - Sitemaps, schema, robots variants
  - `src/favicon_io/` - Favicon assets
  - `src/*.html` - All page HTML (27 files: `index.html`, `lafalla.html`, blog pages, galerías, legal, etc.)
  - `src/manifest.json`, `src/robots*.txt`, `src/sitemap*.xml`, `src/sw.js`, `src/.htaccess`, `src/ai-discovery.json` - public-root files copied verbatim to `dist/`
- `dist/` - Generated output (DO NOT edit). Same structure as before (`dist/css/`, `dist/js/`, `dist/data/`, `dist/img/`, `dist/*.html`, etc.); the `src/` prefix is stripped by gulp tasks.
- `tests/` - Playwright E2E specs
- `scripts/` - Node utilities: `serve-dist.mjs` (test server), `generate-og-image.mjs` (OG image)
- `docs/` - Technical docs (Markdown)

> 📌 **Path convention in this document**: References to source files always carry the `src/` prefix (e.g., `src/js/lang.js`, `src/scss/components/_blog.scss`, `src/data/translations.json`). URL paths inside HTML/JS code (`<script src="js/foo.js">`, `fetch('/data/...')`, `<img src="img/...">`) are URLs of the served `dist/` and therefore do NOT carry the `src/` prefix.

### Key Architectural Patterns

**Dark Mode** (`src/js/dark.js`): Applies `.modo-oscuro`/`.modo-claro` classes. CSS uses `::before` pseudo-elements for gradient-to-solid transitions because CSS cannot animate between `linear-gradient` and solid color directly. Background gradient lives on `body::before` to allow opacity cross-fade to black.

**Blog** (`blog.html`, `blog-somni.html`, `blog-anima.html`): Static blog system with per-article SEO. Each article is a standalone HTML page with its own `<title>`, `<meta description>`, Schema.org `BlogPosting`, Open Graph (`og:type=article`, `article:published_time`), and Twitter Card tags. Blog cards on `blog.html` and `index.html` are hardcoded static HTML (no JS rendering). Translatable text uses `data-i18n` attributes loaded from `src/data/translations.json`. SCSS in `src/scss/components/_blog.scss` with `.blog` (listing) and `.blog-detail` (article) blocks. `.blog-detail__article` uses the same `::before` gradient overlay pattern as countdown/quieres-mas. Images inside use `z-index: 2` on the figure to stay above the gradient layer. Adding a new blog post = create static HTML page + add translations + add cards to `blog.html` and `index.html` + update `sitemap.xml`.

**Multi-Language** (`src/js/lang.js` + `src/js/initTranslations.js` + `gulpfile.js → prerenderTranslations`): Elements use `data-i18n="section.key"` attributes (plus `data-i18n-aria-label`, `data-i18n-placeholder`, `data-i18n-alt`, `data-i18n-title`, `data-i18n-format="paragraphs"`, `data-i18n-dynamic`). Loads `src/data/translations.json` on page load, persists choice to localStorage. `lang.js` fires `translationsReady` event after load and `langChanged` on switch. Dynamic components (board) must check `window.translations` first; if not ready, listen for `translationsReady` before rendering. Since v4.6.23 the build **pre-renderiza el valenciano**: `dist/va/*.html` contiene el texto VA ya horneado en el body antes de que cargue JS (mejora SEO + accesibilidad sin JS). El toggle ES/VA del header sigue funcionando en runtime porque los atributos `data-i18n*` permanecen en el HTML; al alternar, `lang.js` reescribe el DOM con el idioma elegido.

**HTML Build Pipeline** (`gulpfile.js` → `htmlTask` → `modifyHtmlStream`): During build, the HTML task is the **single source of truth** for SEO multi-idioma. For every source HTML it (1) strips any pre-existing `<link rel="canonical">` and `<link rel="alternate" hreflang="...">` so source files cannot drift, (2) re-injects a self-referential `canonical` (the URL of the file itself: `https://fallasuissa.es/<file>` for the ES build and `https://fallasuissa.es/va/<file>` for the VA build) plus a bidirectional `hreflang` block (`es`, `ca`, `x-default`), and (3) merges Schema.org `Event` JSON-LD from `src/data/board.json` into `index.html`/`eventos.html`. It also generates a `/va/` variant of every page with `lang="ca"`. Sitemap `<lastmod>` values are auto-updated based on file mtimes in `dist/`. Source HTML files in the repo root may still contain legacy `canonical`/`hreflang` lines — those are harmless because the build strips them; do NOT add new manual canonical/hreflang to source HTML or it will be silently removed at build time.

**Bulletin Board** (`src/js/board.js`): Multi-instancia desde v4.7.2. El script descubre **todos** los `<div class="board">` del DOM, lee `data-board-source` por elemento (default `data/board.json`) y los renderiza independientemente. Hoy hay dos tableros desplegados: `#notesBoard` (sin atributo → cae al default, presente en `index.html` y `eventos.html`) y `#sportsBoard` con `data-board-source="data/sports-board.json"` (presente en `deportes.html`). Las fuentes JSON se cachean en `boardSourceCache` (Map url→Promise) por si dos tableros comparten URL. Re-render coordinado al recibir `langChanged` o `translationsReady`. Cada nota soporta un campo opcional `imagen` (`{ url, alt: { es, va } }`) que se renderiza como `<figure class="board__figure"><img class="board__image" loading="lazy">` dentro de la nota — útil para carteles o infografías. Cuando una nota tiene `imagen` y/o `adjuntos`, se envuelve en `<article class="board__card">` (con el `<div class="board__note">` interior); notas sin extras renderizan directamente como `<article class="board__note">`. Los adjuntos aparecen como enlaces "Ver imagen"/"Descargar" con el sistema de iconos SVG existente. Para añadir un tablón nuevo en cualquier página: `<div class="board" data-board-source="data/mi-board.json" id="miBoard"></div>` + `<script src="js/board.js" defer>`. Sin tocar JS.

**Deportes** (`src/scss/components/_deportes.scss` + `deportes.html` + section `.deportes--teaser` on `index.html`): El orden interno de `deportes.html` (desde v4.7.5) es: hero → intro → aside delegados → **`#sportsBoard` (tablón JCF, ver Bulletin Board más arriba)**. El iframe Drive y el CTA "Abrir en pestaña nueva" se TRASLADARON a `nuevos-falleros.html` en v4.7.5 — `deportes.html` ya no embebe ningún documento Drive (sólo intro + delegados + tablón JCF). El tablón se nutre de `src/data/sports-board.json` y los PDFs viven en `src/pdf/JCF-2026-27/`; añadir/quitar notas ahí no requiere tocar ni HTML ni JS. La home (`.deportes--teaser`, `data-index="8"`) es solo intro + CTA `Ver Deportes` linking to `deportes.html` (no iframe ni tablón en home — preserves LCP/CLS). Background uses gradient `linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%)` (institutional blue, same as page header) with `::before` overlay that fades to `v.$negro` opaque in dark mode (gradient-to-solid pattern). Translations live under `deportes.{titulo,intro,ctaIndex,ctaIndexAria,tablonTitulo,tablonAriaLabel,delegadosTitulo}` in `src/data/translations.json` for `es`/`va`/`en`/`fr` (las keys `regionLabel/iframeTitle/fallback/abrirExterno/abrirExternoAria` quedan en el JSON sin referencias actuales — reutilizables si vuelve un iframe). CTAs use the global `.boton` class (do NOT redefine button styles in `_deportes.scss`).

**Nuevos Falleros** (`src/scss/components/_nuevos-falleros.scss` + `nuevos-falleros.html` + section `.nuevos-falleros--teaser` on `index.html`): Section for onboarding new falleros (added v4.7.5). El orden interno de `nuevos-falleros.html` (de arriba a abajo) es: header-inner → `<h3>Documentos de interés general</h3>` (alineado a la izquierda, `.nuevos-falleros__subtitulo--left`) → **iframe Drive** (file ID `1suCLG0EG6eU5TN5b2fIdOE89U17i-l3o-m_AjaSdYxU`) + skeleton + `<noscript>` fallback → CTA "Abrir en pestaña nueva" (link directo al doc Drive en `/view`) → `<h3>Formularios descargables</h3>` (centrado) → grid de 2 tarjetas linkando a `autorizacion-imagen.html` (mayores) y `autorizacion-imagen-menor.html` (menores). El iframe Drive **MUST** be set to "Anyone with the link can view" — sin eso, CSP `frame-ancestors` bloquea el embed en cualquier origen distinto a drive.google.com. El home teaser (`.nuevos-falleros--teaser`, `data-index="12"`) es solo heading (con icono `logo-escudo-cutty.svg`) + intro corta + CTA "Saber más" → `nuevos-falleros.html`. Background `v.$blanco-hueso` (modo claro) → `v.$negro-casi` (modo oscuro). Doc-wrapper coral con `aspect-ratio: 4/5` (default), `3/4` mobile, `1/1` tablet (768-1024px), y `max-width: 100rem` ≥1025px / `110rem` resto. El `__subtitulo--left` usa los mismos max-widths para alinear su borde izquierdo con el del iframe centrado. Translations: bloque `nuevosFalleros.{titulo,introIndex,ctaIndex,ctaIndexAria,intro,formulariosTitulo,docInteresTitulo,formMayores,formMenores,regionLabel,iframeTitle,fallback,abrirExterno,abrirExternoAria}` + key `nav.nuevosFalleros` en los 4 idiomas.

  - **`.deportes__doc-wrapper`**: 1px coral border (`v.$primary-color`), `border-radius: v.$border-radius`, `aspect-ratio: 4/5` (3/4 mobile, 1/1 tablet), `background-color: v.$primary-color`, `overflow: hidden`. Has a `::before` pseudo-element fixed at the top with `height: 2rem; background-color: v.$primary-color; z-index: 2` — this paints the **upper coral band** of the separator (it visually overlays the first 2rem of the iframe's dark `border-top`).
  - **`.deportes__doc` (the iframe)**: fills the wrapper with `width: 100%; height: 100%; box-sizing: border-box; border: none; border-top: 4rem solid #1f1f1f`. The dark band is **4rem tall in CSS**, but only the **lower 2rem are visible** because the wrapper's `::before` covers the upper 2rem with coral. Net visual layout: 2rem coral → 2rem dark `#1f1f1f` → document. CRITICAL: **do not add `padding-top` on the wrapper, `margin-top` on the iframe, or any other vertical offset** — each one compounds with the existing `border-top` and ruins the alignment of the two bands.
  - **`.deportes__doc-skeleton`**: `inset: 4rem 0 0 0` (NOT `inset: 0` and NOT `inset: 2rem 0 0 0`) so the loading shimmer starts exactly where the document area starts (below both bands). Same animation in dark mode but with `v.$gris-oscuro`/`v.$gris-muy-oscuro`.

**Collaborations** (`src/scss/components/_colaboraciones.scss` + `src/js/colaboraciones-lightbox.js`): Shared HOPE section on `index.html` and `colaboraciones.html`. Uses a traditional responsive grid (2 columns on mobile, 3 from `768px`), `object-fit: contain`, and an accessible lightbox. Tests: `tests/index-colaboraciones.e2e.spec.js`.

**Video Drone** (`src/js/video-dron.js` + `src/scss/components/_video-dron.scss`): Aerial video player section inside `<main class="falla">` on both `index.html` and `lafalla.html`, placed between the monumento slider and the falleros/nosotros section. Uses a custom poster overlay with play button SVG. Controls: play/pause, restart, fullscreen, mute/unmute (with icon toggle), volume slider (pill-shaped wrapper with primary color fill), and progress bar (seekable, full-width). All controls sync between inline and fullscreen players (volume, mute state, progress). Video source in `src/img/dron/`. The section uses `reveal reveal--soft` for scroll animation.

**Ofrenda** (`src/scss/components/_ofrenda.scss` + `src/js/ofrenda-video.js` + `ofrenda.html`): Section on `index.html` (between "La Falla" and "Colaboraciones") and dedicated inner page `ofrenda.html`. Dedicated to the Ofrenda Floral a la Virgen de los Desamparados. Contains a 3-image gallery (grid, `aspect-ratio: 3/4`, images use `position: absolute` on `.ofrenda__figura` — see Architecture Constraints) with lightbox via `.colaboraciones-mosaic__trigger` class (reuses existing lightbox JS). Also contains a video player with full controls (same pattern as video-dron: play/pause, restart, fullscreen with overlay, mute, volume, progress bar). Background uses `fondo_traje.png` with `::before` overlay `rgba(245,245,245,0.85)` (same pattern as `.falla`), dark mode transitions to `rgba(0,0,0,0.85)`. Navigation includes "Ofrenda" link between "La Falla" and "Colaboraciones" (`nav.ofrenda`). Sections separated by `<hr class="seccion-hr">` (visible only on desktop ≥768px).

**Timeline Navigation** (`src/js/timeline.js` + `src/scss/components/_timeline.scss`): Lateral progress indicator that shows dots for each `[data-index]` section (skipping hero at index 0). Desktop only (≥768px), hides when hero is visible. Dynamically creates a `<nav class="timeline">` with clickable dots and connector lines. Active dot highlights based on scroll position via IntersectionObserver.

**Testing**: Tests serve `dist/` via `scripts/serve-dist.mjs` on `http://127.0.0.1:4173`. Playwright config pre-sets `localStorage` key `bannerSubvencionCerrado=true` to hide the banner in tests. Banner runtime shows on each load of `index.html` unless an automated browser pre-sets that key. Set `PLAYWRIGHT_REUSE_SERVER=true` to skip server restart when debugging.

**Legal Pages** (`aviso-legal.html`, `privacidad.html`, `cookies.html` + `src/scss/components/_contenido-legal.scss`): RGPD/LSSI/ePrivacy compliant pages. Uses `header-inner` pattern. Styled with `.contenido-legal` component (white card on gray background, dark mode support). Footer of ALL pages includes `<nav class="footer__legal">` with links to the 3 legal pages.

**Cookie Banner** (`src/js/cookie-banner.js` + `src/scss/components/_cookie-banner.scss`): RGPD cookie consent banner. Shows on first visit if `localStorage.cookieConsent` is not set. Buttons: "Aceptar todas" / "Solo necesarias". Saves preference to localStorage. Fixed bottom bar with backdrop-filter. Tests: `tests/cookie-banner.e2e.spec.js`.

**Fullscreen Image Viewer** (`src/js/fullscreen.js`): Gallery notepad images can be enlarged. Uses native Fullscreen API when available (Chrome, Firefox, Safari macOS). On iPhone Safari (no Fullscreen API), creates a dynamic overlay lightbox as fallback. Tests: `tests/fullscreen-fallback.e2e.spec.js`.

**Known flaky tests**: Visual regression tests (snapshot mismatches), meteo animation tests (opacity timing), and countdown UI tests (timing-dependent) may intermittently fail. These are known issues, not regressions.

### Version Note

`package.json` and `package-lock.json` are synchronized with the current release version (4.7.5).

## Architecture Decisions & Constraints

These constraints arise from past bugs. Violating them will reintroduce issues:

- **Sección Nuevos Falleros (v4.7.5):** El iframe Drive de actividades (file ID `1suCLG0EG6eU5TN5b2fIdOE89U17i-l3o-m_AjaSdYxU`) vive ahora en `nuevos-falleros.html`, **NO** en `deportes.html`. Reglas:
  1. **No reintroduzcas el iframe ni el CTA "Abrir en pestaña nueva" en `deportes.html`.** Si se decide volver a meter un documento Drive en Deportes, créalo aparte y mantén `nuevos-falleros.html` independiente. Las keys `deportes.regionLabel/iframeTitle/fallback/abrirExterno/abrirExternoAria` siguen en `translations.json` precisamente por si se reutiliza ese flujo.
  2. **CSP `frame-ancestors`**: el documento Drive embebido en `nuevos-falleros.html` requiere visibilidad pública ("Cualquier usuario con el enlace - Lector"). Sin eso, el iframe se bloquea en cualquier origen distinto a `drive.google.com` y aparecen los errores típicos `Framing 'https://drive.google.com/' violates the following Content Security Policy directive: "frame-ancestors https://drive.google.com"` y redirecciones a `accounts.google.com/RotateCookiesPage`. NO añadas `<meta http-equiv="Content-Security-Policy">` al HTML — es Drive el que envía el CSP, no nosotros.
  3. **Doble-banda separadora del iframe**: el doc-wrapper en `_nuevos-falleros.scss` reproduce el mismo patrón de `_deportes.scss` antes de v4.7.5: `::before height: 2rem` (coral) + `iframe border-top: 4rem solid #1f1f1f` (la mitad superior queda tapada por el `::before`) + `skeleton inset: 4rem 0 0 0`. **Los cuatro valores se cambian en lockstep** o se rompe la alineación. NO añadas `padding-top` al wrapper ni `margin-top` al iframe.
  4. **Alineación del subtítulo izquierdo con el iframe**: `.nuevos-falleros__subtitulo--left` debe mantener los **mismos max-widths que el `__doc-wrapper`** en cada breakpoint (`110rem` ≤1024px / `100rem` ≥1025px). Si cambias el max-width del wrapper, cambia también el del subtítulo o se desalinean visualmente.
  5. **Página dedicada sin `<h2>` ni párrafo intro**: en v4.7.5 el usuario eliminó esos dos elementos. El `id="nuevos-falleros-title"` se trasladó al `<h3>Formularios descargables</h3>` para que `aria-labelledby` de la `<section>` siga apuntando a un elemento real. **NO añadas otro elemento con ese id** ni elimines el `id` del `<h3>` (rompería el `aria-labelledby` huérfano). Si quieres restaurar el `<h2>`, devuélvele el `id` antes de subir.
  6. **Formularios = HTMLs imprimibles, NO PDFs**: las tarjetas linkan a `autorizacion-imagen.html` y `autorizacion-imagen-menor.html` (preexistentes desde v4.6.x con tabla imprimible vía Cmd+P → "Guardar como PDF"). NO crees PDFs duplicados: las HTMLs ya tienen traducciones ES/VA dinámicas y se mantienen mejor que un PDF estático. Si se añaden más formularios, sigue el mismo patrón: HTML imprimible + tarjeta nueva en el grid + bloque i18n nuevo bajo `nuevosFalleros`.

- **Multi-board paramétrico y tablón JCF en Deportes (v4.7.2):** El componente `board` admite N instancias por página desde v4.7.2. Reglas:
  1. **No vuelvas a hardcodear `#notesBoard` ni `data/board.json`** en `src/js/board.js`. El render se hace sobre `document.querySelectorAll('div.board')`; cada tablero lleva su `data-board-source` y su `id`. Si te falta una característica concreta (p. ej. filtros), añádela parametrizable, no por nombre fijo.
  2. **Las notas deportivas viven en `src/data/sports-board.json`, NO en `board.json`.** Mover una nota deportiva a `board.json` la sacará en `index.html`/`eventos.html`. Solo `board.json` alimenta el JSON-LD `Schema.org Event` que se inyecta en esas dos páginas (vía `getSchemaEvents` en `gulpfile.js:286-441`); las notas JCF no son Events (no tienen `📝 Cita<br>` + fecha) y por eso no afectan al schema.
  3. **La skill agent-ready `sports-board`** (en `wellKnownTask` skills array) apunta a `/data/sports-board.json`. Si renombras el archivo, actualiza el `distPath` y el `url` o la skill se omitirá silenciosamente al construir.
  4. **El marco del tablón en Deportes es transparente en modo claro.** `.deportes__marco-tablon` override `background: transparent; box-shadow: none; padding: 0` para que solo se vea el corcho gris del `.board` sobre el azul institucional. NO reintroducir el fondo `$naranja-suave` heredado de `.marco-tablon` base — la combinación naranja sobre azul es ilegible.
  5. **Título alineado a la izquierda y en blanco.** `.deportes__tablon-titulo` override `color: v.$blanco; justify-content: flex-start; text-align: left` (el `.tablon-titulo` base usa `$primary-color` sobre fondo blanco y `justify-content: left` con padding 4rem 6rem). NO centrar ni recolorear sin probar contraste con el velo dark mode.
  6. **`<script src="js/board.js" defer>` debe cargarse en `deportes.html`.** Si lo quitas, el `#sportsBoard` quedará vacío y el render no fallará explícitamente (el contenedor existe pero nadie lo rellena). Tres tests Playwright en `tests/board.e2e.spec.js > Tablón Deportes (#sportsBoard)` validan que las 6 cards JCF aparecen.
  7. **Guía operativa para delegados:** ver [`docs/gestion-tablon.md`](./docs/gestion-tablon.md) — incluye flujo para añadir/desactivar/eliminar notas JCF sin tocar HTML/JS/SCSS.

- **Agent-readiness — `/.well-known/` y orden del build (v4.7.1):** El soporte agent-ready vive en tres sitios coordinados; cambiar cualquiera sin tocar los otros rompe el descubrimiento. Guía detallada en [`docs/well-known-agent-readiness.md`](./docs/well-known-agent-readiness.md) (RFC 8615/8288/9727, Agent Skills v0.2, qué se actualiza solo y qué a mano, flujo end-to-end).
  1. `src/.htaccess` declara el `Link:` header sobre `*.html`. La lista de relaciones (`api-catalog`, `agent-skills`, `describedby`) debe coincidir con los archivos servidos bajo `/.well-known/` y con `/ai-discovery.json`. Si añades una relación nueva (p. ej. `mcp-server`), súmala al `Header set Link` y publica el recurso al mismo tiempo.
  2. `/.well-known/api-catalog` se sirve **sin extensión** (RFC 9727). Apache no infiere su MIME; `<Files "api-catalog"> ForceType application/linkset+json </Files>` se encarga. NO renombres el archivo a `api-catalog.json` ni borres el bloque `<Files>` o el catálogo se servirá como `text/html` y los agentes lo descartarán.
  3. La task `wellKnownTask` en `gulpfile.js` se ejecuta **después** de `dataTask`, `rootFilesTask` y `seoTask` porque calcula `sha256` de archivos en `dist/`. NO la muevas antes en el series — quedarían skills sin hash. Si una skill apunta a un archivo que aún no existe en `dist/`, se omite con warning (no falla el build).
  4. Para añadir o quitar skills: edita el array `skills` en `wellKnownTask` (gulpfile). El `sha256` se recalcula en cada build, por eso es estable contra cambios de contenido. NO escribas a mano `dist/.well-known/agent-skills/index.json` — lo sobrescribe el build.
  5. La negociación de contenido Markdown solo afecta a `/` (sirve `seo/ai-training-data.md` cuando `Accept: text/markdown`) y a páginas con un `.md` hermano. Si quieres versiones markdown por página, genera `.md` junto a cada `.html` durante el build y la regla de `.htaccess` los servirá automáticamente.
  6. `Content-Signal` en `robots.txt` está en `yes/yes/yes` porque el sitio es contenido cultural público y persigue exposición. Si en algún momento se quisiera bloquear training (`ai-train=no`), edita esa línea — el resto del agent-readiness sigue funcionando.

- **Pre-render i18n VA en build (v4.6.23):** El pipeline pre-renderiza valenciano en `gulpfile.js → prerenderTranslations()`. Reglas:
  1. **Los atributos `data-i18n*` deben PERMANECER en el HTML servido**: NO eliminarlos del HTML del root ni filtrarlos en el build. Son la única forma de que el toggle a ES funcione client-side sin recargar.
  2. **No tocar `src/data/translations.json` esperando que el HTML cambie sin rebuild**: el HTML pre-renderizado se genera en build time. Tras editar el JSON: `npm run build`.
  3. **Para añadir un nuevo atributo i18n** (p. ej. `data-i18n-aria-describedby`): hay que actualizar a la vez `prerenderTranslations` en `gulpfile.js` (array `attrMappings`) Y el array de selectores en `src/js/lang.js → updateTranslations()`. Ambos deben procesar el mismo set, o el toggle runtime y el build se desincronizarán.
  4. **Claves faltantes en VA**: el build NO se rompe; el HTML conserva el texto fuente como fallback y emite `[i18n-prerender] missing key: <clave> @ <archivo>`. Aparecen como warning, no como error. Revisar tras cada cambio en `translations.json`.
  5. **Kill switch**: `DISABLE_I18N_PRERENDER=1 npm run build` desactiva el pre-render sin revertir el commit; útil para diagnóstico en producción.
  6. **`data-i18n-dynamic`** (meteo): el pre-render lo skipea. NO añadir contenido pre-renderizado a estos elementos — los rellena `src/js/meteo.js` en runtime con datos en vivo.
  7. **`data-i18n-format="paragraphs"`**: el pre-render genera `<p>` por bloque dividido por `\n+`, replicando exactamente `renderParagraphTranslation` de `lang.js`. Mantener simetría si se modifica uno de los dos.
  8. **Solo VA pre-renderiza, ES no**: ES queda byte-idéntico al source. Si en el futuro se quisiera pre-renderizar también ES (drift detection), añadir flag opt-in `PRERENDER_ES=1`. NO activar por defecto.
  9. **Test guardia**: `tests/i18n-prerender.e2e.spec.js` valida que `dist/va/index.html` contiene texto VA, `dist/index.html` ES, y los `data-i18n*` siguen presentes. Está en el smoke suite.

- **SEO multi-idioma — gulpfile como única fuente (v4.6.22):** El bloque `canonical` + `hreflang` lo gestiona **exclusivamente** `gulpfile.js` (`modifyHtmlStream`). En cada build se eliminan del source todos los `<link rel="canonical">` y `<link rel="alternate" hreflang="...">` antes de reinyectar la versión correcta. Reglas:
  1. **No añadir** `canonical` ni `hreflang` a mano en los HTML del root: el build los borra. Si necesitas tocarlos, edita `modifyHtmlStream` en `gulpfile.js`.
  2. El `canonical` debe ser **autoreferencial** (cada URL apunta a sí misma): la ES a `https://fallasuissa.es/<file>` y la VA a `https://fallasuissa.es/va/<file>`. NUNCA hagas que `/va/X.html` declare canonical hacia `/X.html` — eso reproduce el aviso de GSC "Duplicada: el usuario no ha indicado ninguna versión canónica" (canonical y hreflang en conflicto se ignoran ambos).
  3. **No usar URLs `?lang=ca` ni `?lang=es`** como destino de hreflang: no son páginas crawlables (el cambio de idioma es client-side via `src/js/lang.js`).
  4. `sitemap.xml` mantiene **48 entradas** (24 ES + 24 VA) con bloques `<xhtml:link rel="alternate">` por entrada. Cuando añadas una página nueva, añade SUS DOS entradas (ES y VA) con los 3 alternates.

- **Mobile menu z-index stacking (v4.0.0):** Backdrop is inserted inside `.header__barra` (not `body`). Z-index: menu 2500, backdrop 1500, menu button 2600. Moving backdrop to `body` breaks stacking context.

- **Gradient transitions (v4.1.0):** `.quieres-mas` and `.countdown__contenedor` use `::before` for gradient overlay, dark mode fades opacity to 0. Tests: `quieres-mas-transition.e2e.spec.js`, `countdown-transition.e2e.spec.js`.

- **Desktop navigation z-index (v4.1.1):** `.navegacion` needs `position: relative; z-index: 5` at desktop (>768px) to stay above glassmorphism overlay.

- **Notification animations (v4.2.7):** Only ONE animation rule for notifications. `_notificaciones.scss` owns `#notificacion.mostrar`. Do NOT add competing rule in `_accessibility.scss` for `.header__notificacion:not(:empty)` - causes ghost notification flash.

- **Banner subvencion (v4.2.11-4.2.16):** Multiple constraints apply:
  - **Visible on every home load**: `banner-subvencion.js` does NOT persist closure to `localStorage` and must not use a session cookie to gate real-user visibility. The banner appears every time `index.html` loads. The `localStorage.getItem('bannerSubvencionCerrado')` check exists solely for Playwright tests. Do NOT re-add `localStorage.setItem` in `cerrarBanner()`.
  - **Non-modal card**: the banner is a floating card, not a blocking fullscreen modal with backdrop. Do NOT revert it to an overlay that prevents interaction with the page.
  - **Accessible hide sequence**: hidden state relies on `inert` + `aria-hidden="true"`. When closing the banner, move focus off the close button before applying `aria-hidden` to the ancestor container; otherwise Chromium logs an accessibility warning because the focused descendant becomes hidden from assistive tech.
  - **Dark mode image**: Uses `filter: invert(1) hue-rotate(180deg)`. Do NOT use `invert(1)` alone - it turns the red Ajuntament crest green. The `hue-rotate(180deg)` restores red tones after inversion.
  - **Safari fix**: Uses `<picture>` with AVIF/WebP/PNG instead of SVG. Safari WebKit bug ([#246106](https://bugs.webkit.org/show_bug.cgi?id=246106)) prevents CSS `filter` from compositing correctly on SVGs with internal filter elements. Do NOT revert to `<img src="subvencion.svg">`. Size: SVG 289KB -> AVIF 25KB (-91%).

- **Cookie Banner Safari fixes (v4.6.10):** The `cookie-banner.js` script includes two critical workarounds for macOS / iOS Safari:
  1. **LocalStorage Blocking**: Safari throws a `SecurityError` when `localStorage` is completely blocked. Both `getItem` and `setItem` calls MUST be wrapped in a `try/catch` block. Failing to do so crashes the script and completely prevents the banner from rendering.
  2. **Reflow & Transition Bug**: Safari frequently skips CSS transitions (`transform: translateY(100%) -> 0`) if the transition class is appended in the same frame as the banner's insertion into the DOM. WebKit aggressively groups these DOM updates. To avoid the banner remaining hidden permanently, the script MUST use `setTimeout(() => {...}, 50)` instead of `requestAnimationFrame` or `void banner.offsetWidth`. Do NOT revert to `requestAnimationFrame`.

- **Ofrenda image stacking (v4.6.9):** `.ofrenda__figura` uses `position: relative` + `aspect-ratio: 3/4` as the containing block. The `<button class="colaboraciones-mosaic__trigger">` inside is `position: absolute; inset: 0` to fill the figure. The `<img class="ofrenda__imagen">` must fill this container completely (`width: 100%; height: 100%; object-fit: cover`). To override styling inherited from the trigger (`padding`, `display: flex`, `object-fit: contain`), `.colaboraciones-mosaic__trigger` is heavily overridden locally in `_ofrenda.scss` using `padding: 0 !important;` and `display: block;`. The image is nested within the trigger to guarantee CSS specificity. Do NOT: nest the image outside the trigger, remove `!important` from the padding rule, or switch the display property back to `flex`, as this will cause the image to break its aspect ratio or render margins within the flex container.

- **No text-transform: capitalize (v4.6.8):** Do NOT use `text-transform: capitalize` anywhere in the SCSS. It forces uppercase on every word including prepositions and articles mid-sentence ("Blog De Nuestra Falla" instead of "Blog de nuestra Falla"). All capitalization must come from the text source (translations.json, HTML). Use `text-transform: none` or omit the property entirely.

- **"Falla/Fallas" always capitalized (v4.6.8):** The words "Falla" and "Fallas" must ALWAYS have uppercase F in all visible text (translations, HTML, meta descriptions). This applies to all languages (ES: "Falla/Fallas", VA: "Falla/Falles"). Do NOT write "nuestra falla" — write "nuestra Falla".

- **Blog-detail image stacking (v4.3.11):** `.blog-detail__figure` needs `z-index: 2` to stay above the `::before` pseudo-element (blue gradient, z-index: 0) of `.blog-detail__article`. Centering uses `margin: 1.5rem auto` + `max-width: 48rem` on the figure (not flexbox, which causes issues with `<picture>`). Image uses `display: block; width: 100%`. On mobile the figure switches to `max-width: 100%`.

- **Deportes iframe — doble franja separadora superior (v4.6.21):** The 4rem-tall separator above the Drive document is produced by **two coordinated mechanisms** (CSS does not allow a multi-color `border-top`):
  1. `.deportes__doc-wrapper::before` paints a 2rem coral strip at the top with `position: absolute; top: 0; left: 0; right: 0; height: 2rem; background-color: v.$primary-color; z-index: 2; pointer-events: none`.
  2. `.deportes__doc` has `border-top: 4rem solid #1f1f1f; height: 100%; box-sizing: border-box`. The first 2rem of that border are hidden under the wrapper's `::before`; only the lower 2rem remain visible.
  3. `.deportes__doc-skeleton` uses `inset: 4rem 0 0 0` so the shimmer never bleeds into either band.

  Visual layout (top → bottom): 2rem coral → 2rem `#1f1f1f` → document. Do **not** add `padding-top` to the wrapper, `margin-top` to the iframe, or change the iframe to `inset: 0` — any of those breaks alignment between the two bands. To change the band heights, edit FOUR values in lockstep: the wrapper `::before` `height`, the iframe `border-top` width (= sum of both bands), the skeleton's `inset` first value, and the doc-wrapper z-index hierarchy if needed.

- **Nav & footer underline hover pattern (v4.6.15):** Both `.navegacion__enlace` (header) and `.footer__enlace` share a single hover/active pattern — a `::after` underline (2px, `v.$primary-color`) that animates `width: 0 → calc(100% - padding*2)` and `opacity: 0 → 1` (desvanecimiento variant). Text colour shifts to `v.$primary-color` on `:hover`, `:focus-visible` and on `.active` / `[aria-current="page"]`. No background pill on active state — the coloured text + permanent underline ARE the indicator. Do NOT re-add `background-color: rgba(255,255,255,...)` or dark-mode `background-color: v.$gris-claro` overrides for the active state. The footer block still keeps `!important` on several declarations because of historical specificity battles with global resets — keep them when editing.

## Common Patterns

### Adding a translation

1. Add key to `src/data/translations.json` under both `es` and `va`
2. Use in HTML: `<span data-i18n="section.subsection.key"></span>`
3. Run `npm run build`

### Adding a new page

1. Create HTML file in `src/` (do NOT add `<link rel="canonical">` ni `hreflang` — los inyecta el build)
2. Add **two** entries to `src/sitemap.xml` (one for ES, one for `/va/`), each with `<xhtml:link rel="alternate">` for `es`, `ca`, `x-default`
3. Add URL to `src/sitemap-index.xml` if needed
4. Run `npm run build`

### Updating Open Graph image

1. Run `npm run generate:og` (writes to `src/img/og-share.png`)
2. Update cache-buster `?v=YYYYMMDD` in ALL HTML files (og:image, twitter:image, image_src)
3. Run `npm run build` then `npm run test:e2e:full`

### Adding a blog post

1. Create a static HTML page (`src/blog-{slug}.html`) based on `src/blog-somni.html` or `src/blog-anima.html` as template. Include specific SEO: `<title>`, `<meta description>`, Schema.org `BlogPosting` (with headline, datePublished, author), Open Graph (`og:type=article`, `article:published_time`), and Twitter Card tags
2. Add all translatable text to `src/data/translations.json` under both `es` and `va` (cardTitle, title, lead, date, excerpt, author, back, backAria, ctaAria, content blocks, image alt/caption)
3. Add static blog cards to `src/blog.html` and `src/index.html` with hrefs pointing to the new page
4. Add URL to `src/sitemap.xml`
5. Run `npm run build`

### Adding a PDF with social preview

Use HTML wrappers (see `src/pdf/Llibrets/` for examples). Include favicon, Open Graph, Twitter Card tags. Embed PDF with `<object>` and fallback download button. Link to `.html` wrapper instead of `.pdf`.

## Code Style

- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:, refactor:)
- Breakpoints: mobile `max-width: 767px`, desktop `min-width: 768px`
- Key SCSS variables in `src/scss/abstracts/_variables.scss` (primary: `$primary-color` #FF6F61, institutional blue: `$color-azul-falla` #004BCF)
