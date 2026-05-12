# 📋 Gestión del Tablón de Anuncios

Esta es la guía canónica del tablón dinámico. El contenido se edita en un JSON y se renderiza en la home y en la página de eventos sin tocar el HTML de cada página.

## 📍 Dónde aparece y qué lo pinta

- datos: `src/data/board.json`
- textos genéricos del componente: `src/data/translations.json` (`board.empty`, labels accesibles de adjuntos)
- renderizado: `src/js/board.js`
- estilos: `src/scss/components/_board.scss`
- páginas que lo muestran: `index.html` y `eventos.html`
- tests: `tests/board.e2e.spec.js`

## 🧱 Estructura del archivo

El JSON tiene un objeto raíz con un array `notas`.

```json
{
  "notas": [
    {
      "id": "identificador-unico",
      "activo": true,
      "imagen": {
        "url": "img/eventos/cartel.jpg",
        "alt": {
          "es": "Texto alternativo en español",
          "va": "Text alternatiu en valencià"
        }
      },
      "contenido": {
        "es": "Texto en español con <br> para saltos de línea",
        "va": "Text en valencià amb <br> per a salts de línia"
      },
      "adjuntos": []
    }
  ]
}
```

### Campos de cada nota

| Campo | Tipo | Requerido | Descripción |
| ------- | ------ | ----------- | ------------- |
| `id` | `string` | Sí | Identificador único y estable. Útil para localizar una nota concreta. |
| `activo` | `boolean` | No | Si es `false`, la nota queda oculta sin necesidad de borrarla. |
| `imagen` | `object` | No | Imagen embebida visible dentro de la nota (cartel, infografía…). Si se omite, la nota no muestra imagen embebida. |
| `imagen.url` | `string` | Sí (si hay `imagen`) | URL desde la raíz pública del sitio (la usa el `<img src="…">` del render), p. ej. `img/eventos/cartel.jpg` — la imagen vive en `src/img/eventos/cartel.jpg`. |
| `imagen.alt` | `object` o `string` | No | Texto alternativo accesible. Se recomienda objeto bilingüe `{ "es": "...", "va": "..." }`. |
| `contenido` | `object` | Sí | Texto de la nota por idioma. Debe incluir `es` y `va`. |
| `contenido.es` | `string` | Sí | Texto en español. |
| `contenido.va` | `string` | Sí | Texto en valenciano. |
| `adjuntos` | `array` | No | Lista de archivos vinculados. Puede omitirse o dejarse vacía. |

### Campos de cada adjunto

| Campo | Tipo | Requerido | Valores | Descripción |
| ------- | ------ | ----------- | --------- | ------------- |
| `tipo` | `string` | Sí | `"pdf"`, `"img"` | Controla icono, copy accesible y presentación del enlace. |
| `url` | `string` | Sí | URL relativa | URL desde la raíz pública del sitio (la consume el `<a href="…">` o `<img src="…">` del render). Por ejemplo `pdf/bases.pdf` o `img/eventos/cartel.jpg` — los archivos viven en `src/pdf/` y `src/img/`. |
| `nombre` | `object` o `string` | Sí | Texto | Nombre visible. Se recomienda objeto bilingüe `{ "es": "...", "va": "..." }`. |

### Validación efectiva del render

El render actual filtra adjuntos inválidos antes de pintar la nota.

Un adjunto solo se considera válido si:

- `tipo` es `pdf` o `img`
- `url` contiene una ruta no vacía
- `nombre` aporta texto útil, ya sea como string o como objeto bilingüe con contenido real

Consecuencia práctica:

- si una nota mezcla adjuntos válidos e inválidos, solo se muestran los válidos
- si todos los adjuntos se descartan, la nota se degrada a nota simple en lugar de dejar iconos o enlaces vacíos

## 🧾 Tipos de nota soportados hoy

1. Solo texto.
2. Texto con una imagen embebida (`imagen`).
3. Texto con un PDF.
4. Texto con varios archivos.
5. Texto con mezcla de PDFs e imágenes.
6. Texto con imagen embebida + adjunto descargable (combinable con `imagen` y `adjuntos` a la vez).

### Diferencia entre `imagen` y `adjuntos[].tipo: "img"`

