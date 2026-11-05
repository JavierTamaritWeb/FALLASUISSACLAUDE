# Plan: retirar las páginas legales y los banners (sin rastro)

**Estado:** pendiente; no implementar hasta que el usuario lo confirme. **Redactado:** 5-nov-2026 sobre la versión 4.44.6.

## Qué se retira
1. Los tres enlaces del pie `nav.footer__legal` (Aviso Legal · Privacidad · Cookies) en las 31 páginas.
2. Las tres páginas y sus variantes `/va/`: `src/aviso-legal.html`, `src/privacidad.html`, `src/cookies.html`.
3. El **banner de cookies** (`src/js/cookie-banner.js`, `_cookie-banner.scss`, clave `cookieConsent`).
4. El **banner de subvención** de la home (`src/js/banner-subvencion.js`, `_banner-subvencion.scss`, `src/img/subvenciones/`, cookie `bannerSubvencionSesion` y clave `bannerSubvencionCerrado`).
5. Todo lo asociado: estilos, traducciones, buscador, JSON-LD, sitemaps, `llms.txt`, redirecciones, pruebas y documentación.

## Antes de empezar: decisiones del usuario
- **Riesgo legal.** La web recoge datos en el formulario de contacto (EmailJS) y en las autorizaciones de imagen. El RGPD (art. 13) exige informar del tratamiento allí donde se recogen datos, y la LSSI (art. 10) exige identificar al titular. El plan propone mantener esa información mínima de forma incrustada (ver 4b), salvo que el usuario decida otra cosa.
- **El banner de cookies** puede retirarse sin problema si la web solo usa almacenamiento técnico: idioma, tema, consulta del buscador y, tras este cambio, ya ninguna clave de banners. No hay analítica ni publicidad; queda revisar las CDN.
- **Licencia de imágenes en JSON-LD:** `license`/`acquireLicensePage` apuntan hoy a `aviso-legal.html#propiedad-intelectual`. Hay que elegir un destino nuevo (una sección de `lafalla.html` o la home) o dejar de emitirlos. Search Console los pedía en *Metadatos de imagen* (v4.31.1), así que **conviene un destino**.
- **Casilla de consentimiento del formulario de contacto** (`index.html`, `quieres.privacidad*`): enlaza a `privacidad.html`. Hay dos opciones: quitar el enlace y dejar el texto informativo, o quitar la casilla.

## Pasos

### 1. HTML (31 páginas + autorizaciones)
- Borrar el bloque `<nav class="footer__legal">…</nav>` de todos los `src/*.html` (incluidos `base.html`, `autorizacion-imagen*.html` y las galerías 1-11).
- Borrar `<script src="js/cookie-banner.js" defer>` donde exista.
- `index.html`: borrar el `<div id="banner-subvencion">` completo, su `<picture>` y `<script src="js/banner-subvencion.js">`; quitar el `preload`/`fetchpriority` de su imagen si lo hay; ajustar la casilla del formulario según la decisión.
- Revisar en `autorizacion-imagen*.html` los textos que citan la política de privacidad.
- `git rm src/aviso-legal.html src/privacidad.html src/cookies.html`.

### 2. JS
- `git rm src/js/cookie-banner.js src/js/banner-subvencion.js`.
- `src/js/home-deferred.js`: quitar `loadAfterPaint([root + 'js/cookie-banner.js'])`.
- `src/js/lang.js`: el comentario que cita `cookie-banner.js` pasa a citar el patrón genérico del `try/catch`.

### 3. SCSS
- `git rm` de `components/_cookie-banner.scss`, `_banner-subvencion.scss` y `_contenido-legal.scss`, y sus `@forward`/`@use` en `components/_index.scss`.
- `layout/_footer.scss`: borrar `.footer__legal`. La franja coral `.derechos` sigue, pero sin el padding inferior que repartía con `.footer__legal`.
- `themes/_modo-oscuro.scss`: borrar los bloques oscuros del banner de cookies, del de subvención (filtro `invert + hue-rotate`) y de las páginas legales.
- `base/_reset.scss`: quitar `#banner-subvencion` del comentario de `:target`.
- `tests/fixtures/scss-baseline.json`: reducir con `npm run lint:scss:baseline`. La baseline solo puede bajar.

### 4. Traducciones, contenido y datos
- `src/data/translations.json` (ES, VA, EN y FR donde existan): quitar `legal.*`, `cookieBanner.*`, `seo.aviso-legal`, `seo.privacidad`, `seo.cookies`, los textos de las tres páginas (`text*`, `privacidadTitle`, `cookiesTitle`…), `buscador.registros.subvencion.*`, el `alt` del banner y, según la decisión, `quieres.privacidad*`.
- **4b (si el usuario quiere conservar lo mínimo):** una frase informativa en el pie (responsable, finalidad y contacto para ejercer derechos), con `data-i18n` en ES y VA.
- `src/data/search-keywords.json`: quitar `sec:subvencion` y las entradas `page:aviso-legal`, `page:privacidad` y `page:cookies`.
- `src/img/subvenciones/subvencion-2026.png` y `src/img/elementos-UXUI/subvencion.svg`: `git rm`. Las fuentes se borran; el build deja de generar AVIF/WebP.

