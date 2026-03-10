# 🌤 UI/UX Meteorología y Animaciones

Documentación técnica sobre los componentes visuales de la sección meteorológica, específicamente el comportamiento del icono principal y sus animaciones.

## 🎨 Icono Meteorológico Principal

El icono que muestra el estado actual del clima (`#current-icon-img`) tiene comportamientos responsivos y estéticos específicos definidos en `scss/components/_meteo.scss`.

### Dimensiones Responsivas

Para garantizar la visibilidad en pantallas grandes, el icono tiene un tamaño escalado:

| Viewport | Selector CSS | Ancho (`width`) |
|----------|--------------|-----------------|
| **> 1200px** | `@media (min-width: 1200px)` | `20rem` (aprox 320px base 16) |
| **Standard** | `#current-icon-img` | `8rem` |
| **< 767px** | `@media (max-width: 767px)` | `9rem` |
| **< 480px** | `@media (max-width: 480px)` | `7rem` |

### Animaciones

El icono utiliza una combinación de dos animaciones CSS simultáneas para lograr un efecto de entrada suave y un movimiento continuo natural.

#### 1. Fade In (Entrada)
*   **Nombre:** `weatherIconFade`
*   **Duración:** `1s`
*   **Efecto:** Opacidad de 0 a 1.
*   **Timing:** `ease-out`.
*   **Ejecución:** Una sola vez (`forwards`).

#### 2. Sway (Vaivén)
*   **Nombre:** `weatherIconSway`
*   **Duración:** `4s`
*   **Repetición:** Infinita.
*   **Comportamiento:** Movimiento horizontal suave (`translateX`).
    *   **0% -> 25%:** Desplazamiento a la izquierda (-10px) (`ease-in-out`).
    *   **25% -> 75%:** Desplazamiento a la derecha (10px) (`ease-in`).
    *   **75% -> 100%:** Retorno al centro (`ease-out`).

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

*   **Archivo:** `tests/meteo-animation.e2e.spec.js`
*   **Verificaciones:**
    1.  Carga correcta de la clase `.weather-animate-in`.
    2.  Existencia de ambas animaciones (`Fade` y `Sway`) en las propiedades computadas.
    3.  Validación "Caja Blanca" de que `@keyframes weatherIconSway` utiliza `translateX` y no `rotate`.

Para ejecutar los tests:
```bash
npx playwright test tests/meteo-animation.e2e.spec.js
```
