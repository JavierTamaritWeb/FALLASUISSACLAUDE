# 🎨 Paleta funcional y degradados (v4.29.0)

Evolución **gradual y aditiva** de la paleta: azul y coral siguen siendo la identidad, los degradados no cambian y se corrigen los textos que no cumplían WCAG 2.2 AA (4,5:1 texto normal; 3:1 texto grande de ≥ 24 px o ≥ 19 px negrita y componentes de interfaz). Guardia: `tests/color-tokens.e2e.spec.js`.

## Tokens (`src/scss/abstracts/_variables.scss`)

| Token | Valor | Función | Ratio de referencia |
| --- | --- | --- | --- |
| `$gradiente-institucional` | `linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%)` | Única fuente del degradado (antes 11 copias literales) | — |
| `$coral-texto` | `#B83F35` | Coral como **texto** sobre fondos claros | 5,5 blanco · 5,1 `$blanco-hueso` · 5,0 `$naranja-suave` · 4,7 `#fae9e8` |
| `$coral-claro` | `#FFB4AA` | Coral como texto **pequeño** sobre azul o gris oscuro | 5,1 `#0a4b8d` · 6,0 `#02427a` · 11 `#111` · 5,7 `#444` |
| `$azul-enlace-oscuro` | `#8FB8FF` | Enlaces y acción principal en oscuro (`#004BCF` da 2,6 sobre `#111`) | 9,4 `#111` · 7,9 `#172334` |
| `$texto-secundario-oscuro` | `#B9C4D0` | Texto secundario en oscuro | 10,7 `#111` |
| `$superficie-elevada-oscuro` | `#172334` | Tarjeta elevada en oscuro (opcional; hoy no se usa) | — |
| `$estado-error/-exito/-aviso/-info` | `#B3261E` / `#1B6E3A` / `#8A5A00` / `#004BCF` | Estados en claro, siempre con texto o icono | 6,5 / 6,3 / 5,9 / 7,2 sobre blanco |
| `$estado-*-oscuro` | `#FF8A80` / `#7BD389` / `#FFC857` / `#8FB8FF` | Estados en oscuro (texto `$negro-casi`) | 6,9 / 8,7 / 10,3 / 7,9 sobre `#172334` |

Los tokens de marca (`$primary-color #FF6F61`, `$color-azul-falla #004BCF`, `$dorado`, `$blanco-hueso #F5F5F5`, `$naranja-suave #fdf2e9`, `$rojo-salmon #FF8C7A`) **no cambian**. `#F7F4EF` y `#182433` de la propuesta inicial se descartaron: no mejoran los ratios de `$naranja-suave`/`$blanco-hueso` y `$secondary-color`.

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
| Texto principal / secundario | `$secondary-color` / `$gris-oscuro` | `$blanco-hueso` / `$texto-secundario-oscuro` |
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

## Inventario de degradados (sin cambios)

| Dónde | Valor | Modo oscuro |
| --- | --- | --- |
| `body::before`, `.header::before`, `.header-inner::before`, `.quieres-mas::before`, `.countdown__contenedor::before`, `.blog-detail__article::before`, `.colaboraciones::before` | `$gradiente-institucional` en `::before` con `opacity` | `opacity: 0` sobre color sólido (`docs/global-styles.md`) |
| `.accordion__content`, `.historia__prologo`, `.deportes` | `$gradiente-institucional` en el fondo | `$negro` / velo `::before` |
| `--header-bar-bg`, `.header__barra::before` (`.25`/`.30`), `.navegacion` y `.buscador` (`.7`) | mismos tonos con alfa + `backdrop-filter` | `rgba(51,51,51,.7-.8)` |
| `.video-dron__frame::before` | `160deg` (plantilla) | `opacity: 0` |
| `.boton`/`.accordion__titular` hover | `135deg` coral→salmón; brillo `120deg` | salmón→ámbar |
| Tarjetas de Historia, tablón, skeletons, velo de Ofrenda, rayado del bloc | varios (ver `_falla`, `_board`, `_image-optimization`, `_ofrenda`, `_visor`) | overrides propios |

Solo una media query altera un degradado (`.header__barra--scrolled::before` en móvil, color plano). El peor stop para texto es `#0a4b8d`: blanco 8,7 · `$blanco-hueso` 8,0 · `$dorado` 6,2 · `$coral-claro` 5,1 · `$amarillo-anaranjado` 4,6 · `$rojo-salmon` 3,9 · coral 3,2.

## Pendientes (comprobación manual)

Contraste real sobre translúcidos e imágenes: barra `.25/.30` sobre el hero, desplegable y buscador `.7` sobre tarjetas blancas, velo `.85` sobre `fondo_traje`, «Próxima Ofrenda» sobre foto. Se miden en producción con el inspector (3 páginas × 2 modos × 2 anchos). `$superficie-elevada-oscuro` queda disponible para una segunda fase de tarjetas en oscuro.

## Reglas

1. Nunca uses `#FF6F61` como color de texto normal: `$coral-texto` (claro) o `$coral-claro` (oscuro/azul).
2. Nunca copies el degradado literal: `v.$gradiente-institucional` (el test lo comprueba).
3. Los tokens son aditivos: no renombres ni borres variables (`scss-guardrails`); cada color nuevo entra como variable con su ratio en comentario.
4. Todo cambio de color de un componente incluye su bloque en `_modo-oscuro.scss` (los fondos cambian de claro a `#111`/`#444`, y un coral oscuro se vuelve ilegible).
5. `.accordion__titular` copia el hover de `.boton`: cambiar uno exige revisar el otro.

---

Última actualización: 12 de septiembre de 2026 - v4.30.7
