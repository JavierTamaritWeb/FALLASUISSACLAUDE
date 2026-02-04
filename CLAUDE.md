# CLAUDE.md

**Version:** 4.2.7
**Last Updated:** 4 de febrero de 2026

This file provides guidance to Claude Code (claude.ai/code) when working with the code in this repository.

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
- **Mobile menu fix (v4.0.0):** The backdrop is inserted inside `.header__barra` (not `body`) to ensure proper z-index stacking context. Menu z-index: 2500, backdrop: 1500, menu button: 2600
- **Gradient transitions (v4.1.0):** `.quieres-mas` and `.countdown__contenedor` use `::before` pseudo-element for gradient. Dark mode fades opacity to 0. Tests: `quieres-mas-transition.e2e.spec.js`, `countdown-transition.e2e.spec.js`
- **Desktop navigation visibility fix (v4.1.1):** Added `position: relative` and `z-index: 5` to `.navegacion` (desktop >768px) to raise text above the glassmorphism background overlay.
- **Dynamic Bulletin Board (v4.1.2):** The "Tablón de Anuncios" in `eventos.html` is dynamically populated from `data/board.json` via `js/board.js`. See `docs/gestion-tablon.md`.
- **Weather Icon Animation (v4.1.2):** The main weather icon (`#current-icon-img`) uses a composite animation (`weatherIconFade` + `weatherIconSway`). The sway is horizontal (`translateX`) and smooth. Width is set to `20rem` on screens >1200px. See `docs/meteo-ui.md`.
- **Frieze Background (v4.1.3):** The decorative frieze now uses `$blanco-hueso` background instead of transparent. Defined in `scss/abstracts/_variables.scss`. See `docs/global-styles.md`.
- **Dark Mode Notification Fix (v4.2.7):** Removed duplicate animation rule for `.header__notificacion:not(:empty)` in `_accessibility.scss` that conflicted with `#notificacion.mostrar` animation in `_notificaciones.scss`. The conflict caused a "ghost notification" to briefly appear after the main notification faded out.

## Build Commands

```bash
# Development (build + watch for changes)
npm run dev

# Production build (outputs to dist/)
npm run build

# E2E tests
npm run test:e2e:install    # Install Playwright browsers (once)
npm run test:e2e            # Run tests
npm run test:e2e:ui         # Interactive test UI

# Individual Gulp tasks
npx gulp css                # Compile SCSS
npx gulp images             # Optimize images (WebP/AVIF)
npx gulp js                 # Copy JavaScript
npx gulp html               # Process HTML

# Open Graph image
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
- `js/` - Modules: `board.js` (dynamic bulletin), `meteo.js` (weather logic), plus previous modules (dark.js, lang.js, etc.)
- `scripts/` - Node.js utilities: generate-og-image.mjs, serve-dist.mjs
- `data/` - JSON files: `board.json` (bulletin board content), translations.json, eventos.json, calendarData.json, fallas.json, config.json, dataPages[1-4].json
- `dist/` - Production build output (DO NOT edit directly)
- `tests/` - Playwright E2E tests (24 suites)
- `docs/` - Technical documentation (Markdown)
- `seo/` - AI/SEO optimization files (sitemaps, schema, robots variants)
- `pdf/` - PDF files with HTML wrappers for favicon/social preview support

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

- Comments are written in Spanish
- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:, refactor:)

## Documentation

Technical docs in `/docs/`:
- `build-and-deploy.md` - Build process and deployment
- `e2e-testing.md` - Playwright testing (20 test suites)
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
