# 📋 Gestión del Tablón de Anuncios

Esta guía describe cómo gestionar el contenido del **Tablón de Anuncios** dinámico que aparece en la sección de "Eventos". El contenido se controla íntegramente desde un archivo JSON, permitiendo actualizar avisos sin modificar el código HTML/JS.

## 📄 Archivo de Datos

El contenido reside en:  
`data/board.json`

## 🛠 Estructura del JSON

El archivo contiene un objeto raíz con un array `notas`. Cada objeto dentro de `notas` representa una nota ("postit") en el tablón.

```json
{
  "notas": [
    {
      "id": "identificador-unico",
      "activo": true,
      "contenido": {
        "es": "Texto en español (soporta HTML)",
        "va": "Text en valencia (suporta HTML)"
      },
      "adjuntos": []
    }
  ]
}
```

### Campos de una Nota

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único (ej: "cita-crida-2026"). Útil para debugging. |
| `activo` | `boolean` | `true` para mostrar la nota, `false` para ocultarla (borrador/histórico). |
| `contenido` | `object` | Objeto con claves de idioma (`es`, `va`). Soporta etiquetas HTML como `<br>` para saltos de línea, `<b>`, `<i>`, etc. |
| `adjuntos` | `array` | Lista de archivos adjuntos (ver abajo). Puede estar vacío `[]`. |

### Adjuntos

Permite enlazar imágenes o PDFs a la nota.

| Campo | Tipo | Valores | Descripción |
|-------|------|---------|-------------|
| `tipo` | `string` | `"img"`, `"pdf"` | Determina el icono que se muestra junto al enlace. |
| `url` | `string` | Ruta relativa | Ruta al archivo (ej: `img/eventos/foto.jpg`). |
| `nombre` | `object` \| `string` | Objeto i18n | Nombre visible del archivo/enlace. Puede ser un string simple o un objeto `{ "es": "...", "va": "..." }`. |

#### Ejemplo con Imagen Adjunta

```json
{
  "tipo": "img",
  "url": "img/eventos/cartel.jpg",
  "nombre": {
    "es": "Ver Cartel",
    "va": "Veure Cartell"
  }
}
```

## 📝 Paso a Paso: Crear una Nueva Nota

1.  Abre el archivo `data/board.json`.
2.  Localiza el array `notas`.
3.  Añade un nuevo objeto al principio del array (para que salga primero) o al final.
4.  Rellena los campos:
    *   **ID:** Dale un nombre único descriptivo.
    *   **Contenido:** Escribe el mensaje. Usa `<br>` si necesitas saltos de línea.
    *   **Activo:** Ponlo en `true`.
5.  **Adjuntos (Opcional):**
    *   Sube el archivo (imagen o PDF) a la carpeta correspondiente (ej: `img/eventos/`).
    *   Añade el objeto en el array `adjuntos` referenciaando la ruta correcta.
6.  Guarda el archivo JSON.
7.  **Despliegue:** Ejecuta `npm run build` para asegurar que el archivo JSON se copia a la carpeta de distribución (aunque Gulp suele copiar los JSONs, es recomendable reconstruir).

## ⚠️ Consejos

*   **Validación:** Asegúrate de que el JSON es válido (sin comas sobrantes al final de listas).
*   **HTML:** No abuses del HTML en el campo contenido. Manténlo simple (`<br>`, `<strong>`).
*   **Enlaces:** Si hay adjuntos, el sistema generará automáticamente enlaces con iconos según el `tipo`.
