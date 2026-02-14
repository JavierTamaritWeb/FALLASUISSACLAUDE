# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 4.2.9
**Last Updated:** 13 de febrero de 2026

## Project Overview

WEBFALLASUISSA is the official website for Falla Suïssa - L'Alqueria del Favero (#396), a traditional Valencian falla commission. The site manages events, galleries, weather integration, and supports Spanish/Valenciano languages.

## Project URLs

- **Production**: https://fallasuissa.es
- **Repository**: https://github.com/xavitamarit74-code/FALLASUISSACLAUDE

## Important Rules

- ALWAYS run `npm run build` before committing
- ALWAYS run `npm run test:e2e` after CSS/JS changes
- NEVER edit files in `dist/` directly (they are generated)
- NEVER remove SCSS variables without checking `tests/scss-guardrails.e2e.spec.js`
- NEVER reference `og-share.png` without cache-buster `?v=YYYYMMDD` (WhatsApp caching)
- NEVER change gradient backgrounds to solid colors directly - use the `::before` opacity pattern (see `docs/global-styles.md`)
- When adding translations: update `data/translations.json` for BOTH `es` and `va`
- Comments in code are written in Spanish

## Architecture Decisions & Constraints

These constraints arise from past bugs. Violating them will reintroduce issues:

- **Mobile menu z-index stacking (v4.0.0):** The backdrop is inserted inside `.header__barra` (not `body`). Menu z-index: 2500, backdrop: 1500, menu button: 2600. Moving the backdrop to `body` breaks the stacking context.
- **Gradient transitions (v4.1.0):** `.quieres-mas` and `.countdown__contenedor` use `::before` pseudo-element for gradient. Dark mode fades opacity to 0. CSS cannot animate between `linear-gradient` and solid color directly. Tests: `quieres-mas-transition.e2e.spec.js`, `countdown-transition.e2e.spec.js`
- **Desktop navigation z-index (v4.1.1):** `.navegacion` needs `position: relative` and `z-index: 5` (desktop >768px) to stay above the glassmorphism background overlay.
- **Notification animations (v4.2.7):** Only ONE animation rule for notifications must exist. `_notificaciones.scss` owns the `#notificacion.mostrar` animation. Do NOT add a competing rule in `_accessibility.scss` for `.header__notificacion:not(:empty)` — it causes a ghost notification flash.

## Build Commands

```bash
# Development (build + watch for changes)
npm run dev

# Production build (outputs to dist/)
npm run build

# E2E tests (tests serve dist/ on http://127.0.0.1:4173)
npm run test:e2e:install    # Install Playwright browsers (once)
npm run test:e2e            # Run all tests
npm run test:e2e:ui         # Interactive test UI

# Individual Gulp tasks
npx gulp css                # Compile SCSS
npx gulp images             # Optimize images (WebP/AVIF)
npx gulp js                 # Copy JavaScript
npx gulp html               # Process HTML

# SEO & Open Graph
npm run seo:dist            # Copy SEO folder to dist/
npm run generate:og         # Regenerate img/og-share.png (1200x630)
```

## Architecture

### Tech Stack
- **Build**: Gulp 5 with Dart Sass, PostCSS (autoprefixer), CSSNano, Sharp for images
- **Frontend**: HTML5, SCSS (BEM methodology), ES6+ JavaScript modules
- **Libraries**: Swiper.js (carousels), Flatpickr (dates), DOMPurify
- **Testing**: Playwright for E2E tests

### Directory Structure
- `scss/` - Modular SCSS: abstracts/, base/, layout/, components/, animaciones/, optimization/, sociales/
- `js/` - ES6+ modules (see JS Modules below)
- `scripts/` - Node.js utilities: generate-og-image.mjs, serve-dist.mjs
- `data/` - JSON files: `board.json`, translations.json, eventos.json, calendarData.json, fallas.json, config.json, dataPages[1-4].json
- `dist/` - Production build output (DO NOT edit directly)
- `tests/` - Playwright E2E tests (33 test files)
- `docs/` - Technical documentation (Markdown)
- `seo/` - AI/SEO optimization files (sitemaps, schema, robots variants)
- `pdf/` - PDF files with HTML wrappers for favicon/social preview support

### JS Modules (`js/`)
- **Core UI**: `dark.js` (dark mode toggle + localStorage), `lang.js` (i18n management), `nav-menu.js` (mobile hamburger + backdrop), `initTranslations.js` (bootstrap translations on page load)
- **Content**: `board.js` (bulletin board from `data/board.json`), `meteo.js` (OpenWeather API), `calendario.js` (Flatpickr calendar), `countdown.js` (Fallas countdown timer)
- **Galleries**: `swiper.js` (Swiper.js carousel), `galeria_1.js`–`galeria_4.js` (gallery-specific logic), `fullscreen.js` (full-screen image viewing)
- **Utilities**: `acc.js` (accordions), `envia.js` (form submission), `mapa.js` (map interactions), `image-optimizer.js` (responsive loading), `performance-optimizer.js` (lazy loading), `pwa-manager.js` (service worker), `accessibility.js` (WCAG features)

### Key Systems

**Global Styles**: `scss/abstracts/_globales.scss` establishes the base layout. The site background uses a **Overlay Pattern** (`body::before`) to hold the gradient. This allows smooth opacity transitions to black in Dark Mode. See `docs/global-styles.md`.

**Multi-Language (i18n)**: `data/translations.json` contains Spanish (es) and Valenciano (va). Elements use `data-i18n` attributes, managed by `js/lang.js`.

