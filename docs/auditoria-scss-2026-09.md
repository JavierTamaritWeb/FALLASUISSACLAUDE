# Auditoría severa del SCSS (septiembre de 2026)

Registro de la auditoría del 15-sep-2026 sobre `src/scss/**` (57 ficheros, 13.772 líneas; `dist/css/main.css` 205,8 KB / 34,7 KB gz, 1.829 reglas). Cada hallazgo lleva su causa, la corrección aplicada y la **guardia** que impide que vuelva a aparecer. Las guardias viven en `tests/scss-guardrails.e2e.spec.js` (smoke), en `tests/unit/build.test.cjs`, en `.stylelintrc.json` (`npm run lint:scss`) y en las baselines de `tests/fixtures/`.

Plan y decisiones: `CLAUDE.md` → *Auditoría SCSS sep-2026*. Releases: 4.39.0 (tooling y guardias), 4.39.1 (errores visibles y accesibilidad), 4.39.2 (duplicados, cascada, `#id` y troceado de `_falla`/`_header`), 4.39.3 (CSS muerto, `!important`, escala de `z-index`, convenciones).

## Método

1. Tres barridos de solo lectura (duplicados y CSS muerto · tooling y avisos del compilador · modo oscuro, especificidad y CSS compilado) con `grep`, extracción de clases de `main.css` y cruce con `src/*.html`, `src/js/*.js`, `src/data/*.json` y `gulpfile.js`.
2. Toda corrección que cambia el orden o la especificidad se verifica con la **comparación de estilos computados** (harness Playwright: 15 páginas × claro/oscuro × 390/1280 px, acordeones abiertos, transiciones desactivadas, 17 propiedades por elemento más `::before`/`::after`) antes y después. Diferencia = error corregido y documentado, o regresión que se arregla.
3. Un commit por bloque, con su guardia en el mismo commit.

Estados: `pendiente` · `hecho (x.y.z)` · `deuda` (no se corrige; motivo en la tabla).

## 1. Errores visibles y de accesibilidad

| # | Hallazgo | Dónde | Causa | Corrección | Guardia | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Texto de la previsión meteo ilegible en oscuro: `.forecast-info p` computa `#333` sobre fondo oscuro | `components/_meteo.scss:349,430,470,541,592` | El color se fija en 5 media queries (una con `!important`) y el tema solo cubre el contenedor `.forecast-info` | Una sola regla clara bajo `body:not(.modo-oscuro)`; `$blanco-hueso` en oscuro | `color-tokens` (en oscuro ningún `.forecast-info p` computa `rgb(51,51,51)`) | pendiente |
| 1.2 | Las transiciones del cambio de tema ignoran `prefers-reduced-motion` | `themes/_modo-oscuro.scss:173-234` (`body.transicion-a-claro`, `transition: … 2.4s !important`) | El shorthand con `!important` gana a la regla global de `_accessibility.scss:40` por orden (`themes/` carga el último desde 4.38.2) | Sin `!important` y dentro de `@media (prefers-reduced-motion: no-preference)` | Test de navegador con `emulateMedia({ reducedMotion: 'reduce' })` | pendiente |
| 1.3 | `backdrop-filter` sin `-webkit-` (Safari ≤ 17) | `_deportes.scss:111`, `_falla.scss:900`, `_colaboraciones.scss:303` | No hay `browserslist`; autoprefixer corre con sus valores por defecto | `browserslist` en `package.json` (`defaults`, `iOS >= 15`, `Safari >= 15`) | `build.test.cjs`: ningún `backdrop-filter` sin par en `main.css` | hecho (4.39.0) |
| 1.4 | Reglas oscuras huérfanas (selector inexistente en HTML/JS/SCSS) | `_modo-oscuro.scss:78,437` (`.header-meteo`), `:111,1164` (`.historia__leyenda`), `:393` (`.calendario-eventos__cabecera-titulo`) | Componentes retirados sin limpiar el tema | Eliminar | Guardia de CSS muerto | pendiente |
| 1.5 | `100vh` sin `100dvh` (barra de Safari móvil) | `_contenido-legal.scss:10`, `_mapa.scss:16,39,43,47`, `_video-dron.scss:385`, `_colaboraciones.scss:399` | Patrón antiguo; `_buscador.scss:74-75` ya usa el correcto | `vh` + `dvh` | stylelint `declaration-property-value-disallowed-list` no aplica; revisión en el test de convenciones | pendiente |
| 1.6 | `outline: none` sin anillo de foco alternativo | `_video-dron.scss:142,233,352,433`, `_escudo-enlace.scss:37`, `_galeria-pager.scss:139`, `_buttons.scss:94`, `_cookie-banner.scss:105`, `_falla.scss:1082` | Se quitó el contorno nativo sin `:focus-visible` | `&:focus:not(:focus-visible) { outline: none }` + anillo `:focus-visible` con los tokens de foco | Test de teclado (`Tab` → `outline-style !== none`) | pendiente |
| 1.7 | Controles sin semántica: `.calendario-eventos__mini-dia` es un `div` con `cursor: pointer` sin `role`/`tabindex`; `.forecast-day`, `.quieres-mas__title`, `.email-popup` con `cursor: pointer` sin ser clicables | `calendario.js:226`, `_calendario.scss:603`, `_meteo.scss:299`, `_quieres.scss:66`, `_organigrama.scss:433` | Estilo de control sin comportamiento | `role="button"` + `tabindex="0"` + Enter/Espacio en el mini-día; quitar `cursor: pointer` donde no hay acción | `reveal-on-scroll`/`calendario` E2E | pendiente |
| 1.8 | `user-select: none` en el titular del acordeón (texto no copiable) | `_falla.scss:193` | Copiado de un patrón de botón | Eliminar | stylelint `property-disallowed-list` (`user-select` fuera de iconos) | pendiente |
| 1.9 | Texto por debajo de 1,2 rem | `_contenido-legal.scss:451` (0,75 rem `!important`, fuera de print), `_footer.scss:186` (0,8 rem), mini-días del calendario (0,8 rem ×12) | Tamaños heredados | Subir a ≥ 1,2 rem si es texto legible; anotar los decorativos | Revisión manual en Chrome a 390 px | pendiente |
| 1.10 | `prefers-contrast` cubre 3 selectores; sin `forced-colors` | `_accessibility.scss:31-38` | Nunca se contempló | Bloque `@media (forced-colors: active)` para botones, menú, acordeones y foco | — | pendiente |
| 1.11 | `--header-bar-bg` se emite literalmente como `v.$gradiente-institucional` (custom property inválida en modo claro; la barra usa su fallback) | `layout/_header.scss:518` | Custom property con variable Sass sin `#{}` | `--header-bar-bg: #{v.$gradiente-institucional}` y comprobar qué cambia en la barra | stylelint `scss/dollar-variable-no-missing-interpolation` (detectado por el linter en 4.39.0) | pendiente |

