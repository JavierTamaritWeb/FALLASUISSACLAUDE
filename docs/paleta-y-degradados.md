# 🎨 Paleta funcional y degradados (v4.29.0; tokens por importancia desde v4.38.0)

Evolución **gradual y aditiva** de la paleta: azul y coral siguen siendo la identidad, los degradados no cambian y se corrigen los textos que no cumplían WCAG 2.2 AA (4,5:1 texto normal; 3:1 texto grande de ≥ 24 px o ≥ 19 px negrita y componentes de interfaz). Guardia: `tests/color-tokens.e2e.spec.js`.

## Jerarquía de tokens (v4.38.0)

`src/scss/abstracts/_variables.scss` está ordenado **por importancia**, de lo que define la identidad del sitio a lo accesorio. Dentro de cada bloque, el token más usado va primero. Desde v4.38.1 el fichero lleva solo los tokens y las cabeceras de bloque: los ratios de referencia se documentan en *Ratios de referencia por token*, más abajo.

| Bloque | Tokens | Papel |
| --- | --- | --- |
| 1. Marca | `$primary-color` #B83F35, `$color-azul-falla` #004BCF, `$azul-titulo-seccion` #02427A, `$turquesa` #00909E, `$dorado` #FFD700 | Los cinco colores que identifican el sitio |
| 2. Degradados y celestes | `$gradiente-institucional`, `$gradiente-cristal-menu`, `$cristal-menu-oscuro`, `$celeste-1…5`, `$gradiente-celeste`, `$azul-cobalto` | Fondos de marca (institucional, cristal del menú, celeste de la home) |
| 3. Neutros | `$blanco`, `$blanco-hueso`, `$secondary-color`, `$negro-casi`, `$negro`, grises oscuros y claros (de claro a oscuro) | Texto y fondos base en ambos modos |
| 4. Superficies de sección en claro | `$rosa-acordeon`, `$rosa-acordeon-hover`, `$turquesa-suave`, `$turquesa-claro`, `$turquesa-texto`, `$naranja-suave` | La paleta de la home (v4.30.22-4.37.2) |
| 5. Texto de contraste | `$coral-claro`, `$azul-enlace-oscuro` | Texto pequeño sobre azul/oscuro |
| 6. Acentos de interacción | `$rojo-salmon`, `$amarillo-anaranjado`, `$naranja-quemado` | Hover de botones y titulares |
| 7. Estados | `$estado-error/-exito/-aviso/-info` y `-oscuro` | Siempre con texto o icono |
| 8. Usos puntuales | `$color-urgente`, `$azul-marino` (calendario), `$azul-verdoso` (contacto) | Un solo componente cada uno; candidatos a revisar |
| 9. Sin color | tipografía, espaciado, sombra, transición, cenefa, falleret | — |
| 10. Alias heredados | `$coral-texto` = `$primary-color`, `$turquesa-sobre-rosa` = `$turquesa-texto` | Mismo valor desde v4.31.0 / v4.30.28; **no usar en código nuevo** |