- `imagen` (campo de la nota): se renderiza como `<figure class="board__figure"><img class="board__image">` **dentro** del article, visible directamente. Útil para carteles o infografías que aportan información clave.
- `adjuntos[]` con `tipo: "img"`: se renderiza como un enlace tipo "Ver imagen" que abre el archivo en otra pestaña. No se muestra inline.

Pueden combinarse: imagen visible en la nota + enlace "Ver cartel completo" para abrirlo a tamaño real (ver ejemplo más abajo).

## ✍️ Flujo recomendado para añadir o editar una nota

1. Abre `src/data/board.json`.
2. Localiza el array `notas`.
3. Añade una nota nueva al principio si quieres priorizarla visualmente.
4. Define un `id` descriptivo y estable, por ejemplo `crida-2026-cambio-hora`.
5. Rellena `contenido.es` y `contenido.va`.
6. Añade `adjuntos` solo si el archivo ya existe en la ruta pública correcta.
7. Usa `activo: false` si quieres archivarla sin borrarla.
8. Ejecuta verificación local antes de publicar.

### Ejemplo: nota simple

```json
{
  "id": "nueva-nota-2026",
  "activo": true,
  "contenido": {
    "es": "📌 AVISO<br>Texto del anuncio en español",
    "va": "📌 AVÍS<br>Text de l'anunci en valencià"
  },
  "adjuntos": []
}
```

### Ejemplo: nota con un PDF

```json
{
  "id": "nota-con-pdf",
  "activo": true,
  "contenido": {
    "es": "📌 DOCUMENTO IMPORTANTE<br>Bases del campeonato",
    "va": "📌 DOCUMENT IMPORTANT<br>Bases del campionat"
  },
  "adjuntos": [
    {
      "tipo": "pdf",
      "url": "pdf/bases_campeonato.pdf",
      "nombre": {
        "es": "Bases Campeonato.pdf",
        "va": "Bases Campionat.pdf"
      }
    }
  ]
}
```

### Ejemplo: nota con imagen embebida + enlace al cartel completo

```json
{
  "id": "presentacion-candidaturas-2026",
  "activo": true,
  "imagen": {
    "url": "img/eventos/presentacion-candidaturas-2026.jpg",
    "alt": {
      "es": "Cartel de la Presentación de Candidaturas 2026-2027",
      "va": "Cartell de la Presentació de Candidatures 2026-2027"
    }
  },
  "contenido": {
    "es": "📌 ANUNCIO <br> 24-04-2026 al 03-05-2026<br>📝 Cita<br> Presentación de Candidaturas 2026-2027 a Representantes",
    "va": "📌 ANUNCI <br> 24-04-2026 al 03-05-2026<br>📝 Cita<br> Presentació de Candidatures 2026-2027 a Representants"
  },
  "adjuntos": [
    {
      "tipo": "img",
      "url": "img/eventos/presentacion-candidaturas-2026.jpg",
      "nombre": {
        "es": "Ver cartel completo",
        "va": "Veure cartell complet"
      }
    }
  ]
}
```

### Ejemplo: nota con varios archivos

```json
{
  "id": "nota-multiples-archivos",
  "activo": true,
  "contenido": {
    "es": "📌 CAMPEONATO DE TENIS<br>Documentación completa",
    "va": "📌 CAMPIONAT DE TENNIS<br>Documentació completa"
  },
  "adjuntos": [
    {
      "tipo": "pdf",
      "url": "pdf/bases_tenis.pdf",
      "nombre": {
        "es": "Bases Tenis.pdf",
        "va": "Bases Tennis.pdf"
      }
    },
    {
      "tipo": "img",
      "url": "img/eventos/cartel_tenis.jpg",
      "nombre": {
        "es": "Cartel.jpg",
        "va": "Cartell.jpg"
      }
    }
  ]
}
```

## ⚠️ Reglas y precauciones