## 2. Duplicados y cascada

| # | Hallazgo | Dónde | Causa | Corrección | Guardia | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | Tres bloques `.navegacion` en el mismo fichero | `layout/_header.scss:302,762,898` (+ `_modo-oscuro.scss:139` sin ámbito de tema) | Reescrituras sucesivas del menú (v4.0, v4.14, v4.23) sin fusionar | Un solo bloque con el estado final | `no-duplicate-selectors` + test de selectores de nivel superior duplicados | pendiente |
| 2.2 | Bloques repetidos en el mismo fichero | `_meteo.scss:360/545` (`.actual-temp`), `:395/411` (`.forecast-temp`), `_calendario.scss:14/537`, `:211/216`, `_notificaciones.scss:33/46`, `_quieres.scss:177/201`, `_representantes.scss:10/214`, `_image-optimization.scss:36/56`, `_board.scss:239/246`, `_theme-compatibility.scss:13/38`, `_header.scss:521/1089`, `_modo-oscuro.scss:237,267,561,688` (`body.modo-oscuro`), `:7/551`, `:249/547`, `:761/765` (fusionado en 4.38.2), `:360/399`, `:370/374` | Acumulación | Fusionar conservando el resultado ganador | Ídem | pendiente |
| 2.3 | Selectores duplicados entre ficheros | `.header`/`.waves` (`animaciones/_waves.scss:6,19` vs `_header.scss:12,360`), `#notificacion` (`_calendario.scss:774` copia de `_notificaciones.scss:7`), `.forecast-desc` (`_forecast.scss:83` vs `_meteo.scss:391`), `.sr-only` ×3 (`_accessibility.scss:153`, `_seo.scss:136`, copia anónima `_falla.scss:572`), `.header__lang-options` (`_accessibility.scss:118` vs `_header.scss:1044`), `.boton` (`_modo-oscuro.scss:149`), `img[loading="lazy"]` ×4 (`_seo.scss:89`, `_image-optimization.scss:163,289`, `_accessibility.scss:186`), `body.modo-claro` (`_theme-compatibility.scss:54` vs `_modo-oscuro.scss:16`) | Sin dueño BEM por fichero | Un dueño por bloque | Ídem | pendiente |
| 2.4 | Reglas de etiqueta globales desde componentes | `p { color }` (`_falla.scss:584`), `img { border-radius }` (`_image-optimization.scss:15`), `a { color }` (`_typography.scss:36` vs `_accessibility.scss:56`), `button`/`a` con elevación en hover (`_accessibility.scss:56-61`) | Estilo de sección escrito sin ámbito | Acotar al contenedor | Test «sin selectores de etiqueta a nivel raíz en `components/`» | pendiente |
| 2.5 | `:root` y custom properties en varios ficheros | `:root` en `_globales.scss:11`, `_header.scss:517`, `_organigrama.scss:7,316-369`, `_theme-compatibility.scss:7,26,32`; 14 propiedades redefinidas (`--header-bar-bg`, `--current-theme-color`, `--font-*`, `--spacing-md`…) | Cada componente declaró las suyas en `:root` | `:root` solo en `abstracts/_globales.scss`; las del organigrama bajo `.organigrama-contenedor` | Test «`:root` solo en `_globales`/`_theme-compatibility`» | pendiente |
| 2.6 | `#id` en SCSS de componentes (40+) | `_quieres.scss` (`#modal-quieres`, `#quieres-form`, `#quieres-mensaje`), `_notificaciones.scss:7-46`, `_meteo.scss:415-560` (`#current-*`), `_header.scss:588,623`, `_calendario.scss:101,774`, `_contenido-legal.scss:312`, `_mapa.scss:39-47` (`#map`) | Selectores copiados del JS | Clases BEM (el `id` se conserva para el JS) | stylelint `selector-max-id: 0` | pendiente |
| 2.7 | Selectores compilados de ≥ 4 compuestos (21) | `_falla.scss:678,697,698`, `_colaboraciones.scss:146`, `_header.scss:45,394` (p. ej. `body:not(.modo-oscuro) .historia__archivos .accordion .accordion__titular:not(:hover):not(:focus-visible) .accordion__icon`) | Overrides sobre overrides | Clases de estado o `:where()` | stylelint `selector-max-compound-selectors: 4` | pendiente |
| 2.8 | Tres patrones de tema conviviendo | Central `body.modo-oscuro` (168), inverso `body:not(.modo-oscuro)` en 20 sitios, `.modo-claro` solo en `_timeline.scss:104,119` | Evolución | Solo se unifica el timeline a `body:not(.modo-oscuro)`; el resto queda documentado | — | deuda parcial |
| 2.9 | Ficheros de más de 1.000 líneas con varios bloques BEM | `_falla.scss` (1.356), `_header.scss` (1.147) | Crecimiento | Troceado contiguo: `_falla`, `_falleros`, `_accordion`, `_historia`, `_directiva`; `_header`, `_header-barra`, `_nav` (CSS byte-idéntico) | Diff de `main.css` | pendiente |

