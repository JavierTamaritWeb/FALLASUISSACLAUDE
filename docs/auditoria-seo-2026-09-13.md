# Auditoría severa de SEO — 13 de septiembre de 2026

**Sitio auditado:** https://fallasuissa.es/ · **Estado inicial:** v4.30.20, commit `76f9a4a`.

**Versión corregida:** 4.30.21. Las evidencias iniciales se conservan para comparar el antes y el después.

**Dictamen:** la infraestructura básica de rastreo funciona, pero hay problemas importantes de rendimiento móvil y de entrega del contenido traducido. Tener canonical, hreflang y JSON-LD sintácticamente correctos no resuelve estos defectos. Se han implementado las correcciones de los 13 grupos descritos. El cierre y la evidencia posterior se registran al final; las métricas de este apartado describen exclusivamente el estado inicial.

## Alcance y evidencia inicial

- Rastreo HTTP de las **60 URL del sitemap principal**, más la página adicional anunciada por un sitemap auxiliar. Las 61 devuelven 200; la adicional declara `noindex`.
- Comprobación de robots.txt, el índice y sus cinco sitemaps, redirecciones HTTP/www, variantes de URL, respuestas 404/410, negociación Markdown y una petición con User-Agent de Googlebot. Esta última comprueba el comportamiento del servidor; no reproduce la infraestructura de Google.
- Análisis del HTML de **67 archivos generados**: metadatos, encabezados, enlaces locales, fragmentos, traducciones y JSON-LD. Los cuerpos descargados de las 61 páginas del rastreo coinciden con sus archivos en `dist/`.
- Comprobación en Chromium móvil de nueve páginas representativas, con sesión nueva y Service Worker bloqueado: portada, dos artículos ES, artículo VA, colaboraciones VA, privacidad VA, llibret VA, galería 1 y Ofrenda. No hubo errores JavaScript ni respuestas HTTP de error en estas nueve navegaciones.
- Lighthouse **12.8.2**, Chrome **153**, perfil móvil simulado, dos ejecuciones de portada y dos del artículo «El alma del barrio». Sesiones nuevas, sin ocultar artificialmente el banner de subvención.
- Las seis imágenes distintas del sitemap de imágenes y las tres páginas envoltorio de PDF responden 200 mediante HEAD.
- `npm run seo:schema-report`: **60 páginas, 0 problemas dentro de las reglas de ese script**. No equivale a una validación completa de resultados enriquecidos de Google.

Evidencia conservada: [inventario de páginas](./auditorias/seo-2026-09-13/paginas.csv), [respuestas HTTP seleccionadas](./auditorias/seo-2026-09-13/http.json), [métricas Lighthouse](./auditorias/seo-2026-09-13/lighthouse.json) y [defectos de contenido](./auditorias/seo-2026-09-13/contenido.json).

No se ha accedido a Search Console, CrUX, analítica, registros de Googlebot ni a una auditoría externa de enlaces. Por tanto, **no se afirma pérdida de posiciones, penalización, cantidad de páginas realmente indexadas ni incumplimiento de Core Web Vitals de usuarios reales**.

## Prioridades

| ID | Prioridad | Hallazgo | Estado |
| --- | --- | --- | --- |
| SEO-01 | Alta | Carga móvil excesiva y LCP muy lento | Carga reducida; LCP de portada todavía alto |
| SEO-02 | Alta | Artículos ES sin texto principal en la respuesta HTML | Corregido en 4.30.21 |
| SEO-03 | Alta | Contenido valenciano incompleto, incluidos tres documentos enteros | Corregido en 4.30.21 |
| SEO-04 | Media | Metadatos idénticos entre ES/VA y texto de schema sin localizar | Corregido en 4.30.21 |
| SEO-05 | Media | Sitemap de noticias con tres publicaciones antiguas | Corregido en 4.30.21 |
| SEO-06 | Media | Sitemap que solicita indexar una página con `noindex` | Corregido en 4.30.21 |
| SEO-07 | Media | Dos representaciones de la portada sin `Vary: Accept` | Corregido en 4.30.21 |
| SEO-08 | Media | Foto editorial con `alt` vacío incluso tras ejecutar JavaScript | Corregido en 4.30.21 |
| SEO-09 | Media | Ofrenda promete galería y vídeo que ya no contiene | Corregido en 4.30.21 |
| SEO-10 | Media | Datos institucionales contradictorios en recursos para agentes | Corregido en 4.30.21 |
| SEO-11 | Baja | Variantes de URL redundantes, mitigadas por canonical | Corregido en 4.30.21 |
| SEO-12 | Baja | Sitemap de imágenes poco representativo y descripciones genéricas | Corregido en 4.30.21 |
| SEO-13 | Baja | Documentación SEO con garantías y cifras desactualizadas | Corregido en 4.30.21 |