Retiradas en v4.38.0 por no tener ningún uso: `$naranja-coral`, `$rosa-pastel`, `$purpura`, `$color-tiktok`, `$color-facebook`, `$color-youtube`, `$texto-secundario-oscuro`, `$superficie-elevada-oscuro`, `$img-path` y `$melocotin-claro`. En la misma versión se sustituyeron ~90 literales que ya tenían token (`#333`, `#fff`, `#000`, `#111`, `#444`, `#555`, `#f5f5f5`, `#fdf2e9`, `rgba(255,215,0,…)`, `rgba(245,245,245,…)`) por su variable, y los `rgba(255,111,97,…)` del coral antiguo por `rgba(var(--coral-marca-rgb), a)` (único cambio visible: los glows y halos que seguían en #FF6F61 pasan al primario). `--coral-marca-rgb` se deriva ahora del token con `color.channel()`. Dos guardias nuevas en `tests/scss-guardrails.e2e.spec.js`: ninguna variable de `_variables.scss` sin uso y ningún literal con token fuera de `@media print`.

### Ratios de referencia por token (v4.38.1)

Desde v4.38.1 `_variables.scss` va sin comentarios por token; los ratios WCAG que antes acompañaban a cada color viven aquí:

- **Marca**: `$primary-color` 5,5:1 sobre blanco (bordes, badges, brillos y botones; texto solo como `$coral-texto`); `$color-azul-falla` 5,4:1 sobre blanco; `$azul-titulo-seccion` 9,3:1 sobre `$blanco-hueso` (vía `var(--titulo-seccion)`; coincide con el stop medio del degradado); `$turquesa` 3,5:1 sobre claro (solo bordes y texto grande); `$dorado` 8,9:1 sobre `#0a4b8d` (anillos de foco sobre azul).
- **Celestes**: `$azul-titulo-seccion` sobre `$gradiente-celeste` da 8,9:1 en el stop más claro y 3,3:1 en el más oscuro (ahí solo texto grande). `$azul-cobalto`: olas del hero y franja de la cuenta atrás.
- **Neutros**: `$secondary-color` 12,6:1 sobre blanco (texto principal); `$gris-oscuro` 8,6:1 y `$gris-medio-oscuro` 7,5:1 (texto secundario/terciario sobre claro); `$gris` 3,5:1 (solo placeholders); `$gris-muy-claro` 12,6:1 sobre negro (texto sobre oscuro); `$gris-muy-oscuro` superficie oscura secundaria; `$gris-oscuro-medio` solo modo oscuro; `$gris-oscuro-frio` y `$gris-medio-azulado` pinzas del tablón; `$gris-plateado`, `$gris-medio-claro`, `$gris-claro` bordes y separadores.
- **Superficies de sección**: `$rosa-acordeon-hover` con `$negro-casi` encima 6,4:1; `$turquesa-suave` con `$azul-titulo-seccion` encima 8,8:1; `$turquesa-claro` con `$negro-casi` encima 14:1; `$turquesa-texto` 4,6:1 sobre rosa/claro (texto pequeño) y caja de texto de la Plana Mayor; `$naranja-suave` fondo cálido heredado (acordeón base, marco del tablón, papel del bloc).
- **Acentos**: `$rojo-salmon` con `$negro-casi` encima 8,5:1 (segundo stop del hover de `.boton`); `$amarillo-anaranjado` 8,3:1 sobre `#0a4b8d` (hover en oscuro y anillo de foco oscuro); `$naranja-quemado` hover de enlaces en oscuro.
- **Estados**: `$estado-error` 6,5:1, `$estado-exito` 6,3:1 y `$estado-aviso` 5,9:1 sobre blanco; `$estado-error-oscuro` 6,9:1, `$estado-exito-oscuro` 8,7:1 y `$estado-aviso-oscuro` 10,3:1 sobre `#111`.
- **Usos puntuales**: `$color-urgente` categoría urgente y `$azul-marino` domingos del calendario; `$azul-verdoso` hover de los inputs del formulario de contacto.

## Tokens de la paleta funcional (v4.29.0)

| Token | Valor | Función | Ratio de referencia |
| --- | --- | --- | --- |
| `$gradiente-institucional` | `linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%)` | Única fuente del degradado (antes 11 copias literales) | — |
| `$coral-texto` | `#B83F35` | Coral como **texto** sobre fondos claros | 5,5 blanco · 5,1 `$blanco-hueso` · 5,0 `$naranja-suave` · 4,7 `#fae9e8` |
| `$coral-claro` | `#FFB4AA` | Coral como texto **pequeño** sobre azul o gris oscuro | 5,1 `#0a4b8d` · 6,0 `#02427a` · 11 `#111` · 5,7 `#444` |
| `$azul-enlace-oscuro` | `#8FB8FF` | Enlaces y acción principal en oscuro (`#004BCF` da 2,6 sobre `#111`) | 9,4 `#111` |
| `$estado-error/-exito/-aviso/-info` | `#B3261E` / `#1B6E3A` / `#8A5A00` / `#004BCF` | Estados en claro, siempre con texto o icono | 6,5 / 6,3 / 5,9 / 7,2 sobre blanco |
| `$estado-*-oscuro` | `#FF8A80` / `#7BD389` / `#FFC857` / `#8FB8FF` | Estados en oscuro (texto `$negro-casi`) | 6,9 / 8,7 / 10,3 / 9,4 sobre `#111` |

**Desde v4.31.0 el color primario es `#B83F35`** (`$primary-color` = `$coral-texto`, en claro y oscuro; `--coral-marca-rgb` = `184, 63, 53`; también los literales de `dark.js`, `calendario.js` y los SVG inline). Ojo: `$negro-casi` sobre el primario da 3,4:1 (los hover de `.boton`/titulares con texto oscuro solo llegan a AA en su tramo salmón). Hasta v4.30.47 los tokens de marca (`$primary-color #FF6F61`, `$color-azul-falla #004BCF`, `$dorado`, `$blanco-hueso #F5F5F5`, `$naranja-suave #fdf2e9`, `$rojo-salmon #FF8C7A`) **no cambian**. `#F7F4EF` y `#182433` de la propuesta inicial se descartaron: no mejoran los ratios de `$naranja-suave`/`$blanco-hueso` y `$secondary-color`.

## Regla del coral

`#FF6F61` da 2,5-2,7:1 sobre claros y 3,2:1 sobre el stop más claro del degradado. Por tanto:

- **Decoración** (bordes, badges `+`, subrayados, brillos, chips, fondos de botón destacado): coral de marca, sin restricción.
- **Texto grande sobre azul o negro** (título del header 3-7 rem, `.accordion__header` ≥ 768 px, `.deportes__heading-texto`): coral de marca (3,2:1 ≥ 3:1).
- **Texto normal sobre claro**: `$coral-texto`.
- **Texto normal sobre azul/gris oscuro**: `$coral-claro`.

## Mapa funcional

| Función | Claro | Oscuro |
| --- | --- | --- |
| Fondo de página | `$gradiente-institucional` (`body::before`) | `$negro` |
| Superficie de lectura | `$naranja-suave`, `$blanco-hueso` | `$negro-casi`, `$gris-muy-oscuro` |
| Tarjeta | `$blanco` | `$gris-muy-oscuro` / `$negro-casi` |
| Texto principal / secundario | `$secondary-color` / `$gris-oscuro` | `$blanco-hueso` / `$gris-muy-claro` |
| Enlace en contenido | `$color-azul-falla` | `$azul-enlace-oscuro` |
| Acción principal (`.boton`) | fondo blanco 0,94, texto `$coral-texto`, borde coral; hover degradado coral→salmón con texto `$negro-casi` | fondo negro 0,88, texto coral; hover salmón→ámbar |
| Acción secundaria (`.boton-modal`, `.cookie-banner__btn--rechazar`) | blanco, texto `$coral-texto`, borde coral | transparente, texto claro |
| Acción destacada (`.ics-modal__boton`, `.calendario-eventos__boton-quitar`) | fondo coral, texto `$negro-casi` (6,9:1) | fondo `$rojo-salmon`, texto `$negro-casi` |
| Deshabilitado (`.boton:disabled`, `[aria-disabled]`) | borde discontinuo gris, texto `$gris-medio-oscuro`, `opacity .7`, sin brillo | borde `$gris-oscuro`, texto `$gris-plateado` |
| Foco (`:focus-visible` global) | anillo coral 3 px + anillo interior `$negro-casi` 2 px (`box-shadow`) | anillo `$amarillo-anaranjado` + interior `$blanco-hueso` |
| Estados (`#notificacion.notificacion--exito/--error/--aviso/--info`, `#modal-quieres .modal-header--exito/--error`) | `$estado-*` con icono `::before` (✓ / ⚠) | `$estado-*-oscuro` con texto oscuro |
| Dorado | solo mensajes del countdown sobre azul (6,2:1) y `.btn-direccion`; nunca como texto sobre claro (1,3:1) | igual |

## Cambios aplicados en v4.29.0 (piloto y extensión)

| Componente | Antes | Ahora |
| --- | --- | --- |
| `.boton` / `.boton-modal` reposo | coral sobre blanco (2,7) | `$coral-texto` (5,5); estado `disabled` propio |
| Calendario: etiquetas, leyenda, título, títulos de evento, domingo | coral sobre marfil/blanco (2,3-2,7) | `$coral-texto`; en oscuro `$coral-claro`; números de día `$blanco-hueso` en oscuro (antes `#333` sobre `#444`) |
| Calendario: inputs en hover | blanco sobre coral (2,7) | texto oscuro, borde y halo coral |
| Calendario: `.mini-dia:hover` | blanco sobre `#00909E` (3,8) / sobre `#dd6502` (3,5) | `$negro-casi` (4,9 / 5,3) |
| Calendario: categoría Información | `$dorado` sobre blanco (1,4) | `$estado-aviso` (5,9) |
| `.countdown__time-box` | coral sobre `$blanco-hueso` (2,5) | `$coral-texto`; oscuro `$negro-casi` sobre `#ccc` |
| `.directiva__cargo`, `.blog__date`, `.accordion__nombre-plana-mayor` | coral sobre claro | `$coral-texto` (oscuro: coral / `$coral-claro`) |
| `.navegacion__enlace` hover/activo, `.footer__enlace` hover | coral sobre azul a 12-13 px (3,2-3,7) | `$coral-claro` (5,1-6,0); el subrayado sigue coral |
| `.accordion__header` < 768 px, `.representantes-grid__nombre`, `.quieres-mas__title` | coral sobre azul en texto pequeño | `$coral-claro` |
| `.board__file-name` (oscuro), `.ics-modal__label/__cerrar` (oscuro) | coral sobre `#444` (3,6) | `$coral-claro` (5,7) |
| `#notificacion` | blanco sobre coral (2,7) | fondo `$coral-texto` (5,5) + variantes de estado |
| Modal de envío | clases Bootstrap `bg-success`/`bg-danger` sin CSS | `.modal-header--exito/--error` con color e icono |
| `:focus-visible` | coral sobre blanco (2,7) | doble anillo |

## Coral de marca en modo oscuro (v4.30.0)

Decisión del usuario (11-sep-2026): en modo oscuro **todo** lo que usa `$primary-color` (#FF6F61) pasa a `$coral-texto` (#B83F35), incluido el texto normal, aun sabiendo que sobre `#111` da 3,4:1, sobre `#333` 2,3:1 y sobre `#444` 1,8:1 (en claro #FF6F61 sobre negro daba 7,5:1).

Mecanismo, sin duplicar reglas:

| Custom property | `:root` (claro) | `html/body.modo-oscuro` |
|---|---|---|
| `--coral-marca` | `#FF6F61` | `#B83F35` |
| `--coral-marca-rgb` | `255, 111, 97` | `184, 63, 53` |
| `--coral-marca-claro10` | `color.adjust(+10%)` | ídem sobre `#B83F35` |
| `--coral-marca-oscuro8` / `-oscuro10` | `color.adjust(-8% / -10%)` | ídem |

Declaradas en `src/scss/abstracts/_globales.scss`. En los SCSS: `v.$primary-color` → `var(--coral-marca)`; `rgba(v.$primary-color, a)` → `rgba(var(--coral-marca-rgb), a)`; `color.adjust(v.$primary-color, $lightness: …)` → la derivada correspondiente. `$primary-color` sigue en `_variables.scss` como fuente de los valores (tests y Sass). No cambian los literales de JS/HTML (sol de `dark.js`, iconos SVG, color «Festivo» de `calendario.js`). Guardia: `tests/color-tokens.e2e.spec.js` (en oscuro ningún elemento computa `rgb(255, 111, 97)`).

## Títulos de sección en azul (v4.30.22)

A petición del usuario, los títulos de sección con icono redondo y los títulos de las tarjetas de galería pasan del coral al azul institucional `$azul-titulo-seccion` (`#02427A`) en modo claro:

- `.falla__title` (La Falla; también el título de `colaboraciones.html`), `.ofrenda__titulo`, `.eventos__heading-texto` (Eventos), `.eventos__title` (Calendario), `.forecast__title` (Meteo), `.blog__title`, `.galerias__title` (Galería) y `.galeria__title` (títulos de las 9 tarjetas de galería, que antes heredaban el coral de `.galerias__grid`), y desde v4.30.24 `.falleros__titulo` («Nosotros»), cuyo contenedor (`.falleros__nosotros--plana-mayor`) pasa del coral a fondo `$blanco-hueso` (desde v4.30.29 `$turquesa-suave`, turquesa suave: #EFF8F9 y desde v4.30.30 #E0F2F3; el azul del título da 8,8:1) con borde azul de 2 px (en oscuro sigue en coral); su acordeón lleva borde `$turquesa` de 1 px en claro (v4.30.25) y, desde v4.30.27, filas `$rosa-acordeon` (#FDF0F3 desde v4.30.28), hover/foco `$rosa-acordeon-hover` #FF5A8E con texto `$negro-casi` (6,4:1) y titulares/▼ en `$turquesa-sobre-rosa` #007A86 (4,6:1; el turquesa de marca sobre ese rosa da 3,5:1, insuficiente para el texto de 14 px de móvil). Desde v4.30.32 la subsección «Historia» comparte esta paleta en claro: título `var(--titulo-seccion)`, `.historia__prologo` en `$turquesa-suave` con borde azul, `.historia__archivos` en `$rosa-acordeon` con borde `$turquesa` y títulos/subtítulos/etiquetas en `$turquesa-sobre-rosa`, y sus acordeones (Representantes, Monumentos, Ofrendas) con las mismas filas rosa, hover #FF5A8E y titulares turquesa. En oscuro, Historia no cambia.
- Titulares de acordeón en móvil (v4.30.24): `$coral-texto` (5,0:1 sobre `$naranja-suave`); el `$coral-claro` de v4.29.0 daba 1,6:1 porque la fila del titular es clara, no azul.
- Mecanismo: custom property `--titulo-seccion` en `abstracts/_globales.scss` (`#02427A` en `:root`; `$coral-texto` `#B83F35` en `html/body.modo-oscuro`, porque el azul sobre negro daría ≈2:1).
- Contraste en claro: 9,3:1 sobre `#F5F5F5` y 9,2:1 sobre `$naranja-suave` (AAA).
- Desde v4.30.40 también «Colaboraciones» (`.colaboraciones__heading-texto`), porque su sección va sobre `$gradiente-celeste` (coral 2,0-2,4:1 allí; azul 7,5-8,9:1).
- Desde v4.30.41 también el teaser de «Deportes» de la home y, desde v4.37.2, `deportes.html` entero (`.deportes__heading-texto`, `__delegados-titulo`, `__tablon-titulo`), el hero interior de las 29 páginas (`.header-inner::before` en `$gradiente-celeste`, `.heading-inner` en `$coral-texto` y `__span` en `$azul-titulo-seccion`), el título del monumento (`.falla__monumento-title`), Nuevos Falleros (`__heading-texto`, `__subtitulo`) y el título del tablón (`.tablon-titulo`).
- Siguen en coral: «¿Quieres más?» (`$coral-claro` sobre azul) y los botones.

## Inventario de degradados (sin cambios)

| Dónde | Valor | Modo oscuro |
| --- | --- | --- |
| `body::before`, `.header-inner::before` (solo en oscuro desde v4.37.2), `.quieres-mas::before`, `.blog-detail__article::before` (solo en oscuro desde v4.37.2) | `$gradiente-institucional` en `::before` con `opacity` | `opacity: 0` sobre color sólido (`docs/global-styles.md`) |
| `.colaboraciones::before` (v4.30.40), `.deportes--teaser` (v4.30.41, fondo directo con velo `::before`), `.header::before` del hero de la home (v4.30.45; título `$coral-texto` + `$azul-titulo-seccion` y olas en `$azul-cobalto` #0047AB al 35/55/75/100 %), `.countdown__contenedor::before` (v4.30.47; título en `$azul-titulo-seccion`) | `$gradiente-celeste`: brillo radial + `linear-gradient(160deg, #E3F2FB, #BFE3F7, #93CFF0, #66B4E6, #4A9AD6)` en `::before` con `opacity` | `opacity: 0` sobre `$secondary-color` |
| `.accordion__content`, `.historia__prologo`, `.deportes` (en claro `$gradiente-celeste` desde v4.37.2) | `$gradiente-institucional` en el fondo | `$negro` / velo `::before` |
| `--header-bar-bg`, `.header__barra::before` (`.25`/`.30`), `.navegacion` y `.buscador` (`.7`) | mismos tonos con alfa + `backdrop-filter` | `rgba(51,51,51,.7-.8)` |
| `.video-dron__frame::before` | `160deg` (plantilla) | `opacity: 0` |
| `.boton`/`.accordion__titular` hover | `135deg` coral→salmón; brillo `120deg` | salmón→ámbar |
| Tarjetas de Historia, tablón, skeletons, velo de Ofrenda, rayado del bloc | varios (ver `_falla`, `_board`, `_image-optimization`, `_ofrenda`, `_visor`) | overrides propios |

Solo una media query altera un degradado (`.header__barra--scrolled::before` en móvil, color plano). El peor stop para texto es `#0a4b8d`: blanco 8,7 · `$blanco-hueso` 8,0 · `$dorado` 6,2 · `$coral-claro` 5,1 · `$amarillo-anaranjado` 4,6 · `$rojo-salmon` 3,9 · coral 3,2.

## Pendientes (comprobación manual)

Contraste real sobre translúcidos e imágenes: barra `.25/.30` sobre el hero, desplegable y buscador `.7` sobre tarjetas blancas, velo `.85` sobre `fondo_traje`, «Próxima Ofrenda» sobre foto. Se miden en producción con el inspector (3 páginas × 2 modos × 2 anchos).

## Reglas

1. Nunca uses `#FF6F61` como color de texto normal: `$coral-texto` (claro) o `$coral-claro` (oscuro/azul).
2. Nunca copies el degradado literal: `v.$gradiente-institucional` (el test lo comprueba).
3. No renombres variables con uso ni borres ninguna sin pasar `scss-guardrails` (que desde v4.38.0 también rechaza variables sin uso y literales con token); cada color nuevo entra en su bloque de `_variables.scss` con su papel y su ratio en comentario.
4. Todo cambio de color de un componente incluye su bloque en `_modo-oscuro.scss` (los fondos cambian de claro a `#111`/`#444`, y un coral oscuro se vuelve ilegible).
5. `.accordion__titular` copia el hover de `.boton`: cambiar uno exige revisar el otro.

---

Última actualización: 15 de septiembre de 2026 - v4.38.2