## 3. CSS muerto

| # | Hallazgo | Dónde | Corrección | Guardia | Estado |
| --- | --- | --- | --- | --- | --- |
| 3.1 | 108 de 641 clases sin uso en HTML/JS/JSON/gulpfile (~88 eliminables) | `components/_base.scss` entero (paleta de muestra), genéricos de `optimization/_seo.scss` (`.hero-image`, `.gallery-item`, `.microdata` + el único `@extend`…), `.btn-direccion*` (`_buttons.scss:170-229`), `.image-container*`/`.preload-hint` (`_image-optimization.scss`), `.notificacion--*` (`_notificaciones.scss:24-30`, el JS solo añade `mostrar`), `.board__file-icon--*`/`.board__file-text`, `.calendario-eventos__cabecera*`, `.anexo-falla`, `.historia__texto1-7`, `.header-inner__modo-boton`, `.organigrama-container`, `.ofrenda__subtitulo`, `.galeria-pager__vecina--*`, `.modal-open`, `.error-message`, `.theme-update-helper`… | Eliminar; conservar `.video-dron__*` (plantilla documentada) y clases de librería (`swiper-*`, `flatpickr-*`, `leaflet-*`) | Test de CSS muerto con lista de permitidos explícita (`tests/fixtures/scss-allowed-unused.json`) | pendiente |

## 4. `!important`, `z-index` y convenciones

