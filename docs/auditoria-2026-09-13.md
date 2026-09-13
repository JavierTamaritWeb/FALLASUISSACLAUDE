# Auditoría de errores — 13 de septiembre de 2026

Versión corregida: **4.30.20**. Revisión del código, compilación, dependencias, navegación e idioma, documentos incrustados, caché, servidor local y herramientas de despliegue. Las correcciones se hicieron en las fuentes; `dist/` se regeneró con Gulp.

## Registro y prevención

La gravedad describe el impacto en este proyecto. «Alta» no significa necesariamente una vulnerabilidad explotable desde Internet; las herramientas de compilación y el servidor de pruebas se ejecutan localmente.

| ID | Gravedad | Error y causa | Corrección y protección |
| --- | --- | --- | --- |
| AUD-01 | Alta | Sharp 0.33.5 incluía bibliotecas nativas afectadas por los avisos GHSA-f88m-g3jw-g9cj y GHSA-rgj7-g3m4-5g8c. | Actualizado a 0.35.4 con lockfile. `npm audit` y prueba de conversión PNG/JPEG → WebP/AVIF en `tests/unit/build.test.cjs`. |
| AUD-02 | Alta | Una fuente Sass o JS inválida podía finalizar con código 0: se ocultaban errores de Sass y se observaba solo el último stream de una cadena. | `stream/promises.pipeline` conecta todas las etapas y propaga sus errores. Pruebas negativas de Sass/Terser y positiva de escritura completa en `tests/unit/build.test.cjs`. |
| AUD-03 | Media | `npm run dev` copiaba el JSON o JS cambiado, pero no regeneraba HTML VA, índice, esquema ni hashes; el esquema global permanecía en memoria. | Una cola de build completo, observando también las páginas standalone, e invalidación del esquema en cada ejecución HTML. Prueba con proyecto temporal en `tests/unit/watch.test.cjs`. |
| AUD-04 | Alta | Los tres wrappers PDF usaban `<object>`, pero la CSP declaraba `object-src 'none'`. Además, `frame-src` excluía los documentos propios. | Ambas directivas permiten `'self'`; se conserva Drive como origen de iframe permitido. Regresión de CSP en navegador, con autorización del documento propio y bloqueo de uno externo. |
| AUD-05 | Media | Al volver con un idioma guardado, el contenido cambiaba pero `<html lang>` conservaba el idioma del archivo. Valores de almacenamiento inválidos se aceptaban como idiomas. | Validación de los cuatro idiomas soportados, sincronización de `<html lang>` al iniciar y coherencia con `initTranslations.js`. Tres casos ES/VA/valor inválido en `tests/audit-regressions.e2e.spec.js`. |
| AUD-06 | Media | Una clave de traducción ausente sustituía el texto o atributo de reserva por el nombre técnico de la clave. | Solo se escribe una traducción resuelta de tipo cadena; se conserva el contrato público de `translate()` para los componentes dinámicos. Regresión de texto y atributo `title`. |
| AUD-07 | Media | Un `SecurityError` al leer `localStorage` interrumpía toda la inicialización del tema, incluidos iconos y ajustes iOS. | La lectura se captura por separado y se continúa en modo claro. Regresión con almacenamiento bloqueado. |
| AUD-08 | Alta | Tras fallar la descarga del SDK de EmailJS, el siguiente intento esperaba el evento `load` de una etiqueta que ya había fallado; el formulario podía quedar esperando indefinidamente. | Se retira la etiqueta fallida y sus listeners para permitir una nueva petición. Regresión con primer intento abortado y segundo correcto; no se envían correos. |
| AUD-09 | Media | Escape en el botón de cierre del lightbox lo ocultaba desde el controlador genérico antes de ejecutar el cierre propio; quedaban el scroll bloqueado y el foco sin restaurar. | El controlador del visor gestiona todo el cierre, devuelve foco antes de `aria-hidden` y evita enfocar un visor ya cerrado. Regresión dedicada y prueba existente de Historia/Ofrendas. |
| AUD-10 | Alta | La portada precargada tenía prioridad sobre la red. Los assets precargados se leían desde una caché, pero se actualizaban en otra, manteniendo la copia antigua visible. Las escrituras podían quedar sin esperar. | HTML siempre con prioridad de red; lecturas/escrituras en la misma caché; tareas en segundo plano protegidas con `waitUntil`; errores de cuota controlados; peticiones Range fuera de la caché. Pruebas de portada, actualización de CSS y cuota en `tests/unit/service-worker.test.cjs`. |
| AUD-11 | Media | Activar o limpiar el service worker eliminaba todas las cachés ajenas del mismo origen. | Limpieza limitada a los prefijos `falla-suissa-` y `falla-critical-`, manteniendo las versiones activas. Regresión con una caché de otra aplicación. |
| AUD-12 | Media | El servidor local se caía con una URL mal codificada y permitía leer un directorio hermano con el mismo prefijo o un destino externo mediante symlink. | Decodificación protegida, validación de la ruta relativa y de su destino real, control de errores de lectura y puerto efímero correctamente informado. Tres regresiones en `tests/unit/serve-dist.test.cjs`. Solo afecta al servidor local, no al Apache de producción. |
| AUD-13 | Alta | `--dry-run --maintenance on` ejecutaba SSH y creaba el centinela real. Un dry-run de despliegue también podía crear el directorio remoto. | Cortocircuito de mantenimiento simulado; comprobación SSH previa de solo lectura; creación del destino después de confirmar y solo fuera de dry-run. Regresiones con ejecutables SSH/rsync simulados. |
| AUD-14 | Media | `curl -f` consideraba fallo el HTTP 503 esperado y concatenaba `503000`; otras verificaciones de mantenimiento fallidas terminaban con código 0. | Lectura del estado HTTP sin `-f`, código de transporte separado y salida no cero en verificaciones fallidas. El fallo de inyección de token también detiene el script. Regresiones de mantenimiento en `tests/unit/deploy.test.cjs`. |
| AUD-15 | Media | `deploy.env` sobrescribía las variables exportadas, contrario al contrato documentado, pudiendo seleccionar otro destino. | Conservación de los valores exportados al cargar el archivo. Regresión con dos hosts ficticios distintos. |

