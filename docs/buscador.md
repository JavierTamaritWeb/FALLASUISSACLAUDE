# 🔎 Buscador general (v4.29.0; cobertura ampliada en v4.33.0; relevancia v2 en v4.34.0; interfaz v2 en v4.35.0)

Buscador bilingüe (ES/VA) para el sitio estático: **panel** desplegable bajo la barra, **índice JSON generado por el build** y **matcher propio** sin dependencias. Solo se descarga el índice al abrir el panel (o al pasar el ratón / enfocar el botón).

## Archivos

| Archivo | Papel |
| --- | --- |
| `gulpfile.js → buildSearchIndex` | Genera `dist/data/search-index.json` dentro de `htmlTask` y devuelve su hash; `modifyHtmlStream` inyecta `<meta name="search-index" content="data/search-index.json?v=<hash>">` en cada página (ES y `/va/`). Tarea suelta `npx gulp searchIndex`. Kill-switch `DISABLE_SEARCH_INDEX=1`. |
| `src/js/buscador.js` | Crea el botón lupa en `.header__botones` y el panel `#siteSearch` en la barra; carga el índice; normaliza, puntúa y pinta. Expone `window.FallaBuscador` (`normalizar`, `tokenizar`, `buscar`) y funciona en Node (`require`) para el evaluador. Cargado con `<script src="js/buscador.js" defer>` en las 30 páginas. |
| `src/scss/components/_buscador.scss` | Botón (mismo relieve que el toggle del menú) y panel (mismo cristal que `.navegacion`, token `$gradiente-cristal-menu`); `prefers-reduced-motion`. El modo oscuro vive en `animaciones/_modo-oscuro.scss` (desde v4.35.0, como el resto de componentes). |
| `src/data/search-keywords.json` | Palabras clave editoriales por id de registro (≈45 entradas desde v4.33.0). Se fusionan en el índice en el build (se **suman** a las que ya traiga el registro, como el cargo de las personas). |
| `src/data/translations.json → buscador.*` | Textos ES/VA del botón, panel, estados, chips de tipo y ejemplos. |
| `src/js/acc.js → abrirPorHash` | Abre el panel de acordeón cuyo `.accordion__content` tiene el id del hash (`lafalla.html#ofrenda-2026-lafalla`) y desplaza hasta él. |
| `src/js/nav-menu.js` | Emite `nav:open` y escucha `buscador:open`: menú y buscador son excluyentes. |
| `scripts/search-eval.mjs` | `npm run search:eval`: ejecuta las 30 consultas de aceptación contra `dist/` y comprueba que todos los `url#id` / `url?dia=` del índice existen. Sale con 1 si < 80 % o hay destinos rotos. |
| `tests/buscador.e2e.spec.js` | Guardia (smoke). |

## Qué entra en el índice

