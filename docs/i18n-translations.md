# 🌍 i18n (data-i18n + translations.json)

Esta guía describe el sistema de traducciones del proyecto y los “gotchas” más comunes (JSON inválido por saltos de línea, claves mal puestas y cómo renderizar párrafos).

## ✅ Fuente de verdad

- Fuente: `data/translations.json`
- Artefacto de build: `dist/data/translations.json`

El build copia `data/` a `dist/data/`. En producción se consume `dist/`.

## 🔑 Cómo se enlaza el texto en HTML

En el HTML se usan atributos `data-i18n` con una clave, por ejemplo:

```html
<p class="accordion__texto" data-i18n="falla.nosotros.falleramayoraI.texto"></p>
```

La clave debe existir (por idioma) en `data/translations.json`. Si la clave no coincide, el texto no aparecerá.

## 🧩 Textos con markup (varias claves)

El motor i18n aplica traducciones con `textContent` en elementos con `data-i18n`. Eso significa que si intentas traducir un texto que mezcla contenido y markup (por ejemplo: texto + un `<span>` con estilos), una única clave no puede “reconstruir” ese HTML.

Solución recomendada: **dividir el texto en varios nodos**, con **2 (o más) claves**.

Ejemplo real (etiqueta de PDF en “Archivos”):

```html
<p class="historia__archivo-texto">
  <span data-i18n="historia.archivos.presentacion">Presentación</span>
  <span data-i18n="historia.archivos.fallas2026"> Fallas 2026</span>
</p>
```

Y en `data/translations.json`:

- `es.historia.archivos.presentacion` / `es.historia.archivos.fallas2026`
- `va.historia.archivos.presentacion` / `va.historia.archivos.fallas2026`

## 🧾 Reglas importantes de JSON

### 1) No usar saltos de línea “reales” dentro de strings

En JSON, un string no puede contener saltos de línea sin escapar.

- Incorrecto: texto pegado con Enter dentro del valor.
- Correcto: usar `\\n` (y normalmente `\\n\\n` para separar párrafos).

Ejemplo:

```json
{
  "es": {
    "falla": {
      "nosotros": {
        "ejemplo": {
          "texto": "Párrafo 1\\n\\nPárrafo 2"
        }
      }
    }
  }
}
```

### 2) Ojo con escapes inválidos

Secuencias como `\\V` o cualquier `\\` seguido de una letra no permitida rompen el JSON.

## 🧠 Cómo se renderizan los saltos de línea

HTML colapsa whitespace, así que aunque guardes `\\n`, si el CSS no lo permite se verá como un espacio.

Para el texto del acordeón, se usa:

- `.accordion__texto { white-space: pre-line; }`

Eso hace que `\\n` se muestre como salto de línea real.

## 🧪 Validación rápida

- Si cambias traducciones: ejecuta `npm run build` (actualiza `dist/data/translations.json`).
- Si algo “no se ve”: revisa primero que la clave en `data-i18n` coincide exactamente con la del JSON.

## 🧪 Tests E2E

Hay un test E2E dedicado al sistema de traducciones (idioma por defecto, cambio de idioma y persistencia entre páginas):

- `tests/i18n.e2e.spec.js`

Guía de ejecución: [`e2e-testing.md`](./e2e-testing.md)

---

*Última actualización: 22 de enero de 2026*
