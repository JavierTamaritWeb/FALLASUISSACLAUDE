# Manual del Tablón de Anuncios Dinámico

**Version:** 1.0.0
**Última actualización:** 9 de marzo de 2026

## Descripción

El tablón de anuncios es un componente dinámico que carga las notas desde un archivo JSON (`data/board.json`). Esto permite gestionar fácilmente el contenido sin editar HTML directamente.

## Estructura del JSON

```json
{
  "notas": [
    {
      "id": "identificador-unico",
      "activo": true,
      "contenido": {
        "es": "Texto en español con <br> para saltos de línea",
        "va": "Texto en valenciano"
      },
      "adjuntos": [
        {
          "tipo": "pdf",
          "url": "pdf/archivo.pdf",
          "nombre": {
            "es": "Nombre visible ES.pdf",
            "va": "Nom visible VA.pdf"
          }
        },
        {
          "tipo": "img",
          "url": "img/eventos/imagen.jpg",
          "nombre": {
            "es": "Descripción imagen.jpg",
            "va": "Descripció imatge.jpg"
          }
        }
      ]
    }
  ]
}
```

## Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | Sí | Identificador único de la nota |
| `activo` | boolean | No | Si es `false`, la nota no se muestra. Por defecto: `true` |
| `contenido` | object | Sí | Texto de la nota por idioma |
| `contenido.es` | string | Sí | Texto en español (admite HTML como `<br>`) |
| `contenido.va` | string | Sí | Texto en valenciano |
| `adjuntos` | array | No | Lista de archivos adjuntos. Puede estar vacía |
| `adjuntos[].tipo` | string | Sí | Tipo de archivo: `"pdf"` o `"img"` |
| `adjuntos[].url` | string | Sí | Ruta al archivo |
| `adjuntos[].nombre` | object | Sí | Nombre visible por idioma |

## Tipos de notas soportadas

1. **Solo texto**: Sin array `adjuntos` o con array vacío
2. **Texto + 1 imagen**: Un adjunto con `tipo: "img"`
3. **Texto + 1 PDF**: Un adjunto con `tipo: "pdf"`
4. **Texto + múltiples archivos**: Varios adjuntos (se muestran en lista)
5. **Texto + archivos mixtos**: Mezcla de PDFs e imágenes

## Cómo añadir una nueva nota

1. Abrir `data/board.json`
2. Añadir un nuevo objeto al array `notas`:

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

3. Guardar el archivo
4. Ejecutar `npm run build` para copiar a `dist/`

## Cómo añadir una nota con archivo

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

## Cómo archivar/ocultar una nota

**Opción 1:** Cambiar `activo` a `false`:
```json
{
  "id": "nota-antigua",
  "activo": false,
  ...
}
```

**Opción 2:** Eliminar la nota del array (recomendado para notas muy antiguas)

## Cómo añadir múltiples archivos a una nota

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
      "tipo": "pdf",
      "url": "pdf/reglamento_tenis.pdf",
      "nombre": {
        "es": "Reglamento.pdf",
        "va": "Reglament.pdf"
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

## Notas sobre traducciones

- El contenido de la nota (`contenido.es`, `contenido.va`) cambia cuando el usuario cambia el idioma
- Los nombres de archivo (`nombre.es`, `nombre.va`) también se traducen
- Usar emojis es válido y recomendado para destacar el tipo de anuncio: 📌 ⚠️ 🎾 🎳 etc.

## Archivos relacionados

| Archivo | Descripción |
|---------|-------------|
| `data/board.json` | Datos de las notas (editar este archivo) |
| `js/board.js` | Lógica de renderizado dinámico |
| `scss/components/_board.scss` | Estilos del tablón |
| `scss/animaciones/_modo-oscuro.scss` | Estilos modo oscuro |
| `tests/board.e2e.spec.js` | Tests automatizados |

## Verificación

Después de editar `board.json`:

```bash
# Compilar el proyecto
npm run build

# Ejecutar tests del tablón
npx playwright test tests/board.e2e.spec.js

# O ejecutar la smoke suite diaria
npm run test:e2e

# O la suite completa si el cambio se mezcla con layout/tema global
npm run test:e2e:full
```

## Solución de problemas

### Las notas no aparecen

1. Verificar que el JSON es válido (usar un validador JSON online)
2. Verificar que `activo` no es `false`
3. Abrir la consola del navegador y buscar errores
4. Verificar que `board.json` se copió a `dist/data/`

### El idioma no cambia

1. Verificar que tanto `contenido.es` como `contenido.va` están definidos
2. Verificar que los nombres de archivo tienen ambos idiomas

### Los archivos no se abren

1. Verificar que la ruta en `url` es correcta
2. Verificar que el archivo existe en esa ubicación
3. Las rutas son relativas a la raíz del sitio (ej: `pdf/archivo.pdf`)

## Ejemplos de emojis recomendados

- 📌 Anuncio importante
- ⚠️ Aviso urgente
- 📝 Recordatorio
- 🎾 🏓 🎳 🏐 ⚽ Campeonatos deportivos
- 📅 Fecha/evento
- 🎉 Celebración
- ☕ Nota informal
