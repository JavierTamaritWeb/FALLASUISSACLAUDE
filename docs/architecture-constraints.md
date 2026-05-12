# 🧱 Constraints de Arquitectura

Esta guía resume las restricciones técnicas del repositorio que no deben romperse al tocar navegación, gradientes, reveal on scroll, notificaciones, banner institucional o scroll visual.

Si esta guía y `CLAUDE.md` se contradicen, prevalece `CLAUDE.md`.

## 🎯 Objetivo

Evitar regresiones que ya ocurrieron y que hoy están controladas por combinaciones concretas de CSS, HTML, JS y tests.

## 1. Menú móvil y stacking context

Regla:

El backdrop del menú móvil debe seguir insertándose dentro de `.header__barra`, no en `body`.

Por qué:

Moverlo a `body` rompe el stacking context del header fijo y reintroduce conflictos entre botón hamburguesa, overlay y navegación.

Valores que no deben perderse:

- menú: `z-index: 2500`
- backdrop: `z-index: 1500`
- botón menú: `z-index: 2600`

Archivos implicados:

- `src/js/nav-menu.js`
- `src/scss/layout/` y componentes del header
- [`navigation-bar.md`](./navigation-bar.md)

Verificación recomendada:

```bash
npm run build
npx playwright test tests/nav.e2e.spec.js
```

## 2. Navegación desktop por encima del glassmorphism

Regla:

En desktop, `.navegacion` necesita `position: relative` y `z-index: 5`.

Por qué:

Sin esa capa, la navegación puede quedar por debajo de overlays visuales del header.

Archivos implicados:

- SCSS del header y navegación desktop
- [`navigation-bar.md`](./navigation-bar.md)

Verificación recomendada:

- `tests/nav.e2e.spec.js`
- comprobación manual de desktop si el cambio toca stacking o glassmorphism

## 3. Gradientes con transición real a oscuro

Regla:

`.quieres-mas` y `.countdown__contenedor` usan pseudo-elementos `::before` para el gradiente. No se debe sustituir ese patrón por cambios directos de `background` entre gradiente y sólido.

Por qué:

CSS no anima bien una transición entre `linear-gradient(...)` y un color sólido. El patrón actual usa opacidad sobre un pseudo-elemento para evitar parpadeos y cortes bruscos.

Archivos implicados:

- `src/scss/` de los bloques afectados
- [`global-styles.md`](./global-styles.md)

Verificación recomendada:

```bash
npm run build
npx playwright test tests/quieres-mas-transition.e2e.spec.js
npx playwright test tests/countdown-transition.e2e.spec.js
```

## 4. Reveal on Scroll: opt-in, exclusiones y refresco

Regla:

El reveal on scroll debe seguir siendo **opt-in** mediante `.reveal`. No se debe convertir en un selector global agresivo que afecte a todo el layout.

Qué debe quedar fuera:

- `header`, navegación fija y footer
- modales, backdrops, lightboxes y overlays
- internals de Swiper
- `#map` y sus capas internas
- `.forecast-day`, porque `src/js/meteo.js` ya anima esas tarjetas

Contenido dinámico:

Si un bloque se re-renderiza por JavaScript tras la carga inicial, hay que llamar a `window.scrollReveal.refresh(root)`.

Casos ya cubiertos:

- `src/js/board.js`
- `src/js/calendario.js`

Accesibilidad:

Con `prefers-reduced-motion: reduce`, el sistema no puede dejar contenido oculto esperando al observer.

Archivos implicados:

- `src/js/scroll-reveal.js`
- `src/scss/animaciones/_reveal.scss`
- `src/js/board.js`
- `src/js/calendario.js`
- HTML de las páginas que usan `.reveal`

Verificación recomendada:

```bash
npm run build
npx playwright test tests/reveal-on-scroll.e2e.spec.js
npx playwright test tests/visual-regression.e2e.spec.js --workers=1
```

Si además tocas tema, layout compartido o snapshots, ejecuta `npm run test:e2e:full`.

## 5. Animación de notificaciones: una sola fuente

Regla:

La regla de animación para `#notificacion.mostrar` debe vivir solo en `_notificaciones.scss`.

Por qué:

Añadir otra regla competidora en `_accessibility.scss` o en otro archivo reintroduce flashes fantasma y estados inconsistentes.

Archivos implicados:

- `src/scss/components/_notificaciones.scss`
- posibles overrides de accesibilidad o layout del header

Verificación recomendada:

- revisión manual del panel de notificación en home y páginas internas
- smoke suite si el cambio afecta al header

## 6. Banner de subvención: persistencia y renderizado

Persistencia:

Regla:

- el cierre del banner no debe persistirse en `localStorage`
- el comportamiento funcional muestra el banner en cada carga de `index.html`
- `localStorage.bannerSubvencionCerrado` queda reservado para Playwright
- cualquier cookie legado de sesión debe ignorarse y no puede gobernar la visibilidad

Por qué:

- el banner debe mostrarse siempre al abrir o recargar la home
- debe reaparecer al volver a `index.html` desde otra página o al abrir una pestaña nueva de la home
- la suite general de Playwright debe seguir pudiendo ocultarlo mediante `localStorage.bannerSubvencionCerrado`

Renderizado:

Regla:

- mantenerlo como tarjeta flotante no modal
- no volver a un overlay fullscreen que bloquee la página

Por qué:

- el contenido institucional sigue visible, pero reduce fricción y no interrumpe la navegación principal
- el cierre manual es más predecible que un modal intrusivo o un auto-dismiss agresivo

Accesibilidad del cierre:

Regla:

- el estado oculto debe combinar `inert` y `aria-hidden="true"`
- antes de ocultar el banner, hay que sacar el foco del botón de cierre si sigue dentro del contenedor

Por qué:

- aplicar `aria-hidden` sobre un ancestro que todavía contiene el foco dispara una advertencia de accesibilidad en Chromium
- `inert` evita que el banner oculto siga siendo focuseable o interactivo mientras termina su transición y antes de ser eliminado del DOM

Interacción móvil y stacking:

Regla:

- el botón de cierre debe conservar un área táctil real mínima de `44x44`
- aplicar `touch-action: manipulation`
- mantener su `z-index` por encima de la cabecera fija y de las capas visuales internas del banner

Por qué:

- en móvil, el header fijo y la capa gráfica del banner pueden interceptar el click si el botón queda demasiado justo o por detrás de otra capa
- el test E2E valida el hit target real, no solo que el icono sea visible en pantalla

Renderizado y compatibilidad Safari:

Regla:

- mantener `<picture>` con variantes AVIF/WebP/PNG
- no volver a un SVG filtrado directamente

Por qué:

- Safari/WebKit tiene problemas de composición con SVGs que incluyen ciertos filtros internos

Modo oscuro:

Regla:

- mantener `filter: invert(1) hue-rotate(180deg)` en la imagen institucional

Por qué:

- `invert(1)` a secas altera el escudo y rompe los tonos rojos

Archivos implicados:

- `src/js/banner-subvencion.js`
- HTML de la home
- estilos del banner

Verificación recomendada:

```bash
npm run build
npx playwright test tests/banner-subvencion.e2e.spec.js
```

Ayudas de depuración manual:

- `index.html?resetBanner=1` para limpiar estado legado antes de cargar la home
- `index.html?forzarBanner=1` para elevar el banner y confirmar si el problema es visual o de stacking

Si además tocas navegación, tema o snapshots, ejecuta `npm run test:e2e:full`.

## 7. Modal "Quieres formar parte": DOM estable y dependencia externa opcional

Regla:

- el modal ya vive en `index.html` y debe abrirse desde ese DOM
- no depender de `fetch('modal-content.html')` ni de fragmentos remotos para mostrarlo
- registrar listeners tras `DOMContentLoaded`
- `emailjs` debe detectarse en tiempo de ejecución; no llamar `emailjs.init(...)` en top-level

Por qué:

- `modal-content.html` no forma parte del proyecto y la apertura no puede quedar bloqueada por red
- un fallo de la CDN de EmailJS no debe impedir abrir o cerrar el modal ni registrar sus handlers
- la degradación correcta es: UI funcional y error controlado al enviar si la dependencia externa no está disponible

Archivos implicados:

- `index.html`
- `src/js/envia.js`
- `tests/modal-transition.e2e.spec.js`
- `tests/modal-dark-to-light.e2e.spec.js`
- `tests/modal-quieres-elements.e2e.spec.js`

Verificación recomendada:

```bash
npm run build
npx playwright test tests/modal-transition.e2e.spec.js tests/modal-dark-to-light.e2e.spec.js tests/modal-quieres-elements.e2e.spec.js
```

## 8. Swiper del monumento: hook temporal de la foto real

Regla:

- `swiper-slide--monumento-real` no es una convención general del componente
- el selector `:has(.swiper-slide-active.swiper-slide--monumento-real)` es un ajuste temporal ligado a la foto real principal de 2026
- no debe eliminarse ni reutilizarse sin revisar antes la proporción y el comportamiento de la imagen real activa

Por qué:

- la geometría general del visor usa `padding-inline: 3.5rem` para proteger imagen y botones
- la foto real principal de 2026 necesitó verse algo más grande en `>= 768px`
- un primer intento de reducir padding de forma fija provocó solape del botón previo en tablet y desktop
- la solución estable solo activa el ajuste cuando esa slide es la activa, moviendo además los botones y ampliando el `max-width` en desktop

Qué hacer cuando cambien las imágenes del próximo ejercicio:

- revisar primero si la nueva foto real sigue necesitando ese hook
- si no lo necesita, eliminar la clase en `index.html` y `lafalla.html`
- retirar también las reglas específicas del SCSS y mantener el visor con su geometría general
- actualizar el test del Swiper y la documentación asociada

Archivos implicados:

- `index.html`
- `lafalla.html`
- `src/scss/animaciones/_swiper.scss`
- `tests/monumento-swiper.e2e.spec.js`
- [`swiper-monumento.md`](./swiper-monumento.md)
- [`monumento-rotacion-anual.md`](./monumento-rotacion-anual.md)

Verificación recomendada:

```bash
npm run build
npx playwright test tests/monumento-swiper.e2e.spec.js
npm run test:e2e
```

## 9. Blog estático: stacking de imágenes sobre gradiente

Desde v4.6.0+ el blog usa páginas estáticas individuales (`blog-somni.html`, `blog-anima.html`) en lugar de una plantilla dinámica. Las restricciones de CSS siguen vigentes.

Regla:

`.blog-detail__figure` debe usar `z-index: 2` y centrado con `margin: auto` + `max-width: 48rem`. NO usar flexbox en el figure — causa problemas de sizing con `<picture>`.

Por qué:

`.blog-detail__article` usa el patrón `::before` con gradiente azul (z-index: 0). Los hijos directos reciben `z-index: 1` vía `> *`. El figure necesita `z-index: 2` explícito para garantizar que la imagen quede por encima del gradiente sin tinte azul. Flexbox en el figure encoge `<picture>` a su tamaño intrínseco, rompiendo el layout.

Carga prioritaria y estado `loaded`:

Regla:

- si la imagen principal del artículo queda visible sin scroll, usar `loading="eager"` y `fetchpriority="high"`
- los scripts que gestionan `.lazy-image` deben marcar como `loaded` también las imágenes que ya estén completas al registrar listeners

Por qué:

- si el esqueleto de carga sigue activo en una imagen ya resuelta, reaparece el tinte azul aunque el stacking sea correcto
- la combinación HTML + JS evita falsos estados de carga tanto en red lenta como desde caché

Archivos implicados:

- `blog-somni.html`, `blog-anima.html` (páginas estáticas)
- `src/scss/components/_blog.scss`
- `src/scss/animaciones/_modo-oscuro.scss`
- `src/scss/components/_image-optimization.scss`
- `src/js/image-optimizer.js`
- `src/js/accessibility.js`

Verificación recomendada:

Comprobación visual en `dist/blog-anima.html`: la imagen debe verse sin tinte azul y centrada.

## 10. SEO multi-idioma — `gulpfile.js` como única fuente de canonical/hreflang (v4.6.22)

Regla:

- `<link rel="canonical">` y `<link rel="alternate" hreflang=...>` los inyecta exclusivamente `gulpfile.js` (`modifyHtmlStream`). No se mantienen a mano en los HTML del root.
- En cada build se eliminan del source **todos** los `canonical` y `hreflang` preexistentes y se reinyectan con el bloque correcto.
- El `canonical` debe ser **autoreferencial** (cada URL apunta a sí misma): la ES a `https://fallasuissa.es/<file>` y la VA a `https://fallasuissa.es/va/<file>`. NUNCA hagas que `/va/X.html` declare canonical hacia `/X.html`.
- No usar URLs `?lang=ca` ni `?lang=es` como destino de hreflang (no son páginas crawlables).
- `sitemap.xml` mantiene 48 entradas (24 ES + 24 VA) con bloques `<xhtml:link rel="alternate">` por entrada. Al añadir una página nueva, añade SUS DOS entradas (ES y VA) con los 3 alternates.

Por qué:

- En v4.6.22 se resolvió el aviso de GSC "Duplicada: el usuario no ha indicado ninguna versión canónica". La causa era canonical y hreflang en conflicto entre ES y VA: cuando se contradicen, Google ignora el hreflang y consolida las dos URLs como duplicadas.

Archivos implicados:

- `gulpfile.js → modifyHtmlStream`
- `sitemap.xml`
- [`google-search-console.md`](./google-search-console.md)

Verificación recomendada:

```bash
npm run build
grep -H "rel=\"canonical\"" dist/index.html dist/va/index.html
# Debe haber exactamente 1 por archivo, autoreferencial.
```

## 11. Pre-render i18n VA en build (v4.6.23)

Regla:

1. **Los atributos `data-i18n*` deben PERMANECER en el HTML servido**: no eliminarlos del source ni filtrarlos en el build. Son la única forma de que el toggle a ES funcione client-side sin recargar.
2. **No tocar `src/data/translations.json`** esperando que el HTML cambie sin rebuild: el pre-render genera el HTML en build time. Tras editar el JSON: `npm run build`.
3. **Para añadir un nuevo atributo i18n** (p. ej. `data-i18n-aria-describedby`): hay que actualizar a la vez `prerenderTranslations` en `gulpfile.js` (array `attrMappings`) y la tabla de selectores en `src/js/lang.js → updateTranslations()`. Ambos deben procesar el mismo set, o el toggle runtime y el build se desincronizarán.
4. **Claves faltantes en VA**: el build NO se rompe; el HTML conserva el texto fuente como fallback y emite `[i18n-prerender] missing key: <clave> @ <archivo>`.
5. **`data-i18n-dynamic`** (meteo): el pre-render lo skipea. NO añadir contenido pre-renderizado a estos elementos — los rellena `src/js/meteo.js` en runtime.
6. **`data-i18n-format="paragraphs"`**: el pre-render genera `<p>` por bloque dividido por `\n+`, replicando exactamente `renderParagraphTranslation` de `lang.js`. Mantener simetría si se modifica uno de los dos.
7. **Solo VA pre-renderiza, ES no**: ES queda byte-idéntico al source. Si en el futuro se quisiera pre-renderizar también ES (drift detection), añadir flag opt-in `PRERENDER_ES=1`.
8. **Kill switch**: `DISABLE_I18N_PRERENDER=1 npm run build` desactiva el pre-render sin revertir el commit.

Por qué:

- El objetivo SEO es que `dist/va/*.html` divirja en contenido del ES, no solo en `<html lang>`. Sin pre-render, Google ve el HTML pre-JS en español en ambas URLs y trata `/va/` como duplicado.
- El toggle ES/VA en runtime sigue siendo necesario para usuarios que llegan a `/X.html` con preferencia VA en localStorage o que pulsan el botón de idioma sin recargar.

Archivos implicados:

- `gulpfile.js → prerenderTranslations()`
- `src/js/lang.js → updateTranslations()`
- `src/data/translations.json`
- `tests/i18n-prerender.e2e.spec.js`
- [`i18n-translations.md`](./i18n-translations.md)

Verificación recomendada:

```bash
npm run build
grep -o 'data-i18n="nav.inicio"[^>]*>[^<]*' dist/va/index.html   # Debe contener "Inici"
grep -o 'data-i18n="nav.inicio"[^>]*>[^<]*' dist/index.html      # Debe contener "Inicio"
npm run test:e2e   # tests/i18n-prerender.e2e.spec.js está en el smoke
```

## 12. Qué hacer antes de tocar una zona sensible

Checklist rápido:

1. Localiza si la zona está nombrada en esta guía o en `CLAUDE.md`.
2. Comprueba qué tests la cubren.
3. Haz el cambio mínimo posible.
4. Regenera `dist/` con `npm run build`.
5. Ejecuta al menos el spec focalizado; usa la full suite cuando toque tema, navegación, gradientes, OG o meteo.

## 🔗 Relacionado

- [`navigation-bar.md`](./navigation-bar.md)
- [`global-styles.md`](./global-styles.md)
- [`scrollbar-theme.md`](./scrollbar-theme.md)
- [`e2e-testing.md`](./e2e-testing.md)
- [`swiper-monumento.md`](./swiper-monumento.md)
- [`monumento-rotacion-anual.md`](./monumento-rotacion-anual.md)
- [`i18n-translations.md`](./i18n-translations.md)
- [`google-search-console.md`](./google-search-console.md)
- [`../CLAUDE.md`](../CLAUDE.md)

---

Última actualización: 7 de mayo de 2026 - v4.6.23
