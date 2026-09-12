# 🔎 Buscador general (v4.29.0)

Buscador bilingüe (ES/VA) para el sitio estático: **panel** desplegable bajo la barra, **índice JSON generado por el build** y **matcher propio** sin dependencias. Solo se descarga el índice al abrir el panel (o al pasar el ratón / enfocar el botón).

## Archivos

| Archivo | Papel |
| --- | --- |
| `gulpfile.js → buildSearchIndex` | Genera `dist/data/search-index.json` dentro de `htmlTask` y devuelve su hash; `modifyHtmlStream` inyecta `<meta name="search-index" content="data/search-index.json?v=<hash>">` en cada página (ES y `/va/`). Tarea suelta `npx gulp searchIndex`. Kill-switch `DISABLE_SEARCH_INDEX=1`. |
| `src/js/buscador.js` | Crea el botón lupa en `.header__botones` y el panel `#siteSearch` en la barra; carga el índice; normaliza, puntúa y pinta. Expone `window.FallaBuscador` (`normalizar`, `tokenizar`, `buscar`) y funciona en Node (`require`) para el evaluador. Cargado con `<script src="js/buscador.js" defer>` en las 30 páginas. |
| `src/scss/components/_buscador.scss` | Botón (mismo relieve que el toggle del menú) y panel (mismo cristal que `.navegacion`); modo oscuro y `prefers-reduced-motion`. |
| `src/data/search-keywords.json` | Palabras clave editoriales por id de registro (≤ ~25 entradas). Se fusionan en el índice en el build. |
| `src/data/translations.json → buscador.*` | Textos ES/VA del botón, panel, estados, chips de tipo y ejemplos. |
| `src/js/acc.js → abrirPorHash` | Abre el panel de acordeón cuyo `.accordion__content` tiene el id del hash (`lafalla.html#ofrenda-2026-lafalla`) y desplaza hasta él. |
| `src/js/nav-menu.js` | Emite `nav:open` y escucha `buscador:open`: menú y buscador son excluyentes. |
| `scripts/search-eval.mjs` | `npm run search:eval`: ejecuta las 16 consultas de aceptación contra `dist/` y comprueba que todos los `url#id` del índice existen. Sale con 1 si < 80 % o hay destinos rotos. |
| `tests/buscador.e2e.spec.js` | Guardia (smoke). |

## Qué entra en el índice

| Tipo (`tipo`) | Fuente | id | URL |
| --- | --- | --- | --- |
| `pagina`, `formulario`, `legal` | `src/*.html` publicables (`<title>`, `meta description`; título VA de `nav.*`, `calendario.titulo`, `organigrama.titulo`, `nuevosFalleros.form*.titulo`) | `page:<slug>` | `<slug>.html` |
| `galeria` | `galeria.galeriaN` / `galeriaN-texto` (ES/VA) | `gal:N` | `galeria_N.html` |
| `post` | `blog.<slug>.cardTitle`, `article:published_time` | `post:<slug>` | `blog-<slug>.html` |
| `seccion` | `SEARCH_SECTIONS` del gulpfile: paneles de Archivos (Representantes, Monumento, Ofrenda, Llibrets) y HOPE, con título `Padre · Edición` ES/VA | `sec:*` | `lafalla.html#<id del .accordion__content>` / `colaboraciones.html#hope-colaboracion` |
| `documento` | wrappers `src/pdf/**/*.html`, `llibret_2026.html`, documento Drive de Nuevos Falleros | `doc:*` | `pdf/…html` (solo raíz), `llibret_2026.html`, `nuevos-falleros.html#nuevos-falleros-documento` |
| `evento` | `eventos.json` **sin** categoría `Festivo` ni ids `EVENTOS_EXCLUIDOS_DEL_INDICE` (23, 24, 25, 48, 49: marcadores de prueba). Solo castellano (el VA repite el ES). | `evt:<id>` | `calendario.html` |
| `anuncio` | `board.json` / `sports-board.json` con `activo !== false` | `nota:<id>` | `eventos.html#notesBoard` / `deportes.html#sportsBoard` |

Excluidas: `ai-info`, `base`, `mantenimiento`, `google*`; `llibret_2026.html` como página (entra como documento); PDFs sin wrapper; el contenido interno de PDF/Drive.

Cada registro: `id`, `tipo`, `prio` (1 páginas/formularios · 2 galerías/posts/documentos · 3 secciones/legales · 4 eventos/anuncios), `titulo{es,va}`, `desc{es,va}`, `seccion` (clave `nav.*`), `url` (relativa; el cliente antepone `SITE_ROOT` y `va/` si procede; `pdf/` y `llibret_` solo en raíz), `fecha`, `ejercicio` (`AAAA-AA`; de septiembre a agosto), `hasta`, `kw`. Un registro por página lógica (ES y VA en el mismo).