| # | Hallazgo | Dónde | Corrección | Guardia | Estado |
| --- | --- | --- | --- | --- | --- |
| 4.1 | 256 `!important` (222 sin comentario) | `_image-optimization` 62, `_contenido-legal` 56 (print), `_accessibility` 27 (reduced-motion, `.sr-only`), `_modo-oscuro` 26, `_meteo` 24, `_falla` 20, `_footer` 13… | Quirúrgico: transiciones de tema (1.2), `_calendario:157,160`, `_colaboraciones:153,158`, `_notificaciones:24-27`, `_falla:111,154,343,576,729-730`, `_meteo:123-146,196`, `_footer:74,84-89`, `_contenido-legal:226-231,260` | Presupuesto por fichero que no puede subir (`tests/fixtures/scss-baseline.json`) + stylelint `declaration-no-important` (warning) | pendiente |
| 4.2 | 23 valores de `z-index` sin escala y con colisiones (`10000` ×2, `3200` ×2, `9999`) | Ver `docs/global-styles.md` (escala) | Tokens `$z-*` en `_variables.scss` (bloque 9) | Test «`z-index` solo desde tokens» | pendiente |
| 4.3 | Media queries fuera de convención o mal formateadas | `640` (`_falla:922`), `600` (`_visor:169`), `479` (`_representantes:331`), `1100` (`_colaboraciones:198`), `1023` (`_calendario:748`); sin espacio en `_eventos`, `_forecast`, `_galeria`, `_countdown`; `screen and` en `_sociales`, `_header`, `_image-optimization` | Lista canónica 480/767/768/1024/1025/1200/1201 | Test de media queries permitidas | pendiente |
| 4.4 | `font-size` en px con base 62,5 % | `_visor.scss:120-212` (9), `_organigrama.scss:450`, `_seo.scss:158` | rem equivalente | stylelint `unit-allowed-list` | pendiente |
| 4.5 | `transition: all` | `_sociales.scss:29`, `_board.scss:55`, `_eventos.scss:89` | Propiedades explícitas | stylelint `declaration-property-value-disallowed-list` | pendiente |
| 4.6 | `@extend` de clase real | `_seo.scss:109,114` (`@extend .microdata`) | Desaparece con el CSS muerto | stylelint `scss/at-extend-no-missing-placeholder` | pendiente |
| 4.7 | Comentarios con ruta obsoleta | `_buscador.scss:378` (`animaciones/_modo-oscuro.scss`), `animaciones/_waves.scss:1` (`components/_waves.scss`), `_calendario.scss:1` (`components/_agenda.scss`) | Corregidos | Test de rutas en comentarios (activo, sin baseline) | hecho (4.39.0) |

## 5. Tooling

| # | Hallazgo | Corrección | Estado |
| --- | --- | --- | --- |
| 5.1 | Sin linter de SCSS ni script de lint | `stylelint` + `stylelint-config-standard-scss`, `.stylelintrc.json`, `npm run lint:scss` (`scripts/lint-scss.mjs`, errores = rojo, avisos con presupuesto por regla en `tests/fixtures/stylelint-baseline.json`) dentro de `test:unit` y `audit:project` | hecho (4.39.0) |
| 5.2 | Sin `browserslist` | Clave en `package.json` (`defaults`, `iOS >= 15`, `Safari >= 15`) | hecho (4.39.0) |
| 5.3 | `tests/unit/build.test.cjs` compila un SCSS sintético, no el real | Test que compila `src/scss/main.scss` con `sass.compile` y falla con avisos o si supera el presupuesto de peso (230 KB / 42 KB gz), más el par `backdrop-filter`/`-webkit-` en `dist/` | hecho (4.39.0) |
| 5.4 | Sass 1.89 sin deprecaciones, sin `@import`, sin funciones globales | Nada que corregir; la guardia 5.3 lo mantiene | hecho (auditoría) |

## Deuda documentada (no se corrige en 4.39.x)

- `:hover` sin `@media (hover: hover)` (131 usos, 0 % cubierto): cambiaría el comportamiento táctil de todo el sitio; decisión aparte.
- Los 62 `!important` de `_image-optimization.scss` y los de `@media print`: funcionan y su retirada exige rediseñar el skeleton de imágenes.
- `cssnano` 5 → 7: salto mayor; revisar con `npm audit` en una release propia.
- Patrones de tema `body:not(.modo-oscuro)` en 20 sitios: se aceptan como forma de acotar reglas solo claras; el central sigue siendo `themes/_modo-oscuro.scss`.

---

Guardias de la baseline (4.39.0, `tests/fixtures/scss-baseline.json`): 52 selectores raíz duplicados · 91 clases sin uso · 195 `!important` (fuera de print/reduced-motion) · 44 `z-index` literales · 22 media queries fuera de convención · 0 rutas obsoletas · 4 etiquetas globales en `components/` · 5 bloques sin cobertura de tema. stylelint: 410 avisos (`tests/fixtures/stylelint-baseline.json`).

Última actualización: 15 de septiembre de 2026 - v4.39.0