| Tipo (`tipo`) | Fuente | id | URL |
| --- | --- | --- | --- |
| `pagina`, `formulario`, `legal` | `src/*.html` publicables (`<title>`, `meta description` en ES; en VA `nav.*`, `calendario.titulo`, `organigrama.titulo`, `nuevosFalleros.form*.titulo` o, para el resto, `seo.<slug>.{title,description}` desde v4.33.0: ninguna página sale en castellano en `/va/`) | `page:<slug>` | `<slug>.html` |
| `persona` (v4.33.0) | `member` de `src/seo/schema-organization.json` (fuente única de cargos): nombre como título, cargo ES/VA como descripción y palabra clave | `per:<nombre-slug>` | Plana Mayor → `lafalla.html#nosotros-<cargo>-lafalla`; directiva (Presidente, vicepresidencias, secretaría, área económica, delegación infantil) → `lafalla.html#nosotros-directiva-lafalla`; resto de delegados → `organigrama.html` |
| `galeria` | `galeria.galeriaN` / `galeriaN-texto` (ES/VA) | `gal:N` | `galeria_N.html` |
| `post` | `blog.<slug>.cardTitle`, `article:published_time` | `post:<slug>` | `blog-<slug>.html` |
| `seccion` | `SEARCH_SECTIONS` del gulpfile: paneles de Archivos (Representantes, Monumento, Ofrenda), HOPE, Nosotros (los 4 de la Plana Mayor, con el nombre del titular como descripción, y La Directiva con sus nombres; v4.33.0) y tres bloques de la home (Contacto `#quieres-mas`, Redes sociales `#redes-sociales`, Subvención `#banner-subvencion`; textos en `buscador.registros.*`), con título `Padre · Nombre` ES/VA y descripción de `descKeys` (pies de foto, `alt`, texto HOPE…). Ninguna sección va sin descripción. Los llibrets ya no son sección. | `sec:*` | `lafalla.html#<id del .accordion__content>` / `colaboraciones.html#hope-colaboracion` / `#<id>` de la home |
| `documento` | wrappers `src/pdf/**/*.html` (salvo `WRAPPERS_EXCLUIDOS`: el llibret 2025-26 entra una sola vez como `llibret_2026.html`), `llibret_2026.html`, documento Drive de Nuevos Falleros y, desde v4.33.0, los PDFs **sin wrapper** declarados en `SEARCH_PDFS` (6 bases JCF 2026-27, organigrama y editorial en PDF, con título/descripción ES/VA en el gulpfile; un PDF nuevo bajo `src/pdf/` que no esté ni en `SEARCH_PDFS` ni en `PDFS_CON_WRAPPER` produce un aviso en el build) | `doc:*` | `pdf/…html` / `pdf/….pdf` (solo raíz), `llibret_2026.html`, `nuevos-falleros.html#nuevos-falleros-documento` |
| `evento` | `eventos.json` **sin** categoría `Festivo` ni ids `EVENTOS_EXCLUIDOS_DEL_INDICE` (23, 24, 25, 48, 49: marcadores de prueba). Desde v4.33.0 **solo los futuros** (fecha ≥ día del build) y **sin duplicados** de título+fecha (decisión del usuario del 14-sep-2026); si no hay actos futuros el tipo no aparece. Solo castellano (el VA repite el ES). | `evt:<id>` | `calendario.html?dia=AAAA-MM-DD` (`calendario.js` rellena el filtro de fecha y desplaza a la lista) |
| `anuncio` | `board.json` / `sports-board.json` con `activo !== false` | `nota:<id>` | `eventos.html#notesBoard` / `deportes.html#sportsBoard` |

Excluidas: `ai-info`, `base`, `mantenimiento`, `google*`; `llibret_2026.html` como página (entra como documento); el contenido interno de PDF/Drive.

Cada registro: `id`, `tipo`, `prio` (desde v4.33.0: 1 páginas/personas · 2 secciones/formularios · 3 galerías/posts/documentos · 4 legales/eventos/anuncios; así «fallera mayor» devuelve primero el panel de la Fallera Mayor y no las galerías de la Infantil), `titulo{es,va}`, `desc{es,va}`, `seccion` (clave `nav.*`), `url` (relativa; el cliente antepone `SITE_ROOT` y `va/` si procede; `pdf/` y `llibret_` solo en raíz), `fecha`, `ejercicio` (`AAAA-AA`; de septiembre a agosto), `hasta`, `kw`. Un registro por página lógica (ES y VA en el mismo).

## Relevancia (explicable)

Normalización: minúsculas, sin tildes ni diéresis (`Suïssa` = `suissa`), `·` eliminado, apóstrofos como espacio, tokens ≥ 2 letras sin stopwords ES/VA. Se busca en título y descripción **ES y VA** a la vez; el resultado se muestra en el idioma de la interfaz.