## Relevancia (explicable)

Normalización: minúsculas, sin tildes ni diéresis (`Suïssa` = `suissa`), `·` eliminado, apóstrofos como espacio, tokens ≥ 2 letras sin stopwords ES/VA; variante singular simple (`llibrets` → `llibret`). Se busca en título y descripción **ES y VA** a la vez; el resultado se muestra en el idioma de la interfaz.

Puntos: frase exacta en título 10 · token en título 5 · palabra clave 4 (+2 si además coincide el título) · prefijo en título (≥ 3 letras) 3 · palabra clave parcial 2 · token en descripción 1 · año en ejercicio/fecha 2 · todos los tokens presentes +3 · año o ejercicio de la consulta igual al del registro +6 · registro pasado −4 (salvo que la consulta lleve año). Orden: puntuación, `prio`, ejercicio más reciente, título ES.

Consultas: vacía → estado inicial con ejemplos; 1 carácter → «Escribe al menos 2 letras»; sin coincidencias → mensaje + ejemplos + «Ver todas las galerías»; error de carga → mensaje + «Reintentar» + enlace al calendario.

## Vigencia

- **Caducidad por fecha, sin rebuild**: el cliente compara `hasta` (notas; también `board.js` la respeta) o `fecha` (eventos) con el día actual y marca «Pasado» bajando la puntuación.
- **Retirada editorial** (`activo: false`, borrar una galería o un post): requiere build (forma parte de cada deploy).
- Los `.json` de `data/` se sirven con `max-age=0, must-revalidate` y el índice lleva `?v=<hash>`.

## Interfaz y accesibilidad

Botón `button.header__search-toggle` (lupa + «Buscar»; solo icono < 768 px) con `aria-expanded`/`aria-controls`. Panel `div#siteSearch.buscador[role=search]` (`hidden` + `inert` cerrado): etiqueta visible «Buscar en la web», `input[type=search]` con debounce de 150 ms, botón «Borrar» (desde v4.29.1 es un aspa pequeña dentro del campo, a la derecha, visible solo con texto; al pulsarla el panel sigue abierto y el cursor vuelve al campo; la ✕ de la cabecera, «Cerrar buscador», es la única que cierra el buscador y va sin círculo; campo blanco con borde fino y un único anillo de foco, ámbar en modo oscuro), ayuda «Para filtrar los actos… usa el calendario» (diferencia con `#filtro-busqueda` del calendario), `p.buscador__estado[aria-live=polite]` que anuncia solo el recuento, lista `ol.buscador__lista` con título, descripción (≤ 140 caracteres), chips de tipo / sección / ejercicio o fecha / «Pasado», «Mostrar más» de 10 en 10. Teclado: foco al campo al abrir, ↓ desde el campo al primer resultado, ↑/↓ entre resultados, Escape cierra y devuelve el foco al botón; clic fuera cierra (el detector usa `event.composedPath()`, no `panel.contains(e.target)`: los botones de sugerencia, «Mostrar más» y «Reintentar» repintan el cuerpo antes de que llegue el clic a `document`, y el botón pulsado ya no está en el DOM). La consulta se guarda en `sessionStorage.buscadorQuery` y se restaura al reabrir. Abrir el buscador cierra el menú y viceversa.

## Añadir contenido

No hay nada que mantener a mano: una galería, un post o una página nuevos entran solos en el siguiente build. Si una consulta natural no la cubre el título (p. ej. «apuntarme» → Nuevos Falleros), añade la entrada en `search-keywords.json` con el id del registro y ejecuta `npm run build && npm run search:eval`. Para un panel de acordeón nuevo, añade su fila a `SEARCH_SECTIONS` (gulpfile) con el id del `.accordion__content`.

## Casos de aceptación

`npm run search:eval` cubre: «autorización menores», «apuntarme», «llibrets», «ofrenda 2026», «calendari» (UI ES), «cremà», «sant joan», «fallera mayor infantil», «proclamació 2025», «representantes 2024-25», «suissa», «organigrama», «tiempo valencia», «cookies», y sin coincidencias «paella» y «xyz123». Resultado el 11-sep-2026: 14/14 en el top 3 (objetivo ≥ 80 %).

Pendientes editoriales: traducir al valenciano título y descripción de los eventos de `eventos.json`; no existe una página de inscripción («apuntarme» lleva a Nuevos Falleros; el formulario «¿Quieres formar parte?» es un modal de la home).

---

Última actualización: 12 de septiembre de 2026 - v4.30.8