### 5. Build y SEO
- `gulpfile.js`:
  - `SEARCH_PRIO`/tipos de página: quitar las tres entradas `'legal'` (línea ~1151).
  - `SEARCH_SECTIONS`: quitar `sec:subvencion` (~1183).
  - `IMAGE_LICENSE_PAGE` (~549): apuntar al destino decidido o eliminar `license`/`acquireLicensePage` de `completeImageObjects`. En ese caso, ajustar `scripts/schema-report.mjs` (deja de exigirlos) y `tests/schema-jsonld` (~186).
  - Las breadcrumbs y los tipos de nodo legales desaparecen solos al no existir las páginas.
- Sitemaps, `llms-full.txt` y el índice del buscador se regeneran solos. Comprobar en `dist/` que no queda ninguna URL legal.
- `src/data/seo-history.json`: el build elimina las URL desaparecidas. Verificarlo y confirmar el fichero.
- `src/llms.txt`: quitar las tres líneas legales (50-52).
- `src/.htaccess`:
  - Responder **410 Gone** a `/(va/)?(aviso-legal|privacidad|cookies)\.html` y a `/img/subvenciones/*`, para que Google las retire del índice en vez de tratarlas como un 404 temporal.
  - Borrar la regla I (301 de `/img/subvencion.*`) y sustituirla por un 410.
  - Quitar `subvencion\.svg` de la regla F.
- Después del deploy: el `rsync --delete` borra los ficheros de `dist/`. Enviar las URL retiradas a IndexNow (`npm run seo:indexnow -- --urls …`) y pedir su retirada en Google Search Console (*Retirada de URL*), según `docs/google-search-console.md`.

### 6. Pruebas
- Borrar: `tests/cookie-banner.e2e.spec.js`, `tests/banner-subvencion.e2e.spec.js`, `tests/banner-subvencion-breakpoints.e2e.spec.js` (y quitarlas de `playwright.smoke.config.js`).
- Limpiar las claves de preparación: `playwright.config.js` (`storageState` con `bannerSubvencionCerrado`), `tests/helpers/deterministic-env.js`, y los `cookieConsent`/`bannerSubvencionCerrado` de `buscador`, `accordion-hover`, `desbordamiento-horizontal` y `color-tokens`.
- Ajustar:
  - `seo-regressions`: las líneas 41-53 comprueban el banner sin JS.
  - `schema-jsonld`: la línea 254 recorre las páginas legales.
  - `auditoria-scss`: tamaño de `.footer__legal` y páginas legales en impresión.
  - `visual-regression`: quitar `aviso-legal` y regenerar los baselines; el pie y la home cambian.
  - `scripts/search-eval.mjs`: quitar las consultas «avís legal», «privacidad» y «subvención».
- Guardia nueva en `html-integrity` o `seo-regressions`: ningún `dist/**/*.html`, sitemap, `llms*.txt`, `search-index.json` ni JSON-LD contiene `aviso-legal`, `privacidad.html`, `cookies.html`, `banner-subvencion`, `cookie-banner` ni `subvencion-2026`.

### 7. Documentación
- `CLAUDE.md`:
  - Quitar los patrones *Páginas legales* y *Banner de cookies*, y las restricciones *Banner subvención* y *Fixes de Safari del banner de cookies*.
  - Retirar las menciones en *Estructura de directorios* (`src/img/subvenciones/`), *Testing*, *Reglas* y en el patrón JSON-LD (licencia de imágenes).
  - Añadir una entrada de changelog.
- `docs/global-styles.md` (secciones del banner), `docs/architecture-constraints.md`, `docs/e2e-testing.md`, `docs/structured-data.md`, `docs/buscador.md`, `docs/paleta-y-degradados.md`, `docs/build-and-deploy.md`, `docs/google-search-console.md`, `README.md` y `AGENTS.md`.
- Los registros históricos de auditoría (`docs/auditorias/…`, `auditoria-*.md`) **no se tocan**: son el historial.
- Memoria: actualizar las entradas del banner de subvención (v4.2.11-4.44.3).

### 8. Release
Versión menor nueva (retira funcionalidad): `package.json`, `package-lock.json`, `CLAUDE.md` y `src/sw.js` en lockstep. Commit `feat!:` o `refactor:` según el alcance final. Deploy solo si el usuario lo pide.

## Verificación
1. `npm run build` dos veces: `seo-history.json` estable tras la segunda.
2. `grep -rEl "aviso-legal|privacidad\.html|cookies\.html|banner-subvencion|cookie-banner|subvencion-2026|cookieConsent|bannerSubvencion" src dist tests scripts gulpfile.js` → solo lo intencional (p. ej. el 410 del `.htaccess`).
3. `npm run lint:scss`, `npm run test:unit` (incluye `search:eval`), `npm run seo:schema-report`, `npm run test:e2e` y `npm run test:e2e:visual` (regenerar los baselines tras revisar los diffs).
4. Navegador: la home sin banner al cargar, el pie sin enlaces legales en claro y oscuro, sin errores de consola en las 31 páginas ES y VA, y el formulario de contacto funcionando.
5. Con el servidor de pruebas Apache (`tests/unit/seo-http.test.cjs`): las URL legales devuelven 410.
