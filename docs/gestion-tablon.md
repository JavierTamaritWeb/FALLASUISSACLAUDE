# 📋 Gestión del Tablón de Anuncios

Esta es la guía canónica del tablón dinámico. El contenido se edita en un JSON y se renderiza en la home y en la página de eventos sin tocar el HTML de cada página.

## 📍 Dónde aparece y qué lo pinta

- datos: `data/board.json`
- renderizado: `js/board.js`
- estilos: `scss/components/_board.scss`
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
| `contenido` | `object` | Sí | Texto de la nota por idioma. Debe incluir `es` y `va`. |
| `contenido.es` | `string` | Sí | Texto en español. |
| `contenido.va` | `string` | Sí | Texto en valenciano. |
| `adjuntos` | `array` | No | Lista de archivos vinculados. Puede omitirse o dejarse vacía. |

### Campos de cada adjunto

| Campo | Tipo | Requerido | Valores | Descripción |
| ------- | ------ | ----------- | --------- | ------------- |
| `tipo` | `string` | Sí | `"pdf"`, `"img"` | Controla icono, copy accesible y presentación del enlace. |
| `url` | `string` | Sí | Ruta relativa | Ruta desde la raíz pública, por ejemplo `pdf/bases.pdf` o `img/eventos/cartel.jpg`. |
| `nombre` | `object` o `string` | Sí | Texto | Nombre visible. Se recomienda objeto bilingüe `{ "es": "...", "va": "..." }`. |

## 🧾 Tipos de nota soportados hoy

1. Solo texto.
2. Texto con una imagen.
3. Texto con un PDF.
4. Texto con varios archivos.
5. Texto con mezcla de PDFs e imágenes.

## ✍️ Flujo recomendado para añadir o editar una nota

1. Abre `data/board.json`.
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
- El contenido admite HTML simple como `<br>` o `<strong>`, pero úsalo con moderación.
- No pegues HTML de terceros ni contenido no confiable: el renderizado actual inserta `contenido` como HTML en el DOM.
- Las rutas de `adjuntos[].url` son relativas a la raíz del sitio público.
- Si un archivo no existe, el enlace se generará igual, pero llevará a un 404.
- Si quieres retirar una nota sin perder historial, usa `activo: false`.

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

- carga de notas desde `data/board.json`
- presencia del contenedor `#notesBoard`
- renderizado de notas con y sin adjuntos
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
2. Confirma que el archivo existe en `img/` o `pdf/` antes de hacer build.

## 🔗 Relacionado

- [`e2e-testing.md`](./e2e-testing.md): estrategia de pruebas Playwright
- [`i18n-translations.md`](./i18n-translations.md): claves bilingües y sistema de idioma
- [`MANUAL_TABLON.md`](./MANUAL_TABLON.md): alias histórico que redirige a esta guía

---

Última actualización: 13 de marzo de 2026 - v4.2.16