- Mantén siempre ambos idiomas. Aunque un texto sea casi idéntico, define `es` y `va`.
- El contenido de cada nota sigue viviendo en `src/data/board.json`; solo el copy genérico del componente debe ir a `src/data/translations.json`.
- El contenido admite HTML simple como `<br>` o `<strong>`, pero úsalo con moderación.
- No pegues HTML de terceros ni contenido no confiable: el renderizado actual inserta `contenido` como HTML en el DOM.
- Las rutas de `adjuntos[].url` y `imagen.url` son relativas a la raíz del sitio público.
- No uses adjuntos placeholder con `url`, `nombre` o `tipo` vacíos: el render los ignorará.
- Si un archivo no existe, el enlace se generará igual, pero llevará a un 404.
- Si quieres retirar una nota sin perder historial, usa `activo: false`.
- Para que el JSON-LD `Schema.org Event` se inyecte correctamente desde la nota, mantén el patrón `📝 Cita<br> NombreEvento` y una fecha en formato `DD-MM-YYYY` (opcional `HH:mm`). El gulpfile extrae nombre, descripción y `startDate` desde ahí.
- Las nuevas imágenes que añadas a `src/img/eventos/` (u otra subcarpeta de `src/img/`) se procesan automáticamente a WebP/AVIF al ejecutar `npm run build` (Sharp). Aun así, `imagen.url` debe apuntar al JPG/PNG original; el navegador descargará ese archivo.

## ✅ Verificación recomendada

```bash
# Reconstruir dist/
npm run build

# Probar solo el tablón
npx playwright test tests/board.e2e.spec.js

# Smoke suite diaria
npm run test:e2e
```

Ejecuta además `npm run test:e2e:full` si el cambio del tablón se mezcla con layout, tema o navegación.

## 🧪 Qué validan los tests del tablón

`tests/board.e2e.spec.js` cubre:

- carga de notas desde `src/data/board.json`
- presencia del contenedor `#notesBoard`
- renderizado de notas con y sin adjuntos
- filtrado de adjuntos inválidos y degradación a nota simple cuando corresponde
- accesibilidad básica (`role="article"`, `aria-hidden`, `aria-label`)
- comportamiento responsive
- re-renderizado cuando cambia el idioma
- convivencia con modo oscuro

## 🛠 Troubleshooting

### Las notas no aparecen

1. Comprueba que el JSON es válido.
2. Verifica que la nota no tenga `activo: false`.
3. Asegúrate de haber ejecutado `npm run build`.
4. Revisa en `dist/data/board.json` si el archivo actualizado se copió correctamente.

### El idioma no cambia

1. Comprueba que existen `contenido.es` y `contenido.va`.
2. Si hay adjuntos con nombre traducible, revisa también `nombre.es` y `nombre.va`.

### Los adjuntos no se abren

1. Comprueba que `url` apunta a una ruta pública real.
2. Confirma que el archivo existe en `src/img/` o `src/pdf/` antes de hacer build.

### La nota se renderiza sin adjuntos

1. Revisa que cada adjunto use `tipo: "pdf"` o `tipo: "img"`.
2. Comprueba que `url` no esté vacía ni contenga solo espacios.
3. Si `nombre` es un objeto, verifica que `nombre.es` y/o `nombre.va` tengan texto real.
4. Recuerda que el render ignora adjuntos inválidos y deja la nota como texto simple si no queda ninguno válido.

### La imagen embebida no se ve / sale translúcida

1. Confirma que `imagen.url` apunta a un archivo existente y la ruta es relativa a la raíz pública.
2. La regla global `img[loading="lazy"]` en `_seo.scss` aplica `background: #f5f5f5` y `content-visibility: auto`. Para `.board__image` ya hay un override (`background: transparent; content-visibility: visible`) en `_board.scss`. Si añades un nuevo bloque que use imágenes embebidas, replica ese patrón.
3. Las notas del tablón están excluidas del fade-in de scroll-reveal mediante un override en `_board.scss` (`html.has-scroll-reveal .board .reveal { opacity: 1; ... }`) porque el `IntersectionObserver` con threshold 0.15 + rootMargin -10% bottom puede no disparar para notas grandes con cartel embebido. No quites ese override sin probar.

### El botón "Ver imagen / Descargar" se ve raro en modo oscuro

`src/scss/animaciones/_modo-oscuro.scss` define overrides específicos para `.board__file-link` (fondo `$gris-muy-oscuro`, borde sutil) y deja el `.board__file-name` con fondo transparente para que no aparezca una caja gris embebida en una tarjeta blanca. Si tocas estos estilos, mantén la coherencia.

## 🔗 Relacionado

- [`e2e-testing.md`](./e2e-testing.md): estrategia de pruebas Playwright
- [`i18n-translations.md`](./i18n-translations.md): claves bilingües y sistema de idioma

---

Última actualización: 4 de mayo de 2026 - v4.6.18