## Validación

- **Situación inicial:** build correcto; batería completa con 526 pruebas superadas, 1 fallo de foco en Historia/Ofrendas y 3 omitidas. Los casos nuevos reprodujeron fallos adicionales que no cubría esa batería.
- **Pruebas añadidas:** 17 de Node y 8 de navegador; las de navegador están incluidas en smoke y full. Playwright excluye `tests/unit/` para evitar ejecutar el runner de Node durante el descubrimiento.
- **Resultados finales:** `npm run build` correcto; **17/17 pruebas Node** superadas; **344 smoke superadas y 2 omitidas**; **535 E2E completas superadas y 3 omitidas**, incluidas las comparaciones visuales. Cero fallos en las baterías finales. `git diff --check` y las comprobaciones de sintaxis también correctos.
- **Buscador:** 14/14 consultas con destino en los tres primeros resultados, 2/2 consultas sin coincidencias correctas y 0 destinos rotos.
- **JSON-LD:** 60 páginas comprobadas, 0 con problemas.
- **Integridad de recursos:** 67 archivos HTML de ES/VA y wrappers, CSS y rutas de imágenes/PDF en JSON, sin referencias locales inexistentes ni IDs duplicados. No comprueba la disponibilidad de servicios externos.
- **Omisiones previstas:** dos pruebas requieren notas activas con adjuntos en el tablón, ausentes en los datos actuales; otra requiere WebKit para emular iPhone y se omite en la ejecución predeterminada con Chromium.
- **Dependencias después de actualizar:** 0 vulnerabilidades notificadas por npm en la fecha de la auditoría.

## Repetir la comprobación

```bash
npm run audit:project
```

Compila, ejecuta las pruebas de Node, la batería E2E completa y consulta npm. Requiere acceso de red para npm/CDN y permisos para abrir los puertos locales de Playwright. También están disponibles:

```bash
npm run test:unit
npm run test:e2e
npm run test:e2e:full
npm run search:eval
npm run seo:schema-report
```

Las pruebas del despliegue usan una copia temporal del script, configuración ficticia y sustitutos de `ssh`, `rsync` y `curl`. **No se ejecutó un despliegue ni se modificó el mantenimiento de producción.** Las pruebas del SDK de correo interceptan la descarga y no llaman al servicio de envío.

## Límites y referencias

Esta revisión no demuestra ausencia absoluta de errores. La CSP se aplica como cabecera en un navegador de prueba; no se ha comprobado un Apache remoto. Chromium headless-shell carece de visor PDF integrado, por lo que la guardia usa un documento HTML en el `<object>` real para probar las directivas de seguridad. Los enlaces de descarga PDF permanecen intactos. La disponibilidad real de EmailJS, OpenWeather y Drive depende de servicios y configuración externos.

No se registra automáticamente un nuevo service worker: los cambios en `sw.js` corrigen el comportamiento del archivo publicado para clientes que ya lo utilicen. Se sincronizó su versión de caché con `package.json`/`package-lock.json`.

Sharp 0.35.4 requiere Node.js 20.9 o superior; se validó con Node.js 22.13. La API de conversión utilizada por el proyecto pasó las pruebas de WebP/AVIF. Referencias: [release de Sharp 0.35.4](https://github.com/lovell/sharp/releases/tag/v0.35.4), [aviso libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) y [aviso libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).

Los contratos de las correcciones se contrastaron con la [documentación de pipeline de Node.js](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback), [object-src de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/object-src) y [waitUntil de MDN](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil).
