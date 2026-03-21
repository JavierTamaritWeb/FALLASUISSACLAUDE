# 🌤 UI/UX Meteorología y Animaciones

Documentación técnica sobre los componentes visuales de la sección meteorológica, específicamente el comportamiento del icono principal y sus animaciones.

## 🎨 Icono Meteorológico Principal

El icono que muestra el estado actual del clima (`#current-icon-img`) tiene comportamientos responsivos y estéticos específicos definidos en `scss/components/_meteo.scss`.

## 🏗️ Estructura del widget en la Home

En `index.html`, el widget meteorológico compacto tiene esta jerarquía:

```html
<div class="current-wrapper">
  <div class="current-content">        <!-- flex column, align-items: center -->
    <div class="current-icon">...</div>
    <div class="current-info">...</div>
    <div class="current-details current-details__humedad">
      <div class="etiqueta-humedad">...</div>
    </div>
  </div>
</div>
```

La humedad está dentro de `.current-content` para heredar el centrado flex. En `meteo.html`, `.current-details` es un grid independiente con todas las métricas (humedad, presión, viento, nubes, etc.).

## 🌍 Sincronización con i18n

La sección meteo depende de etiquetas traducidas para construir varios textos dinámicos (`Sensación`, `Mín`, `Máx`, `Viento`, `Nubosidad`, etc.).

Desde marzo de 2026, `js/meteo.js` no renderiza la primera tanda de datos hasta que `js/lang.js` haya cargado el JSON y emitido `translationsReady`.

Esto evita una carrera real en la que el widget podía pintar textos como:

- `meteo.min: 24°C`
- `meteo.viento: 2 m/s`
- `meteo.nubosidad: 10%`

Ese fallo no solo era visual: cambiaba el wrapping del texto y provocaba diferencias de altura en snapshots E2E.

### Contrato actual

- `js/lang.js` emite `translationsReady` cuando el idioma activo ya está cargado y aplicado.
- `js/meteo.js` espera ese evento antes del primer `fetchCurrentWeather()` / `fetchForecast()`.
- Si `translate(key)` todavía devolviera la propia key, meteo usa un fallback legible (`Mín`, `Máx`, `Viento`, etc.) en vez de pintar la key cruda.
- `waitForTranslationsReady()` no bloquea indefinidamente: si el evento no llega, resuelve igualmente tras un timeout corto para no congelar la inicialización completa del módulo.
- Tras `langChanged`, meteo vuelve a pedir clima actual y previsión para que la UI cambie de idioma sin recargar la página.

### Textos dinámicos que no debe pisar i18n

El campo de sensación térmica mantiene `data-i18n="meteo.sensacion"`, pero ahora se marca además con `data-i18n-dynamic="true"`.

Motivo:

- `lang.js` sigue sabiendo qué label base le corresponde.
- Pero no sobrescribe el contenido completo del nodo, porque ese texto lo compone `js/meteo.js` con valor dinámico (`Sensación: 26°C`).

Ejemplo:

```html
<p id="current-feels-like"
    data-i18n="meteo.sensacion"
    data-i18n-dynamic="true">Sensación: --°C</p>
```

Este patrón se usa hoy tanto en la home como en la página completa de meteo. Si se elimina ese atributo en uno de los dos contextos, `lang.js` volverá a pisar el contenido dinámico y reaparecerán textos incompletos o keys crudas durante el primer render.

### Dimensiones Responsivas

Para garantizar la visibilidad en pantallas grandes, el icono tiene un tamaño escalado:

| Viewport | Selector CSS | Ancho (`width`) |
| --- | --- | --- |
| **> 1200px** | `@media (min-width: 1200px)` | `20rem` (aprox 320px base 16) |
| **Standard** | `#current-icon-img` | `8rem` |
| **< 767px** | `@media (max-width: 767px)` | `9rem` |
| **< 480px** | `@media (max-width: 480px)` | `7rem` |

### Animaciones

El icono utiliza una combinación de dos animaciones CSS simultáneas para lograr un efecto de entrada suave y un movimiento continuo natural.

#### 1. Fade In (Entrada)

- **Nombre:** `weatherIconFade`
- **Duración:** `1s`
- **Efecto:** Opacidad de 0 a 1.
- **Timing:** `ease-out`.
- **Ejecución:** Una sola vez (`forwards`).

#### 2. Sway (Vaivén)

- **Nombre:** `weatherIconSway`
- **Duración:** `4s`
- **Repetición:** Infinita.
- **Comportamiento:** Movimiento horizontal suave (`translateX`).
- **0% -> 25%:** Desplazamiento a la izquierda (-10px) (`ease-in-out`).
- **25% -> 75%:** Desplazamiento a la derecha (10px) (`ease-in`).
- **75% -> 100%:** Retorno al centro (`ease-out`).

> **Nota de Diseño:** Se reemplazó la antigua animación de rotación (`rotate`) por `translateX` para ofrecer un movimiento más fluido ("suave") y menos mecánico.

### 🌧️ Lógica de Lluvia (Falleret)

El widget incluye una imagen decorativa ("Falleret" - *falleretPro.svg*) que reacciona a las condiciones meteorológicas en tiempo real.

- **Condición Normal:** Se muestra `falleretPro.svg`.
- **Lluvia/Tormenta:** Si la API devuelve un código de condición de lluvia, llovizna o tormenta, la imagen cambia suavemente a `falleretPlora.svg` (Falleret llorando/triste).
- **Dimensiones:** Ambas imágenes mantienen dimensiones idénticas para evitar saltos de layout (CLS).

```javascript
/* Lógica simplificada (js/meteo.js) */
const isRaining = ['Rain', 'Drizzle', 'Thunderstorm'].includes(mainCondition);
const newSrc = isRaining ? 'img/decoracion/falleretPlora.svg' : 'img/decoracion/falleretPro.svg';
// Se aplica con una transición de opacidad (fade-out -> src change -> fade-in)
```

```scss
.weather-animate-in {
  animation: 
    weatherIconFade 1s ease-out forwards, 
    weatherIconSway 4s infinite;
}
```

## ✅ Tests Automatizados

Existen pruebas E2E (Playwright) para asegurar que estos estilos no sufran regresiones:

- **Archivo:** `tests/meteo-animation.e2e.spec.js`
- **Verificaciones:**
    1. Carga correcta de la clase `.weather-animate-in`.
    2. Existencia de ambas animaciones (`Fade` y `Sway`) en las propiedades computadas.
    3. Validación "Caja Blanca" de que `@keyframes weatherIconSway` utiliza `translateX` y no `rotate`.

Para ejecutar los tests:

```bash
npx playwright test tests/meteo-animation.e2e.spec.js
```

## 📸 Estabilidad visual en Playwright

Las capturas de `meteo.html` necesitan más preparación que una página estática. La suite visual considera el widget listo solo cuando se cumple todo esto:

- temperatura actual poblada
- forecast de 5 días poblado
- todos los iconos cargados con `naturalWidth > 0`
- modo visual correcto ya aplicado en `body` y `html`
- `scrollHeight` estable antes del screenshot

Esto protege especialmente el caso móvil oscuro, donde una etiqueta i18n mal resuelta podía añadir altura extra y romper el snapshot.

La coordinación actual entre i18n y meteo no es solo un detalle de copy: forma parte de la estabilidad geométrica del widget y de la fiabilidad de los snapshots visuales.

---

Última actualización: 20 de marzo de 2026 - v4.6.2