La prioridad combina alcance y urgencia de corrección; no representa una penalización comprobada de Google.

## Hallazgos iniciales y criterio de corrección

### SEO-01 — Rendimiento móvil insuficiente

La portada obtiene **61/100 en rendimiento en las dos ejecuciones**, con LCP de **23,06 y 23,04 segundos**, FCP próximo a 3 segundos, CLS 0 y aproximadamente **8,30 MiB transferidos**. El elemento LCP identificado es la imagen del banner de subvención. En la primera ejecución, casi 19,9 segundos corresponden al retraso de presentación de ese elemento; no deben atribuirse todos esos segundos a la descarga de su imagen.

Cinco SVG acumulan aproximadamente **4,72 MiB transferidos**, un 57 % de la carga medida:

| Recurso | Transferencia aproximada |
| --- | ---: |
| `img/logos/logo-virgen.svg` | 1.234 KiB |
| `img/elementos-UXUI/cenefa_sin_fondo.svg` | 1.163 KiB |
| `img/logos/logo-escudo-cutty.svg` | 984 KiB |
| `img/decoracion/falleretaN.svg` | 753 KiB |
| `img/decoracion/falleretaD.svg` | 696 KiB |

Los cinco contienen imágenes raster incrustadas en base64; la extensión SVG no los hace ligeros. Las dos decoraciones de tema claro/oscuro están marcadas `loading="eager"`. También hay recursos que bloquean el renderizado, entre ellos fuentes, CSS y Swiper. Referencias: `src/index.html:225`, `:226`, `:285`, `:1134`, `:1569` y los SVG citados.