**Dark Mode**: CSS custom properties for theming, localStorage persistence, Safari scrollbar compatibility.
- **Body**: Background gradient is set on `body::before` to allow smooth cross-fade to black.
- **Header**: Uses `::before` pseudo-element for gradient background transitions.
- **Section Backgrounds**: Components like `.falla` separate the background image (on element) from color overlay (on `::before`) to animate overlay color.
- **Gradient-to-Solid Transitions**: Components with gradients (`.quieres-mas`, `.countdown__contenedor`) use `::before` pseudo-element with `opacity` transition. CSS cannot animate between `linear-gradient` and solid color directly. See `docs/global-styles.md`.

**Gulp Pipeline**: Watches src files, compiles SCSS with sourcemaps, optimizes images to WebP/AVIF, copies to dist/.

**Open Graph (WhatsApp/Social)**: Image `img/og-share.png` (1200×630, <300KB, blue background #0a4b8d) with cache-buster `?v=YYYYMMDD`. Generated from `img/Escudo_falla.avif`. See `docs/open-graph-whatsapp.md`.

### Data Flow Patterns

**Translation flow**: HTML `data-i18n` attributes → `js/initTranslations.js` loads `data/translations.json` → `js/lang.js` applies text and persists language choice to localStorage.

**Bulletin board flow**: `eventos.html` `#notesBoard` container → `js/board.js` fetches `data/board.json` → renders notes with DOMPurify sanitization.

**Weather flow**: `meteo.html` → `js/meteo.js` reads API key from `data/config.json` → calls OpenWeather API → renders current + 5-day forecast with animated icon.

**Dark mode flow**: `js/dark.js` reads localStorage → applies `.modo-oscuro`/`.modo-claro` classes → CSS variables + `::before` opacity transitions handle gradient-to-solid changes.

**Build flow**: Source files → `npm run build` (Gulp tasks) → `dist/` → Playwright tests serve `dist/` on port 4173.

## Key SCSS Variables

Located in `scss/abstracts/_variables.scss`:

| Variable | Value | Usage |
|----------|-------|-------|
| `$primary-color` | `#FF6F61` | Coral - Brand color |
| `$turquesa` | `#00909E` | Secondary accent |
| `$color-azul-falla` | `#004BCF` | Institutional blue |
| `$dorado` | `#FFD700` | Gold accents |
| `$secondary-color` | `#333` | Main text |

## Responsive Breakpoints

- **Mobile**: `max-width: 767px`
- **Desktop**: `min-width: 768px`

Used consistently in CSS (`@media`) and JS (`matchMedia`).

## Common Patterns

### Adding a translation
1. Add key to `data/translations.json` under both `es` and `va`
2. Use in HTML: `<span data-i18n="section.subsection.key"></span>`
3. Run `npm run build` to copy to dist/

### Adding a new page
1. Create HTML file in root directory
2. Add URL to `sitemap.xml` and `sitemap-index.xml`
3. Run `npm run build`

### Modifying styles
1. Edit SCSS in `scss/` (never edit `dist/css/`)
2. Run `npm run build` or `npx gulp css`
3. Run `npm run test:e2e` to validate

### Adding a PDF with favicon and social preview
PDFs linked directly don't show favicon or social previews. Use HTML wrappers:
1. Create HTML wrapper in `pdf/[folder]/[name].html` (see existing wrappers as template)
2. Include: favicon links, Open Graph tags, Twitter Card tags, Safari link preview
3. Embed PDF with `<object>` tag and fallback download button
4. Link to `.html` wrapper instead of `.pdf` in pages

Existing wrappers:
- `pdf/Llibrets/Llibret_2024-25.html`
- `pdf/Llibrets/Llibret_2025-26.html`
- `pdf/Presentaciones/Presentacion_Fallera_2026.html`

### Updating Open Graph image (WhatsApp preview)
1. Run `npm run generate:og` to regenerate `img/og-share.png`
2. Update cache-buster `?v=YYYYMMDD` in ALL HTML files (og:image, twitter:image, image_src)
3. Run `npm run build`
4. Run `npm run test:e2e` (validates image size and cache-buster presence)

## Testing Workflow

Run `npm run test:e2e` after changes to:
- **SCSS** - Validates CSS output, scrollbar theme, guardrails
- **Navbar/header** - Validates mobile layout, transitions, backgrounds
- **Translations** - Validates i18n persistence across pages
- **Swiper** - Validates carousel behavior
- **Open Graph** - Validates og-share.png (size, dimensions) and cache-buster in HTML

## Code Style

- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:, refactor:)

## Documentation

Technical docs in `/docs/`:
- `build-and-deploy.md` - Build process and deployment
- `e2e-testing.md` - Playwright testing (33 test files)
- `open-graph-whatsapp.md` - Open Graph image, WhatsApp cache-buster, social previews
- `navigation-bar.md` - Header/mobile nav implementation
- `i18n-translations.md` - Language system
- `swiper-monumento.md` - Carousel details
- `scrollbar-theme.md` - Scrollbar theming and Safari compatibility
- `global-styles.md` - Background gradient, overlay pattern, dark mode transitions
- `robots-configuration.md` - robots.txt configuration
- `google-search-console.md` - Google Search Console verification

## Run Single Test

```bash
# Run a specific test file
npx playwright test tests/nav.e2e.spec.js

# Run tests matching a pattern
npx playwright test -g "mobile"

# Run with headed browser (visible)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```
