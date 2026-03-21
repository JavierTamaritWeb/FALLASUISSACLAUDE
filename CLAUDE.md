# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 4.6.4
**Last Updated:** 21 de marzo de 2026

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
npm run generate:og      # Regenerate img/og-share.png (1200x630)
```

## Important Rules

- ALWAYS run `npm run build` before committing
- ALWAYS run `npm run test:e2e` after CSS/JS changes
- Run `npm run test:e2e:full` when touching navigation, dark mode, gradient transitions, OG metadata, meteo UI, Swiper, or visual snapshots
- NEVER edit files in `dist/` directly (they are generated)
- NEVER remove SCSS variables without checking `tests/scss-guardrails.e2e.spec.js`
- NEVER reference `og-share.png` without cache-buster `?v=YYYYMMDD` (WhatsApp caching)
- NEVER change gradient backgrounds to solid colors directly - use the `::before` opacity pattern (see `docs/global-styles.md`)
- When adding translations: update `data/translations.json` for BOTH `es` and `va`
- Comments in code are written in Spanish

## Architecture

### Tech Stack

- **Build**: Gulp 5 + Dart Sass + PostCSS (autoprefixer) + CSSNano + Sharp
- **Frontend**: HTML5, SCSS (BEM), ES6+ JavaScript modules
- **Libraries (CDN)**: Swiper.js v11 (carousels, jsDelivr), Anime.js v3.2.1 (animations, cdnjs), EmailJS v4 (contact form, jsDelivr)
- **Libraries (npm)**: Flatpickr v4.6.13 (date picker)
- **Testing**: Playwright E2E (33 suites in full matrix, 8 smoke suites by default). Smoke suite (`npm run test:e2e`) runs: nav, i18n, board, reveal-on-scroll, countdown, banner-subvencion, index-colaboraciones, scss-guardrails

### Directory Structure

- `scss/` - Modular SCSS (imports order in `main.scss`: abstracts > base > optimization > layout > animaciones > components > sociales)
- `js/` - ES6+ modules loaded per page
- `data/` - JSON: `translations.json`, `board.json`, `eventos.json`, `calendarData.json`, `fallas.json`, `config.json`, `dataPages[1-6].json` (note: `blog.json` removed in v4.6.0)
- `dist/` - Generated output (DO NOT edit)
- `tests/` - Playwright E2E specs
- `scripts/` - Node utilities: `serve-dist.mjs` (test server), `generate-og-image.mjs` (OG image)
- `docs/` - Technical docs (Markdown)
- `seo/` - Sitemaps, schema, robots variants
- `pdf/` - PDFs with HTML wrappers for favicon/social preview

### Key Architectural Patterns

**Dark Mode** (`js/dark.js`): Applies `.modo-oscuro`/`.modo-claro` classes. CSS uses `::before` pseudo-elements for gradient-to-solid transitions because CSS cannot animate between `linear-gradient` and solid color directly. Background gradient lives on `body::before` to allow opacity cross-fade to black.

**Blog** (`blog.html`, `blog-somni.html`, `blog-anima.html`): Static blog system with per-article SEO. Each article is a standalone HTML page with its own `<title>`, `<meta description>`, Schema.org `BlogPosting`, Open Graph (`og:type=article`, `article:published_time`), and Twitter Card tags. Blog cards on `blog.html` and `index.html` are hardcoded static HTML (no JS rendering). Translatable text uses `data-i18n` attributes loaded from `data/translations.json`. SCSS in `scss/components/_blog.scss` with `.blog` (listing) and `.blog-detail` (article) blocks. `.blog-detail__article` uses the same `::before` gradient overlay pattern as countdown/quieres-mas. Images inside use `z-index: 2` on the figure to stay above the gradient layer. Adding a new blog post = create static HTML page + add translations + add cards to `blog.html` and `index.html` + update `sitemap.xml`.

**Multi-Language** (`js/lang.js` + `js/initTranslations.js`): Elements use `data-i18n="section.key"` attributes. Loads `data/translations.json` on page load, persists choice to localStorage. `lang.js` fires `translationsReady` event after load and `langChanged` on switch. Dynamic components (board) must check `window.translations` first; if not ready, listen for `translationsReady` before rendering.

**HTML Build Pipeline** (`gulpfile.js` → `htmlTask`): During build, the HTML task auto-injects into every page: (1) `hreflang` alternate links for `es`/`ca`/`x-default`, and (2) Schema.org `Event` JSON-LD extracted from `data/board.json`. It also generates a `/va/` variant of every page with `lang="ca"`. Sitemap `<lastmod>` values are auto-updated based on file mtimes in `dist/`.

**Bulletin Board** (`js/board.js`): Fetches `data/board.json`, renders on `eventos.html`.

**Collaborations** (`scss/components/_colaboraciones.scss` + `js/colaboraciones-lightbox.js`): Shared HOPE section on `index.html` and `colaboraciones.html`. Uses a traditional responsive grid (2 columns on mobile, 3 from `768px`), `object-fit: contain`, and an accessible lightbox. Tests: `tests/index-colaboraciones.e2e.spec.js`.

**Video Drone** (`js/video-dron.js` + `scss/components/_video-dron.scss`): Aerial video player section inside `<main class="falla">` on both `index.html` and `lafalla.html`, placed between the monumento slider and the falleros/nosotros section. Uses a custom poster overlay with play button SVG. Controls: play/pause, restart, fullscreen, mute/unmute (with icon toggle), volume slider (pill-shaped wrapper with primary color fill), and progress bar (seekable, full-width). All controls sync between inline and fullscreen players (volume, mute state, progress). Video source in `img/dron/`. The section uses `reveal reveal--soft` for scroll animation.

**Timeline Navigation** (`js/timeline.js` + `scss/components/_timeline.scss`): Lateral progress indicator that shows dots for each `[data-index]` section (skipping hero at index 0). Desktop only (≥768px), hides when hero is visible. Dynamically creates a `<nav class="timeline">` with clickable dots and connector lines. Active dot highlights based on scroll position via IntersectionObserver.

**Testing**: Tests serve `dist/` via `scripts/serve-dist.mjs` on `http://127.0.0.1:4173`. Playwright config pre-sets `localStorage` key `bannerSubvencionCerrado=true` to hide the banner in tests. Banner runtime shows on each load of `index.html` unless an automated browser pre-sets that key. Set `PLAYWRIGHT_REUSE_SERVER=true` to skip server restart when debugging.