**Raíces (v4.34.0, `variantes`)**: a cada palabra —de la consulta y del índice— se le añaden su singular (`llibrets` → `llibret`, `representantes` → `representant`) y, en palabras de más de 6 letras, la forma sin la vocal final de género (`fallera`/`fallero` → `faller`, `presidenta`/`presidente` → `president`, `calendario` → `calendari`); así singular/plural, femenino/masculino y buena parte de los pares ES/VA puntúan como palabra entera del título. **Sinónimos** (`SINONIMOS_BASE`, ≈20 grupos ES↔VA que no comparten raíz: foto/imagen/imatge, mayor/major, monumento/monument, ofrenda/ofrena, tiempo/temps/oratge, niño/xiquet, ayuntamiento/ajuntament…) se expanden en la consulta. **Erratas** (`corregir`): un token de ≥ 5 letras que no casa con ninguna palabra de títulos ni palabras clave se sustituye por la más cercana del vocabulario (distancia de Damerau-Levenshtein ≤ 1, ≤ 2 a partir de 8 letras, misma inicial) y puntúa 2 puntos menos; la lista de resultados lleva `.consulta.corr` (`{ calendrio: 'calendario' }`) y cada resultado `corregido`. `{ sinErratas: true }` lo desactiva. **Años**: «2025» casa con los ejercicios 2024-25 **y** 2025-26 (`enEjercicio`).

Puntos **aditivos por token** (`puntuarToken`, techo 9): palabra del título 5 · palabra clave 4 (o parcial 2) · prefijo de una palabra del título (≥ 3 letras) 3 · palabra de la descripción 1 · año del ejercicio/fecha 2. Más: frase exacta en título 10 · **bigrama** (dos tokens seguidos de la consulta que van seguidos en el título: nombres, «san juan») +2 · todos los tokens presentes +3 · año de la consulta dentro del ejercicio/fecha del registro +6 · registro pasado −4 (salvo que la consulta lleve año). **Los registros pasados nunca se filtran**: salen con la penalización (y el chip «Pasado») aunque su puntuación sea ≤ 0. Orden: puntuación, `prio`, ejercicio más reciente, título ES. Tests: `tests/unit/buscador.test.cjs` (`npm run test:unit`).

Consultas: vacía → estado inicial con ejemplos; 1 carácter → «Escribe al menos 2 letras»; sin coincidencias → mensaje + ejemplos + «Ver todas las galerías»; error de carga → mensaje + «Reintentar» + enlace al calendario.

## Vigencia

- **Caducidad por fecha, sin rebuild**: el cliente compara `hasta` (notas; también `board.js` la respeta) o `fecha` (eventos) con el día actual y marca «Pasado» bajando la puntuación.
- **Retirada editorial** (`activo: false`, borrar una galería o un post): requiere build (forma parte de cada deploy).
- Los `.json` de `data/` se sirven con `max-age=0, must-revalidate` y el índice lleva `?v=<hash>`.

## Interfaz y accesibilidad

**v4.35.0**: el panel sigue el patrón **combobox + listbox**: `input[role=combobox][aria-autocomplete=list][aria-expanded][aria-controls=siteSearchLista]`, lista `ol#siteSearchLista[role=listbox]` y cada resultado `a[role=option][id=siteSearchOpcionN][aria-selected]`; ↑/↓ desde el campo mueven la opción activa (`aria-activedescendant`, clase `.is-activo` con anillo coral/ámbar) **sin sacar el foco del campo** y **Enter abre la opción activa** (o la primera); con el foco en un resultado (Tab) ↑/↓ recorren los focalizables. Las **coincidencias se resaltan** con `<mark class="buscador__mark">` en título y descripción (raíces y sinónimos incluidos) y la descripción muestra la **ventana** de ≈140 caracteres alrededor de la primera coincidencia. Con una **errata corregida** se muestra «Mostrando resultados para «calendario»» (`buscador.corregido`). «Mostrar más» **añade** los siguientes 10 sin repintar y enfoca el primero nuevo; «Reintentar» devuelve el foco al campo. El botón lupa **no cambia de nombre** al abrirse (WCAG 2.5.3 *Label in Name*: su nombre accesible es el texto visible «Buscar»; el estado lo da `aria-expanded`). El `aria-live` anuncia también «Cargando…», «Escribe al menos 2 letras» y «N resultados para «q»» (`buscador.resultadosPara`/`resultadoPara`). Móvil: `max-height` con `100dvh`, `overscroll-behavior: contain` y ajuste por `visualViewport` cuando sale el teclado. Robustez: tras un error de red se espera 3 s antes de reintentar en automático (el botón «Reintentar» es inmediato), un índice sin registros se trata como error y `resolverUrl` rechaza cualquier URL con esquema. En `/va/` el botón se pinta en valenciano desde el primer render (`FALLBACK_VA`). Deep links: `acc.js → abrirPorHash` tolera un hash malformado (`#%`), respeta `prefers-reduced-motion` y, si se pulsa un resultado cuyo hash ya está en la URL, el buscador dispara `hashchange` para reabrir el panel; `:target { scroll-margin-top: 8rem }` global (v4.33.0) evita que los destinos queden bajo la barra.

