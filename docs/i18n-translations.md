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

## 🪶 Renderizado por párrafos reales

Cuando un bloque necesita tipografía de párrafo real, justificado y sangría elegante, `white-space: pre-line` no basta. En ese caso el proyecto usa un contenedor con `data-i18n-format="paragraphs"` y el motor i18n divide la traducción por saltos de línea para crear varios `<p>`.

Ejemplo real del bloque HOPE:

```html
<div class="colaboraciones-page__texto"
  data-i18n="colaboraciones.hope.texto"
  data-i18n-format="paragraphs"></div>
```

Comportamiento actual en `js/lang.js`:

- detecta `data-i18n-format="paragraphs"`
- separa el string por una o más secuencias `\n`
- limpia bloques vacíos y caracteres de control residuales
- crea un `<p>` por bloque usando `textContent`

Úsalo cuando necesites:

- varios párrafos semánticos reales
- `text-indent` por párrafo
- control visual fino con `p + p`, `hyphens` o `text-align: justify`

No lo uses si solo necesitas un salto de línea simple dentro de un texto corto; en esos casos sigue siendo más barato resolverlo con CSS y `white-space`.

## 🔄 Contenido dinámico + i18n

Hay componentes donde el nodo necesita una traducción base, pero el contenido final lo completa JavaScript con datos dinámicos.

Caso real actual:

- `#current-feels-like` en meteo / portada

Ese nodo no debe ser sobrescrito por `lang.js` con solo `Sensación`, porque `js/meteo.js` compone el texto completo (`Sensación: 26°C`).

Para esos casos, usa este patrón:

```html
<p id="current-feels-like"
  data-i18n="meteo.sensacion"
  data-i18n-dynamic="true">Sensación: --°C</p>
```

Comportamiento actual:

- `data-i18n` sigue declarando la clave semántica del nodo.
- `data-i18n-dynamic="true"` le dice a `lang.js` que no reemplace su `textContent` automáticamente.
- El módulo dueño del componente rellena luego el texto final.

Úsalo cuando el HTML necesite:

- una etiqueta traducida
- más un valor dinámico renderizado por JS
- sin que el motor global de i18n machaque el resultado final

No lo uses en bloques estáticos normales, porque ahí sí conviene que `lang.js` mantenga el control completo.

## 📣 Evento `translationsReady`

`lang.js` emite `translationsReady` cuando:

- ya cargó `data/translations.json`
- conoce el idioma activo
- ya aplicó `updateTranslations()` sobre el DOM

Esto es útil para módulos que se cargan antes que `lang.js` o que dependen de `translate(key)` en su primer render.

Ejemplo de uso:

```javascript
document.addEventListener('translationsReady', () => {
  // Render seguro dependiente de i18n
});
```

O bien, como hace ahora `js/meteo.js`, esperando explícitamente a que el idioma esté listo antes de pintar el primer estado.

## 🛟 Fallback cuando `translate()` devuelve la key

Si un módulo llama a `translate('meteo.min')` demasiado pronto, el motor devolverá la propia key (`meteo.min`).

Regla práctica actual para componentes dinámicos:

- si `translate(key) === key`, usa un fallback local legible
- no pintes la key cruda en UI final

Esto evita textos rotos y también evita cambios de altura inesperados en tests visuales.

## 🤝 Caso HOPE

El bloque HOPE de `index.html` y `colaboraciones.html` combina dos piezas:

- `js/lang.js` renderiza `colaboraciones.hope.texto` como párrafos reales
- `scss/components/_colaboraciones.scss` alinea el copy con el ancho útil del mosaico de 3 columnas en desktop y mantiene una sangría más contenida en móvil

Si tocas ese bloque, revisa siempre el conjunto completo:

- `index.html`
- `colaboraciones.html`
- `js/lang.js`
- `scss/components/_colaboraciones.scss`
- `tests/index-colaboraciones.e2e.spec.js`

## 🧪 Validación rápida

- Si cambias traducciones: ejecuta `npm run build` (actualiza `dist/data/translations.json`).
- Si algo “no se ve”: revisa primero que la clave en `data-i18n` coincide exactamente con la del JSON.
- Si cambias un bloque con `data-i18n-format="paragraphs"`: revisa también el JS que construye los `<p>` y el CSS del contenedor, porque el problema puede no estar en la traducción en sí.

## 🧪 Tests E2E

Hay un test E2E dedicado al sistema de traducciones (idioma por defecto, cambio de idioma y persistencia entre páginas):

- `tests/i18n.e2e.spec.js`

Guía de ejecución: [`e2e-testing.md`](./e2e-testing.md)

---

Última actualización: 18 de marzo de 2026 - v4.2.16