**Known flaky tests**: Visual regression tests (snapshot mismatches), meteo animation tests (opacity timing), and countdown UI tests (timing-dependent) may intermittently fail. These are known issues, not regressions.

### Version Note

`package.json` and `package-lock.json` are synchronized with the current release version (4.6.4).

## Architecture Decisions & Constraints

These constraints arise from past bugs. Violating them will reintroduce issues:

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

- **Blog-detail image stacking (v4.3.11):** `.blog-detail__figure` needs `z-index: 2` to stay above the `::before` pseudo-element (blue gradient, z-index: 0) of `.blog-detail__article`. Centering uses `margin: 1.5rem auto` + `max-width: 48rem` on the figure (not flexbox, which causes issues with `<picture>`). Image uses `display: block; width: 100%`. On mobile the figure switches to `max-width: 100%`.

## Common Patterns

### Adding a translation

1. Add key to `data/translations.json` under both `es` and `va`
2. Use in HTML: `<span data-i18n="section.subsection.key"></span>`
3. Run `npm run build`

### Adding a new page

1. Create HTML file in root directory
2. Add URL to `sitemap.xml` and `sitemap-index.xml`
3. Run `npm run build`

### Updating Open Graph image

1. Run `npm run generate:og`
2. Update cache-buster `?v=YYYYMMDD` in ALL HTML files (og:image, twitter:image, image_src)
3. Run `npm run build` then `npm run test:e2e:full`

### Adding a blog post

1. Create a static HTML page (`blog-{slug}.html`) based on `blog-somni.html` or `blog-anima.html` as template. Include specific SEO: `<title>`, `<meta description>`, Schema.org `BlogPosting` (with headline, datePublished, author), Open Graph (`og:type=article`, `article:published_time`), and Twitter Card tags
2. Add all translatable text to `data/translations.json` under both `es` and `va` (cardTitle, title, lead, date, excerpt, author, back, backAria, ctaAria, content blocks, image alt/caption)
3. Add static blog cards to `blog.html` and `index.html` with hrefs pointing to the new page
4. Add URL to `sitemap.xml`
5. Run `npm run build`

### Adding a PDF with social preview

Use HTML wrappers (see `pdf/Llibrets/` for examples). Include favicon, Open Graph, Twitter Card tags. Embed PDF with `<object>` and fallback download button. Link to `.html` wrapper instead of `.pdf`.

## Code Style

- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:, refactor:)
- Breakpoints: mobile `max-width: 767px`, desktop `min-width: 768px`
- Key SCSS variables in `scss/abstracts/_variables.scss` (primary: `$primary-color` #FF6F61, institutional blue: `$color-azul-falla` #004BCF)