Botón `button.header__search-toggle` (lupa + «Buscar»; solo icono < 768 px) con `aria-expanded`/`aria-controls`. Panel `div#siteSearch.buscador[role=search]` (`hidden` + `inert` cerrado): etiqueta visible «Buscar en la web», `input[type=search]` con debounce de 150 ms, botón «Borrar» (desde v4.29.1 es un aspa pequeña dentro del campo, a la derecha, visible solo con texto; al pulsarla el panel sigue abierto y el cursor vuelve al campo; la ✕ de la cabecera, «Cerrar buscador», es la única que cierra el buscador y va sin círculo; campo blanco con borde fino y un único anillo de foco, ámbar en modo oscuro), ayuda «Para filtrar los actos… usa el calendario» (diferencia con `#filtro-busqueda` del calendario), `p.buscador__estado[aria-live=polite]` que anuncia solo el recuento, lista `ol.buscador__lista` con título, descripción (≤ 140 caracteres), chips de tipo / sección / ejercicio o fecha / «Pasado», «Mostrar más» de 10 en 10. Teclado: foco al campo al abrir, ↓ desde el campo al primer resultado, ↑/↓ entre resultados, Escape cierra y devuelve el foco al botón; clic fuera cierra (el detector usa `event.composedPath()`, no `panel.contains(e.target)`: los botones de sugerencia, «Mostrar más» y «Reintentar» repintan el cuerpo antes de que llegue el clic a `document`, y el botón pulsado ya no está en el DOM). La consulta se guarda en `sessionStorage.buscadorQuery` y se restaura al reabrir. Abrir el buscador cierra el menú y viceversa.

## Añadir contenido

No hay nada que mantener a mano: una galería, un post o una página nuevos entran solos en el siguiente build. Si una consulta natural no la cubre el título (p. ej. «apuntarme» → Nuevos Falleros), añade la entrada en `search-keywords.json` con el id del registro y ejecuta `npm run build && npm run search:eval`. Para un panel de acordeón nuevo, añade su fila a `SEARCH_SECTIONS` (gulpfile) con el id del `.accordion__content`.

## Casos de aceptación

`npm run search:eval` cubre: «autorización menores», «apuntarme», «llibrets», «ofrenda 2026», «calendari» (UI ES), «cremà», «sant joan», «fallera mayor infantil», «proclamació 2025», «representantes 2024-25», «suissa», «organigrama», «tiempo valencia», «cookies», «paella» (→ San Juan) y, desde v4.33.0, «lucía», «lucia gutierrez», «presidente», «fallera mayor», «pablo cortés», «directiva», «contacto», «email», «instagram», «subvención», «vídeo dron», «fútbol», «pádel», «avís legal»; sin coincidencias «xyz123». y desde v4.34.0 «calendrio», «ofrena», «presidenta», «representantes 2025», «fallas 2027», «fotos», «nuevos fallers». Resultado el 14-sep-2026: 36/36 en el top 3 (objetivo ≥ 80 %).

Pendientes editoriales: traducir al valenciano título y descripción de los eventos de `eventos.json`; **`eventos.json` no tiene actos posteriores al 14-sep-2026**, así que hoy el índice no lleva ningún evento (aparecerán solos al añadirlos); no existe una página de inscripción («apuntarme» lleva a Nuevos Falleros; el formulario «¿Quieres formar parte?» es un modal de la home).

Relevo anual: al cambiar `member` en `schema-organization.json` las personas y las descripciones de los paneles de Nosotros se regeneran solas en el build.

---

Última actualización: 14 de septiembre de 2026 - v4.34.0