El artículo [El alma del barrio](https://fallasuissa.es/blog-anima.html) también presenta problemas de carga y estabilidad. La primera medición obtiene **55/100**, LCP **9,26 segundos** y CLS **0,211**; el LCP es un párrafo del contenido insertado durante la carga. La segunda ejecución y sus valores exactos están en el archivo de métricas. Lighthouse también detecta imágenes sin dimensiones explícitas. Esto justifica revisar conjuntamente fuentes, espacio reservado, aparición del contenido y efectos visuales; no se ha aislado una única causa de todos los desplazamientos.

**Corrección:** optimizar los recursos pesados conservando el aspecto, producir variantes al tamaño de uso, evitar descargas tempranas innecesarias, revisar la cadena de presentación del banner y entregar el artículo desde el HTML. Mantener la regla del proyecto que muestra la subvención en cada visita; ocultarla solo en la medición falsearía el resultado.

**Prueba de cierre:** repetir al menos las mismas mediciones móviles con caché fría, comprobar apariencia y banner, y contrastar después con datos de campo. Las referencias de buena experiencia son LCP ≤2,5 s, CLS ≤0,1 e INP ≤200 ms al percentil 75 de usuarios reales. Lighthouse no mide el INP real del sitio. [Referencia de Google sobre Web Vitals](https://web.dev/articles/vitals).

### SEO-02 — Los artículos españoles dependen de JavaScript para existir como contenido

En [Somni](https://fallasuissa.es/blog-somni.html) y [El alma del barrio](https://fallasuissa.es/blog-anima.html), los contenedores `.blog-detail__content` llegan vacíos. También llegan vacíos entradillas, autores, fechas visibles y textos de tarjetas en el blog y la portada. Referencias: `src/blog-somni.html:160`, `src/blog-anima.html:165`, `:176`, `src/index.html:1345`.

Chromium sí completa los artículos: aproximadamente 387 y 400 palabras en el texto del artículo renderizado, respectivamente. **No es una prueba de que Google no los indexe**: es una dependencia innecesaria de la descarga de traducciones y de una segunda fase de renderizado. El experimento de rendimiento identifica precisamente un párrafo insertado como LCP del artículo.

**Corrección:** incorporar el texto ES a los HTML fuente, manteniendo `data-i18n*` para el cambio de idioma. Esta solución respeta la restricción actual de no activar globalmente el pre-render ES. Si se cambia esa política, hacerlo expresamente en el pipeline y en su documentación.

**Prueba de cierre:** con JavaScript desactivado deben existir el texto completo, el autor, la fecha y los títulos de tarjetas. Con JavaScript activado, comprobar que la traducción sigue funcionando sin duplicar párrafos. Google recomienda pre-renderizar también porque no todos los rastreadores ejecutan JavaScript. [Documentación oficial](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

### SEO-03 — La variante valenciana está incompleta

Se han confirmado tres situaciones diferentes:

1. **15 H1 con una traducción disponible conservan el texto fuente en el HTML VA**, por ejemplo «Calendario» en `/va/calendario.html`, en vez de «Calendari». El listado completo figura en `contenido.json`.
2. El texto largo de HOPE permanece en español en el HTML inicial de `/va/` y `/va/colaboraciones.html`; JavaScript lo corrige posteriormente.
3. El cuerpo de `/va/aviso-legal.html`, `/va/privacidad.html` y `/va/cookies.html` es idéntico al español. Esos cuerpos no tienen las claves necesarias para traducirse en runtime. La navegación traducida y `lang="ca"` no convierten el documento principal en valenciano.

Causa de los dos primeros casos: `gulpfile.js:794` omite cualquier nodo `data-i18n` que contenga etiquetas hijas. Esto omite tanto los `span` de H1 como los párrafos ya escritos de HOPE. Referencias de contenido: `src/calendario.html:131`, `src/colaboraciones.html:200`, `src/index.html:1176`, `src/privacidad.html:94`.

**Corrección:** traducir los cuerpos que faltan en ambos idiomas y procesar estructuras compatibles sin destruir sus hijos. Para H1, situar la clave en el nodo de texto apropiado; para bloques de párrafos, mantener la misma semántica de renderizado en build y runtime. Conservar todos los atributos `data-i18n*`.

**Prueba de cierre:** comparar las 30 variantes, sin JavaScript y tras cargarlo, usando sus claves reales; comprobar párrafos, estructura y H1. No basta con buscar dos frases valencianas en la portada.

Google determina el idioma principalmente por el contenido visible. `lang` y hreflang no sustituyen a una traducción del cuerpo. [Guía oficial para sitios multilingües](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

### SEO-04 — Metadatos sin localización por URL

Los **30 pares ES/VA tienen exactamente el mismo `<title>` y la misma meta description**. Predomina el español; el llibret ya tiene una descripción valenciana compartida. Algunos nombres propios no necesitan cambiar, pero el patrón demuestra que no existe una localización específica de esos campos.

Ejemplo: `/va/blog-anima.html` mantiene «El alma del barrio» en el título y la descripción españoles aunque el cuerpo se traduzca. El `BlogPosting` cambia a `inLanguage="ca-ES"` y a URL VA, pero conserva `headline`, `description` y `articleSection` españoles. `localizeGraph()` cambia identificadores, URL e idioma declarado, no esos textos (`gulpfile.js:450`). La lógica OG cambia URL/locale, no el texto de las tarjetas.

**Corrección:** catálogo de metadatos por página e idioma, usado por el HTML y por los campos editoriales de JSON-LD; localizar también OG/Twitter por coherencia de las vistas previas. No traducir identificadores ni nombres propios sin necesidad.

**Prueba de cierre:** comprobar valores esperados por página, además de presencia de etiquetas. Un `<title>` en otro idioma puede ser sustituido por Google por texto de la página. Las metas duplicadas entre idiomas no prueban una penalización automática. [Guía de títulos de Google](https://developers.google.com/search/docs/appearance/title-link).

### SEO-05 — Sitemap de noticias fuera de su ventana temporal

[`sitemap-news.xml`](https://fallasuissa.es/sitemap-news.xml) declara como noticias publicaciones de **2025-03-01**, **2025-05-25** y **2026-03-01**. Ninguna pertenece a los dos últimos días de la auditoría. Además, `/eventos.html` es un tablón general, no una noticia individual con la publicación declarada.

**Corrección:** retirar el marcado `news:news` de los artículos antiguos, o generar el sitemap con noticias realmente publicadas en las últimas 48 horas. Conservar los artículos históricos en el sitemap ordinario; no cambiarles la fecha para aparentar novedad. Si no hay publicaciones recientes, el sitemap de noticias puede quedar vacío.

**Prueba de cierre:** validar fechas con un reloj controlado y exigir que cada entrada corresponda a una noticia individual. [Reglas de Google para sitemaps de noticias](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap).

### SEO-06 — Señales contradictorias de indexación

[`sitemap-ai-optimized.xml`](https://fallasuissa.es/sitemap-ai-optimized.xml) incluye `/seo/ai-crawl.html` con prioridad 0,9, pero [esa página](https://fallasuissa.es/seo/ai-crawl.html) devuelve `<meta name="robots" content="noindex, nofollow">`.

**Corrección:** retirar esa URL del sitemap destinado a indexación y mantenerla fuera del inventario de páginas indexables. Su carácter de recurso técnico no requiere convertirla en una página de resultados de búsqueda.

**Prueba de cierre:** rastrear la unión de todos los sitemaps anunciados por robots.txt; rechazar URL con noindex, errores o redirecciones. Revisar únicamente `sitemap.xml` deja escapar este caso. Un sitemap debe proponer las URL canónicas que se quieren ver en resultados. [Guía de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### SEO-07 — Negociación de la portada sin separación de caché

`GET /` devuelve HTML; con `Accept: text/markdown` devuelve un documento en inglés titulado «AI Crawling Instructions for WEBFALLASUISSA». En ninguna de esas respuestas aparece `Vary: Accept`. La regla está en `src/.htaccess:300`.

La representación Markdown tampoco es una traducción fiel del contenido de la portada: es una guía general con referencias antiguas a Fallas 2026. **Se ha confirmado la falta de cabecera y la diferencia de contenido; no se ha reproducido una contaminación de caché ni una penalización.**

**Corrección:** mantener la guía en su URL explícita y evitar sustituir la portada, o generar una representación equivalente y añadir correctamente `Vary: Accept` a ambas respuestas, incluidas revalidaciones. Revisar el comportamiento de la caché del alojamiento.

**Prueba de cierre:** solicitar alternativamente HTML/Markdown y verificar contenido, tipo, Vary y caché. [Referencia sobre Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary).

### SEO-08 — La imagen editorial se trata como decorativa

`src/blog-anima.html:171` usa `alt="" data-i18n="blog.anima.imageAlt"` en la fotografía de Federico Trénor. El traductor modifica `textContent`, no `alt`. Se ha comprobado **alt vacío en ES y VA incluso después del renderizado**.

**Corrección:** utilizar `data-i18n-alt` con texto fuente descriptivo. La clave de traducción ya existe. No rellenar los `alt` de imágenes realmente decorativas por este motivo.

**Prueba de cierre:** comprobar el atributo en ambos HTML generados y después del cambio de idioma. La presencia del atributo vacío permite que este defecto semántico escape a verificadores automáticos de accesibilidad/SEO. [Buenas prácticas de imágenes de Google](https://developers.google.com/search/docs/appearance/google-images).

### SEO-09 — Ofrenda anuncia contenido que ha sido retirado

La descripción de [Ofrenda](https://fallasuissa.es/ofrenda.html) promete «Galería de imágenes y vídeo». La página actual solo muestra la foto de la Fallera Mayor y «Próxima Ofrenda». El comentario de `src/ofrenda.html:148` confirma que el vídeo de 2026 se movió a Historia/Archivos/Ofrendas.

**Corrección:** describir la página actual con precisión y añadir un enlace claro al archivo que contiene el vídeo. Si la página debe cubrir la próxima Ofrenda, explicar ese contenido con información confirmada, sin inventar fecha ni programa. Revisar la versión VA y las vistas previas.

**Prueba de cierre:** comprobar que toda promesa concreta del título/description encuentra correspondencia en el cuerpo o en un enlace identificable. Es un desajuste editorial verificable, no una infracción basada en un mínimo arbitrario de palabras.

### SEO-10 — Recursos institucionales contradictorios

`src/seo/ai-crawl.html:52` declara a «José Javier Tamayo Tamayo» como presidente, mientras que la fuente institucional vigente `src/seo/schema-organization.json` declara a «José Santos Quilis». El recurso también conserva representantes antiguos, coordenadas distintas de las del casal y una actualización de agosto de 2025.

**Corrección:** generar estos datos desde la fuente institucional o sustituir los valores cambiantes por enlaces a las páginas vigentes. Separar claramente archivo histórico de información actual.

**Prueba de cierre:** contrastar cargos, comisión, ubicación y ejercicio en todas las superficies públicas, no solo en el JSON-LD. El noindex limita su presencia en Google; el problema restante es la contradicción de un recurso publicado precisamente para agentes, no una penalización demostrada de búsqueda.

### SEO-11 — Consolidación mejorable de variantes

`/index.html`, `/va/index.html`, `/blog` y `/?lang=ca` devuelven 200. Declaran canonical hacia `/`, `/va/`, `/blog.html` y `/`, respectivamente. Por tanto, **la señal de consolidación existe**, pero se mantienen superficies redundantes de rastreo. `http://www.fallasuissa.es/` añade dos saltos 301, pasando antes por HTTPS con www.

**Corrección:** cuando no se necesiten como URL independientes, redirigir permanentemente a la forma canónica y enlazar internamente a ella. Para parámetros de idioma, decidir una correspondencia explícita con la variante real, sin redirigir indiscriminadamente todos los parámetros. El salto inicial de HTTP puede depender del alojamiento, no solo del `.htaccess`.

**Prueba de cierre:** pruebas HTTP sobre un servidor que interprete las reglas reales; el servidor estático de Playwright no valida `.htaccess`. Comprobar ausencia de bucles y conservación de rutas/parámetros necesarios. [Consolidación de URL según Google](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

### SEO-12 — Descubrimiento y descripción de imágenes mejorables

El sitemap de imágenes contiene **9 páginas y 6 imágenes distintas**, principalmente escudo e iconos de interfaz. Las nueve galerías contienen **136 fotografías**, ninguna incluida en ese sitemap. Varias galerías repiten el mismo texto alternativo en todas sus fotos: por ejemplo, las 15 de Apuntà y las 25 de Proclamación.

**Corrección:** generar el inventario de imágenes desde las galerías y priorizar fotografías representativas frente a iconos. Mejorar pies y descripciones cuando exista información real de cada imagen; no inventar identidades.

**Límite del hallazgo:** no equivale a imágenes imposibles de rastrear. En la galería 1, las 15 imágenes ya aparecen con `src` en el DOM antes de pulsar «Siguiente»; también existe `ImageObject` en JSON-LD. El sitemap de imágenes es una mejora adicional, no un requisito universal de indexación.

### SEO-13 — La documentación sobrestima lo demostrado

`docs/google-search-console.md` conserva la cifra de 48 entradas, cuando hay 60, y afirma que el pre-render hace que los rastreadores «dejen de tratarlas como duplicadas». El código solo acredita señales publicadas, no la decisión de canonical de Google. Las pruebas actuales de pre-render tampoco cubren los tres cuerpos legales o todos los metadatos.

**Corrección:** separar arquitectura, evidencia de pruebas y resultados efectivamente observados en Search Console. Actualizar cantidades y registrar las limitaciones del pre-render. Ampliar las guardias con los casos SEO-02, SEO-03 y SEO-04.

## Observaciones que no deben convertirse en falsos errores graves

- **Robots.txt y Lighthouse:** la nota SEO es 92/100 en las mediciones por `Content-Signal`, que Lighthouse 12.8.2 marca como directiva desconocida. El archivo responde 200 y permite rastrear el contenido público. Google ignora líneas no admitidas; este aviso no demuestra que todo robots.txt sea inválido o que bloquee la web. No quitar esa declaración únicamente para obtener 100/100. [Especificación de Google](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).
- **Fechas de sitemaps:** todas las URL principales anuncian 13/09/2026. Hubo cambios globales reales ese día, por lo que no se califican esas fechas como falsas. Sí existe fragilidad de diseño: `gulpfile.js:1525` deriva lastmod del mtime del HTML, no de sus dependencias de contenido, y las variantes con hora fijan `+01:00`. Una traducción o un dato compartido puede cambiar el contenido sin reflejarlo correctamente. Usar fechas editoriales o seguimiento de contenido significativo; no actualizar por cualquier rebuild. Google utiliza lastmod cuando es consistente y verificable. [Guía oficial](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- **Llibret multilingüe:** las dos URL publican la misma edición multilingüe. No se ha contado como una traducción española defectuosa ni como dos versiones verdaderamente localizadas. Conviene decidir si tendrá una sola URL o representaciones distintas antes de alterar canonical/hreflang.
- **Schema:** se han verificado estructura y coherencia de referencias. No se garantiza elegibilidad para resultados enriquecidos. En especial, declarar `VideoObject` para un vídeo de archivo no garantiza posicionar como página de vídeo; requeriría validar su presentación y las reglas específicas del resultado.
- No se ha considerado error la ausencia de `meta keywords`, ni se ha aplicado un límite rígido de caracteres al título/description, ni un mínimo universal de palabras.

## Qué está funcionando

- 60/60 URL del sitemap principal: 200, canonical autoreferencial y enlaces hreflang recíprocos ES/CA/x-default.
- Cero páginas principales con noindex; robots.txt no bloquea los HTML ni sus recursos públicos esenciales.
- Un H1 no vacío por cada página principal. Cero títulos o descripciones duplicados **entre páginas diferentes de ES**.
- Cero enlaces locales a archivos inexistentes y cero fragmentos locales inexistentes en el análisis de los 67 HTML. No incluye validación exhaustiva de destinos externos.
- URL inexistentes ES/VA: 404 real. Plantilla retirada `/base.html` y `/va/base.html`: 410 real.
- HTTPS y host canónico funcionan. Compresión Brotli observada en respuestas de producción.
- Las imágenes declaradas en el sitemap y las páginas PDF comprobadas responden 200.

## Orden de trabajo y prevención

1. **Rendimiento y contenido inicial:** SEO-01/02. Optimizar recursos, entregar texto ES completo, reservar espacio y repetir Lighthouse conservando la UI real.
2. **Idiomas:** SEO-03/04/08. Completar VA y metadatos, comprobar las 60 páginas sin JS y con JS, y preservar estructura/atributos de traducción.
3. **Coherencia pública:** SEO-05/06/07/09/10. Limpiar sitemaps, corregir negociación HTTP y alinear la información publicada.
4. **Mantenimiento:** SEO-11/12/13. Consolidar URL cuando proceda, automatizar imágenes y actualizar documentación.
5. **Validación externa:** después de corregir, inspeccionar en Search Console muestras de portada, artículos, HOPE y legales ES/VA; contrastar canonical seleccionada, HTML renderizado, estado de sitemaps y datos de experiencia. No marcar «resuelto en Google» por pasar las pruebas locales.

Guardias recomendadas: artículo completo sin JS; H1 y párrafos VA correctos; metadatos esperados por idioma; `alt` editorial no vacío; ninguna URL noindex en la unión de sitemaps; noticias ≤48 h; coherencia de representaciones HTTP; presupuesto de transferencia y seguimiento de LCP/CLS en las mismas condiciones.

Para reproducir las métricas de laboratorio:

```bash
npx --yes lighthouse@12.8.2 https://fallasuissa.es/ --only-categories=performance,seo --chrome-flags="--headless" --output=json --output-path=/tmp/falla-seo-home.json --quiet
npx --yes lighthouse@12.8.2 https://fallasuissa.es/blog-anima.html --only-categories=performance,seo --chrome-flags="--headless" --output=json --output-path=/tmp/falla-seo-blog.json --quiet
```

Para reproducir las señales HTTP principales:

```bash
curl -sS -D /tmp/falla-home-headers.txt -o /tmp/falla-home.html https://fallasuissa.es/
curl -sS -H 'Accept: text/markdown' -D /tmp/falla-md-headers.txt -o /tmp/falla-home.md https://fallasuissa.es/
curl -sS https://fallasuissa.es/sitemap-ai-optimized.xml
curl -sS https://fallasuissa.es/seo/ai-crawl.html
curl -sS https://fallasuissa.es/sitemap-news.xml
npm run seo:schema-report
```

Las puntuaciones varían con máquina, navegador y red. Comparar siempre con las condiciones registradas, y conservar evidencia antes y después de cada corrección.


## Correcciones implementadas en 4.30.21

| Hallazgo | Solución y protección contra regresiones |
| --- | --- |
| SEO-01 | 15 SVG con raster incrustado disponen de derivados WebP transparentes, generados por `gulpfile.js` desde `src/data/image-variants.json`: 367.936 bytes en total (presupuesto de prueba: <400.000). Las fotografías de acordeones nunca abiertos aplazan su renderizado; la primera apertura conserva las transiciones posteriores. Swiper y los scripts de inicialización de la portada se difieren; el póster del vídeo de archivo reutiliza el AVIF disponible. El banner se entrega visible desde el HTML y su script se ejecuta inmediatamente después; las pruebas exigen visibilidad sin JavaScript y con Swiper retenido. El HTML anterior dependía de JavaScript para hacer visible el aviso; ahora sigue disponible aunque el script falle. El cierre conserva foco, `inert` y `aria-hidden`, y la excepción de Playwright sigue funcionando. La foto editorial, el banner y los escudos de cabecera/pie reservan sus dimensiones reales. Los escudos de cabecera usan carga inmediata: su ciclo lazy provocaba dos desplazamientos del contenido que sumaban CLS 0,157 incluso con las fuentes ya locales. Se añade guardia para impedir `loading="lazy"` en esos elementos visibles. Las mismas tipografías se sirven localmente con sus licencias OFL y precarga, evitando la conexión adicional a Google Fonts. Se elimina para los escudos la reserva genérica de 200 px de `content-visibility`, que añadía 138 px al pie móvil o 101 px en escritorio. Se actualizan 12 capturas de La Falla, Meteo y Galerías después de revisar que la diferencia corresponde a ese espacio sobrante, y dos capturas móviles del artículo «El alma del barrio» tras revisar sus diferencias de rasterización del texto y la cenefa. Se conservan contenido y estructura; no se amplía la tolerancia de comparación. Las capturas del artículo se fijan en reposo, sin la capa `translate3d` de su entrada: conservaba diferencias intermitentes de suavizado en todos los párrafos. Esta estabilización solo se aplica en el test visual; las suites de reveal y transiciones siguen comprobando el comportamiento real. |
| SEO-02 | Los dos artículos, sus fechas, autores y tarjetas tienen texto ES completo en los HTML fuente. No se activa el pre-render ES global; se conservan las claves de traducción. |
| SEO-03 | Claves de H1 en sus hojas, manteniendo su color anterior; bloques de párrafos compatibles en build/runtime; 143 segmentos de los tres documentos legales traducidos. El texto español se conserva; únicamente se actualiza el apartado de Google Fonts de Cookies para reflejar que las tipografías se sirven localmente. |
| SEO-04 | Catálogo `translations.{es,va}.seo` para 30 páginas. `data-i18n-content` funciona en build y runtime. JSON-LD usa las descripciones localizadas, títulos editoriales y de galerías, y nombres/descripciones de los vídeos. Las pruebas comparan el valor exacto del schema con la meta description y detectan confusiones entre `content` y `data-i18n-content`, además de entidades HTML sin decodificar. |
| SEO-05 | Noticias derivadas de `BlogPosting` con ventana de 48 h; no se incluyen fechas futuras ni inválidas. Actualmente el sitemap está vacío y no figura en el índice. Los artículos históricos siguen en el sitemap normal. Pruebas con reloj controlado. Al publicar noticias nuevas se debe regenerar/desplegar al expirar esa ventana: el alojamiento es estático. |
| SEO-06 | Inventario automático de 60 páginas canónicas indexables. Los dos sitemaps legados replican exactamente el principal; `ai-crawl.html` queda fuera. El generador excluye también HTML residual de páginas retiradas y reconoce `noindex` independientemente del orden de atributos. |
| SEO-07 | La portada siempre sirve HTML; la guía Markdown tiene URL explícita. Apache real verifica ambas peticiones y se comprueba de nuevo en producción. |
| SEO-08 | Texto alternativo descriptivo real y `data-i18n-alt` en la foto de Federico Trénor. Verificado sin JS en ES/VA y al cambiar de idioma. |
| SEO-09 | Descripción ajustada a «Próxima Ofrenda», más enlace al archivo existente de 2026. La prueba sigue el enlace y exige que el vídeo quede visible al abrirse el acordeón. |
| SEO-10 | Guías para agentes sin cargos ni ejercicios desactualizados; enlazan a la información vigente. JSON institucional generado desde `schema-organization.json`, con las mismas coordenadas; retiradas afirmaciones no medidas de rendimiento y accesibilidad. |
| SEO-11 | 301 para `/index.html`, `/va/index.html`, `/blog` y parámetros de idioma admitidos; enlaces internos de Inicio a `./`. Pruebas con Apache sobre las reglas reales para detectar bucles y conservar 404/410. La redirección inicial HTTP→HTTPS impuesta por el alojamiento puede mantener dos saltos en `http://www`; es una mejora menor del proveedor, no una URL duplicada indexable. |
| SEO-12 | Sitemap de imágenes desde JSON-LD, con las 136 fotografías de las nueve galerías. Descripciones bilingües por contexto y posición, conservando las existentes más específicas; no se han inventado identidades ni escenas. Pueden enriquecerse editorialmente con información real de cada foto. |
| SEO-13 | README, AGENTS, CLAUDE y guías de build/despliegue, Search Console, i18n, pruebas y datos estructurados actualizadas. Se eliminan la garantía de que Google haya resuelto duplicados, la cifra obsoleta de 48 páginas y las puntuaciones 95+/100 sin medición del README. Se actualizan el requisito de Node, el repositorio de clonación y las coordenadas institucionales; las notas históricas quedan identificadas como tales. |

Además, `src/data/seo-history.json` conserva la fecha por hash de contenido. Una recompilación sin cambios editoriales no rejuvenece los sitemaps. El watcher ignora su propio historial para evitar bucles; hay que reiniciarlo cuando cambia el pipeline. Durante la auditoría se detectó y detuvo un watcher antiguo que sobrescribía el build con las reglas previas.

Pruebas permanentes: `tests/seo-regressions.e2e.spec.js` (68 casos), `tests/schema-jsonld.e2e.spec.js`, `tests/unit/seo-artifacts.test.cjs` (4 casos) y `tests/unit/seo-http.test.cjs` (Apache real). `npm run seo:verify:production` compara el despliegue con `dist/` y comprueba las señales HTTP. El registro de la auditoría general anterior continúa en [auditoria-2026-09-13.md](./auditoria-2026-09-13.md).

## Validación final

### Comprobaciones de código y navegador

| Comprobación | Resultado |
| --- | --- |
| Build de producción | Correcto, sin claves i18n faltantes |
| Node (`npm run test:unit`) | 22/22 superadas; incluye Apache real |
| Smoke (`npm run test:e2e -- --workers=4`) | 412 superadas, 2 omitidas |
| Matriz E2E completa | 603 casos verificados, 3 omisiones previstas; detalle debajo |
| Suite visual tras estabilizar el artículo | 73/73 superadas; seis repeticiones adicionales del artículo correctas |
| Dependencias (`npm audit --audit-level=high`) | 0 vulnerabilidades |
| Datos estructurados | 60 páginas, 0 problemas en las reglas del verificador |
| Enlaces y fragmentos locales | 67 HTML analizados, 0 destinos inexistentes |
| Búsqueda interna | 14/14 consultas con destino esperado entre los tres primeros; 2/2 sin resultados correctas; 0 destinos rotos |
| Formato del parche | `git diff --check` correcto |

La última ejecución completa terminó con 602 pruebas superadas, 3 omitidas y una captura intermitente de `blog-anima` móvil oscuro. Se corrigió la preparación estática de esa captura; después pasaron los 73 casos visuales y tres repeticiones de cada tema del artículo. En conjunto quedan verificados los 603 casos ejecutables, sin fallos pendientes. Tras el ajuste final del estado inicial del banner pasaron además los 81 casos específicos de banner y SEO. Las omisiones son dos comprobaciones de adjuntos del tablón, que no tiene anuncios activos, y una comprobación exclusiva de WebKit ejecutada en la matriz Chromium. No se presentan como pruebas superadas.

### Publicación y mediciones posteriores

- **Commits funcionales:** `c6942e5` (auditoría) y `f3cd6a6` (banner visible sin JavaScript), subidos a `origin/main` y desplegados por SSH en `domains/fallasuissa.es/public_html/` el 13/09/2026. Sin borrados anunciados en el ensayo previo; producción responde 200.
- **Verificación posterior:** `npm run seo:verify:production` confirma las 60 páginas idénticas al build y **133 respuestas** correctas. Incluye CSS/JS con sus URL versionadas, traducciones, fuentes, derivados de imagen, sitemaps, guías institucionales, portada con `Accept: text/markdown`, 301 canónicas y errores reales 404/410. [Registro completo](auditorias/seo-2026-09-13/produccion-despues.json).
- **Mediciones comparables:** Lighthouse 12.8.2, Chrome 153, móvil simulado y sesiones nuevas, dos ejecuciones por página, con el banner real visible. [Resultados posteriores](auditorias/seo-2026-09-13/lighthouse-despues.json). Los JSON iniciales se conservan separados.

| Página y métrica | Antes (dos ejecuciones) | Después (dos ejecuciones) |
| --- | --- | --- |
| Portada: rendimiento | 61 / 61 | 68 / 68 |
| Portada: LCP | 23,06 / 23,04 s | 7,73 / 7,83 s |
| Portada: transferencia | 8,30 / 8,30 MiB | 1,43 / 1,43 MiB |
| Portada: CLS | 0 / 0 | 0 / 0 |
| Artículo «El alma del barrio»: rendimiento | 55 / 55 | 93 / 92 |
| Artículo: LCP | 9,26 / 9,35 s | 2,89 / 2,92 s |
| Artículo: transferencia | 1,43 / 1,43 MiB | 0,37 / 0,37 MiB |
| Artículo: CLS | 0,211 / 0,211 | 0,079 / 0 |
| Nota SEO de Lighthouse 12.8.2 | 92 en las cuatro ejecuciones | 92 en las cuatro ejecuciones |

La portada reduce aproximadamente **un 83 % la transferencia** y **un 66 % el LCP**; el artículo reduce aproximadamente un 69 % el LCP. El ajuste posterior que entrega el banner visible sin JavaScript elimina esa dependencia de contenido; no produjo una mejora adicional consistente del LCP en producción. **La portada sigue teniendo un LCP alto**, y el artículo queda ligeramente por encima de la referencia de 2,5 s de laboratorio. SEO-01 queda mejorado, no cerrado como cumplimiento de Core Web Vitals. La nota SEO 92 permanece por la directiva `Content-Signal` descrita anteriormente; ese verificador no mide todos los defectos de contenido corregidos.

### Seguimiento pendiente y límites

- Optimización adicional del LCP de portada, sin ocultar el banner obligatorio ni alterar las mediciones. No se presenta una puntuación alta de laboratorio como alcanzada.
- Comprobar en Search Console las canonical seleccionadas, la indexación y los sitemaps; contrastar LCP/INP/CLS con datos de usuarios reales. No se dispone de acceso a esos datos en esta auditoría.
- La doble redirección inicial de `http://www` depende en parte del alojamiento; las variantes HTML y de idioma comprobadas se consolidan con 301.
- Las descripciones de las galerías se pueden enriquecer cuando exista información editorial real de cada fotografía.

No se afirma que Search Console haya cambiado la indexación ni que los usuarios reales cumplan los umbrales de Core Web Vitals.
