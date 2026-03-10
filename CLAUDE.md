# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 4.2.16
**Last Updated:** 9 de marzo de 2026

## Project Overview

WEBFALLASUISSA is the official website for Falla Suissa - L'Alqueria del Favero (#396), a traditional Valencian falla commission. Static site with events, galleries, weather integration, and Spanish/Valenciano language support.

- **Production**: https://fallasuissa.es
- **Repository**: https://github.com/xavitamarit74-code/FALLASUISSACLAUDE

## Build Commands

```bash
npm run dev              # Build + watch for changes
npm run build            # Production build (outputs to dist/)
npm run test:e2e         # Run the smoke Playwright E2E suite
npm run test:e2e:full    # Run the complete Playwright E2E suite
npm run test:e2e:visual  # Run visual regression snapshots only
npm run test:e2e:install # Install Playwright browsers (first time)
npm run test:e2e:ui      # Interactive smoke test UI

# Individual Gulp tasks
npx gulp css             # Compile SCSS only
npx gulp images          # Optimize images (WebP/AVIF)
npx gulp js              # Copy JavaScript
npx gulp html            # Process HTML

# Run a specific test
npx playwright test tests/nav.e2e.spec.js
npx playwright test -g "mobile"       # Match by pattern
npx playwright test --headed           # Visible browser
npx playwright test --debug            # Debug mode

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
- **Libraries**: Swiper.js (carousels), Flatpickr (dates), DOMPurify
- **Testing**: Playwright E2E (29 suites in the full matrix, 7 smoke suites by default)

### Directory Structure
- `scss/` - Modular SCSS (imports order in `main.scss`: abstracts > base > optimization > layout > animaciones > components > sociales)
- `js/` - ES6+ modules loaded per page
- `data/` - JSON: `translations.json`, `board.json`, `eventos.json`, `calendarData.json`, `fallas.json`, `config.json`, `dataPages[1-4].json`
- `dist/` - Generated output (DO NOT edit)
- `tests/` - Playwright E2E specs
- `docs/` - Technical docs (Markdown)
- `seo/` - Sitemaps, schema, robots variants
- `pdf/` - PDFs with HTML wrappers for favicon/social preview

### Key Architectural Patterns

**Dark Mode** (`js/dark.js`): Applies `.modo-oscuro`/`.modo-claro` classes. CSS uses `::before` pseudo-elements for gradient-to-solid transitions because CSS cannot animate between `linear-gradient` and solid color directly. Background gradient lives on `body::before` to allow opacity cross-fade to black.

**Multi-Language** (`js/lang.js` + `js/initTranslations.js`): Elements use `data-i18n="section.key"` attributes. Loads `data/translations.json` on page load, persists choice to localStorage.

**Bulletin Board** (`js/board.js`): Fetches `data/board.json`, renders with DOMPurify sanitization on `eventos.html`.

**Collaborations** (`scss/components/_colaboraciones.scss` + `js/colaboraciones-lightbox.js`): Shared HOPE section on `index.html` and `colaboraciones.html`. Uses a traditional responsive grid (2 columns on mobile, 3 from `768px`), `object-fit: contain`, and an accessible lightbox. Tests: `tests/index-colaboraciones.e2e.spec.js`.

**Testing**: Tests serve `dist/` on `http://127.0.0.1:4173`. Playwright config pre-sets `localStorage` key `bannerSubvencionCerrado=true` to hide the banner in tests. Banner runtime also uses `sessionStorage` to remember that it has already been shown in the current tab.

### Version Note
`package.json` version (4.2.0) is out of sync with the actual release version (4.2.16). The CLAUDE.md version reflects the real release state.

## Architecture Decisions & Constraints

These constraints arise from past bugs. Violating them will reintroduce issues:

- **Mobile menu z-index stacking (v4.0.0):** Backdrop is inserted inside `.header__barra` (not `body`). Z-index: menu 2500, backdrop 1500, menu button 2600. Moving backdrop to `body` breaks stacking context.

- **Gradient transitions (v4.1.0):** `.quieres-mas` and `.countdown__contenedor` use `::before` for gradient overlay, dark mode fades opacity to 0. Tests: `quieres-mas-transition.e2e.spec.js`, `countdown-transition.e2e.spec.js`.

- **Desktop navigation z-index (v4.1.1):** `.navegacion` needs `position: relative; z-index: 5` at desktop (>768px) to stay above glassmorphism overlay.

- **Notification animations (v4.2.7):** Only ONE animation rule for notifications. `_notificaciones.scss` owns `#notificacion.mostrar`. Do NOT add competing rule in `_accessibility.scss` for `.header__notificacion:not(:empty)` - causes ghost notification flash.

- **Banner subvencion (v4.2.11-4.2.16):** Multiple constraints apply:
  - **Per-tab + reload only**: `banner-subvencion.js` does NOT persist closure to `localStorage`. The banner shows the first time the page is loaded in a tab, stays hidden on subsequent returns within that same tab, and reappears on full reload. It uses `sessionStorage` only to remember that it has already been shown. The `localStorage.getItem('bannerSubvencionCerrado')` check exists solely for Playwright tests. Do NOT re-add `localStorage.setItem` in `cerrarBanner()`.
  - **Dark mode image**: Uses `filter: invert(1) hue-rotate(180deg)`. Do NOT use `invert(1)` alone - it turns the red Ajuntament crest green. The `hue-rotate(180deg)` restores red tones after inversion.
  - **Safari fix**: Uses `<picture>` with AVIF/WebP/PNG instead of SVG. Safari WebKit bug ([#246106](https://bugs.webkit.org/show_bug.cgi?id=246106)) prevents CSS `filter` from compositing correctly on SVGs with internal filter elements. Do NOT revert to `<img src="subvencion.svg">`. Size: SVG 289KB -> AVIF 25KB (-91%).

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

### Adding a PDF with social preview
Use HTML wrappers (see `pdf/Llibrets/` for examples). Include favicon, Open Graph, Twitter Card tags. Embed PDF with `<object>` and fallback download button. Link to `.html` wrapper instead of `.pdf`.

## Code Style

- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:, refactor:)
- Breakpoints: mobile `max-width: 767px`, desktop `min-width: 768px`
- Key SCSS variables in `scss/abstracts/_variables.scss` (primary: `$primary-color` #FF6F61, institutional blue: `$color-azul-falla` #004BCF)
