# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WEBFALLASUISSA is the official website for Falla Suïssa - L'Alqueria del Favero (#396), a traditional Valencian falla commission. The site manages events, galleries, weather integration, and supports Spanish/Valenciano languages.

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
```

## Architecture

### Tech Stack
- **Build**: Gulp 5 with Dart Sass, PostCSS (autoprefixer), CSSNano, Sharp for images
- **Frontend**: HTML5, SCSS (BEM methodology), ES6+ JavaScript modules
- **Libraries**: Swiper.js (carousels), Flatpickr (dates), DOMPurify
- **Testing**: Playwright for E2E tests

### Directory Structure
- `scss/` - Modular SCSS: abstracts/, base/, layout/, components/, animaciones/, optimization/, sociales/
- `js/` - 21 modules: dark.js (theme), lang.js (i18n), calendario.js, meteo.js, galeria_[1-4].js, nav-menu.js, swiper.js, pwa-manager.js, etc.
- `data/` - JSON files: translations.json, eventos.json, calendarData.json, fallas.json, config.json, dataPages[1-4].json
- `dist/` - Production build output
- `tests/` - Playwright E2E tests (9 suites)
- `docs/` - Technical documentation (Markdown)
- `seo/` - AI/SEO optimization files (sitemaps, schema, robots variants)

### Key Systems

**Multi-Language (i18n)**: `data/translations.json` contains Spanish (es) and Valenciano (va). Elements use `data-i18n` attributes, managed by `js/lang.js`.

**Dark Mode**: CSS custom properties for theming, localStorage persistence, Safari scrollbar compatibility. See `docs/scrollbar-theme.md`.

**Gulp Pipeline**: Watches src files, compiles SCSS with sourcemaps, optimizes images to WebP/AVIF, copies to dist/.

## Code Style

- Comments are written in Spanish
- CSS follows BEM methodology (Block__Element--Modifier)
- Git commits use Conventional Commits (feat:, fix:, docs:, style:)

## Documentation

Technical docs in `/docs/`:
- `build-and-deploy.md` - Build process and deployment
- `e2e-testing.md` - Playwright testing (9 test suites)
- `navigation-bar.md` - Header/mobile nav implementation
- `i18n-translations.md` - Language system
- `swiper-monumento.md` - Carousel details
- `scrollbar-theme.md` - Scrollbar theming and Safari compatibility
- `robots-configuration.md` - robots.txt configuration
- `google-search-console.md` - Google Search Console verification
