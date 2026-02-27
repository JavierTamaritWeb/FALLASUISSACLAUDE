# 🎨 Estilos Globales (Reset y Fondo)

Esta guía documenta el sistema de estilos globales del proyecto, incluyendo el reset CSS y el fondo con gradiente.

## 📁 Archivo fuente

- `scss/abstracts/_globales.scss`

## 🔄 Reset CSS

El proyecto usa un reset universal que normaliza todos los elementos:

```scss
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

**Por qué:**
- Elimina márgenes y paddings por defecto de los navegadores
- Usa `border-box` para un modelo de caja más predecible

## 🖼️ Fondo con Gradiente (Transición Suave Dark Mode)

Para permitir transiciones suaves de opacidad entre el modo claro (gradiente) y oscuro (negro), **NO** se aplica el fondo directamente al `body` (CSS no puede animar `background-image` a `none`).

**Implementación (Patrón Overlay `::before`):**

1.  **Body**:
    *   Actúa como contenedor base con un color de fondo de respaldo (`#0a4b8d`).
    *   Tiene `position: relative`.

2.  **Pseudo-elemento `::before`**:
    *   Contiene el gradiente lineal.
    *   `position: fixed` (para que no scrollee y cubra todo).
    *   `transition: opacity var(--theme-transition)`.

```scss
body {
  // Configuración base
  background-color: #0a4b8d; 
  position: relative;
  
  // Capa del gradiente
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -100;
    pointer-events: none;
    
    // Gradiente Original
    background-image: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
    background-size: cover;
    
    // Transición suave
    transition: opacity 2.4s ease-in-out;
  }
}
```

### Comportamiento en Modo Oscuro

En `scss/animaciones/_modo-oscuro.scss`:

1.  El `body` cambia su color de fondo a negro (`v.$negro`).
2.  El pseudo-elemento `::before` (gradiente) cambia a `opacity: 0`.

Resultado: El gradiente se desvanece suavemente revelando el fondo negro que hay detrás.

## 🌙 Módulos con Fondo e Imagen (Ej: .falla)

Para secciones que combinan una imagen de fondo + un overlay de color (como la sección `.falla` con el fondo del traje), se usa el mismo patrón de capas para animar el cambio de color del overlay.

**Estructura:**
- **.falla**: Contiene la **imagen** de fondo (`url(...)`).
- **.falla::before**: Contiene el **overlay de color** con opacidad (`background-color: rgba(...)`) y la transición.

```scss
.falla {
  background: url('../img/fondo_traje.png'); // Imagen fija
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(245, 245, 245, 0.85); // Overlay claro
    transition: background-color 2.4s ease-in-out;
  }
}

// En modo oscuro
body.modo-oscuro .falla::before {
  background-color: rgba(0, 0, 0, 0.85); // Overlay oscuro
}
```

## 🧩 Integración con otros archivos

El archivo `_globales.scss` se importa en `main.scss` después de `normalize`:

```scss
@use 'abstracts/normalize';
@use 'abstracts/globales';
@use 'abstracts/accessibility';
```

**Importante:** No definir `background-image` en otros archivos para evitar conflictos. El modo oscuro define `background-image: none` en `scss/animaciones/_modo-oscuro.scss` para anular el gradiente.

## ⚠️ Consideraciones

### Orden de cascada
El archivo `_globales.scss` se carga temprano. El archivo `_modo-oscuro.scss` se carga después y sobrescribe el fondo cuando se activa `.modo-oscuro`.

### Altura del contenido
- `html` debe tener `height: 100%` 
- `body` debe tener `min-height: 100%` (no `height: 100%`) para permitir que el contenido crezca
- Esto asegura que páginas cortas muestren el gradiente completo

### Safari/iOS
Esta implementación es totalmente compatible con Safari/iOS sin necesidad de hacks adicionales.

## 👗 Fondo de Sección Falla (Traje Regional)

La sección `.falla` (página principal con información de la Falla) tiene un fondo con imagen de traje regional valenciano (`img/fondo_traje.png`).

### Modo claro

```scss
.falla {
  background: linear-gradient(rgba(245, 245, 245, 0.85), rgba(245, 245, 245, 0.85)), url('../img/fondo_traje.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
```

**Implementación:**
- Gradiente semitransparente blanco (85% opacidad) sobre la imagen
- `background-attachment: fixed` crea efecto parallax suave
- La imagen se centra y cubre toda la sección

### Modo oscuro

```scss
body.modo-oscuro .falla {
  background: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('../img/fondo_traje.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
```

**Implementación:**
- Gradiente semitransparente negro (85% opacidad) sobre la misma imagen
- Mantiene la coherencia visual pero adaptado al tema oscuro

### Archivos relacionados

| Archivo | Contenido |
|---------|-----------|
| `scss/components/_falla.scss` | Estilos modo claro |
| `scss/animaciones/_modo-oscuro.scss` | Estilos modo oscuro |
| `img/fondo_traje.png` | Imagen de fondo (traje regional) |

## 🔄 Transición de Gradiente a Color Sólido

**Problema:** CSS **no puede transicionar** entre `linear-gradient` y un color sólido (`background-color`). Si intentas cambiar directamente de gradiente a color, el cambio será instantáneo.

**Solución:** Usar el **patrón de overlay con pseudo-elemento `::before`**:

1. El elemento base tiene el `background-color` del modo oscuro (transicionable)
2. El gradiente está en `::before` con `opacity: 1`
3. En modo oscuro, `::before` tiene `opacity: 0` (desvanece el gradiente)
4. La transición es suave porque `opacity` SÍ es animable

### Componentes que usan este patrón

| Componente | Archivo SCSS | Color base | Gradiente |
|------------|--------------|------------|-----------|
| `.quieres-mas` | `_quieres.scss` | `$secondary-color` (#333) | Azul diagonal |
| `.countdown__contenedor` | `_countdown.scss` | `$negro` | Azul diagonal |

### Implementación

```scss
// Ejemplo: .quieres-mas
.quieres-mas {
  background-color: v.$secondary-color; // Color modo oscuro
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
    opacity: 1;
    transition: opacity 2.4s ease-in-out;
    z-index: 0;
    pointer-events: none;
  }

  // Contenido por encima del pseudo-elemento
  > * {
    position: relative;
    z-index: 1;
  }
}

// Modo oscuro: desvanecer el gradiente
body.modo-oscuro .quieres-mas::before {
  opacity: 0;
}
```

### Reglas importantes

1. **NUNCA** cambiar el gradiente a color sólido directamente - usar `opacity`
2. **SIEMPRE** añadir `position: relative` al elemento padre
3. **SIEMPRE** añadir `z-index: 1` a los hijos directos (`> *`)
4. **SIEMPRE** añadir el `::before` a la lista de transiciones en `_modo-oscuro.scss`
5. Para elementos con `border-radius`, añadir `overflow: hidden` al padre

## 🖼️ Inversión de Imagen con CSS Filter (Banner Subvención)

**Problema:** El banner de subvención muestra una imagen con texto negro sobre fondo blanco. En modo oscuro, CSS `color` no afecta al contenido interno de una imagen raster.

**Solución:** Usar `filter: invert(1) hue-rotate(180deg)` en modo oscuro:

- `invert(1)`: Invierte todos los colores (blanco→negro, negro→blanco)
- `hue-rotate(180deg)`: Rota el tono 180° para restaurar los rojos (el escudo del Ajuntament se mantiene rojo)

**Importante:** No usar `invert(1)` solo — convierte el rojo del escudo en verde.

### Implementación

```scss
// En _banner-subvencion.scss
.banner-subvencion__imagen {
  width: 100%;
  max-width: 600px;
  height: auto;
  transition: filter 2.4s ease-in-out;
}

// En _modo-oscuro.scss
body.modo-oscuro .banner-subvencion__imagen {
  filter: invert(1) hue-rotate(180deg);
}
```

### Formato de imagen: `<picture>` con AVIF/WebP/PNG

Originalmente se usaba `<img src="subvencion.svg">`, pero Safari tiene un bug de WebKit ([Bug 246106](https://bugs.webkit.org/show_bug.cgi?id=246106)) donde CSS `filter` no se compone correctamente sobre un `<img>` que carga un SVG con filtros internos (`feColorMatrix`, máscaras). La solución es usar formatos raster mediante `<picture>`:

```html
<picture>
  <source srcset="img/subvencion.avif" type="image/avif">
  <source srcset="img/subvencion.webp" type="image/webp">
  <img class="banner-subvencion__imagen" src="img/subvencion.png" alt="Información de subvención">
</picture>
```

**Importante:** No revertir a `<img src="subvencion.svg">` — rompe el filtro en Safari.

### Archivos relacionados

| Archivo | Contenido |
|---------|-----------|
| `scss/components/_banner-subvencion.scss` | Estilos base + transición filter |
| `scss/animaciones/_modo-oscuro.scss` | Regla `filter: invert(1) hue-rotate(180deg)` |
| `index.html` | `<picture>` con fuentes AVIF/WebP/PNG |

### Forzar reflow en JavaScript

En `js/dark.js`, se fuerza un reflow antes de cambiar las clases de modo para asegurar que la transición se aplique correctamente en todos los navegadores:

```javascript
if (wasDark) {
  document.body.classList.add('transicion-a-claro');
  document.documentElement.classList.add('transicion-a-claro');
  // Forzar reflow para que el navegador aplique la transición
  void document.body.offsetHeight;
}
```

### Tests E2E

Los tests verifican que las transiciones sean graduales (no instantáneas):

- `tests/quieres-mas-transition.e2e.spec.js`
- `tests/countdown-transition.e2e.spec.js`

## 🧪 Verificación

Para verificar que el fondo funciona correctamente:

1. Modo claro: debe verse el gradiente azul diagonal (135°)
2. Modo oscuro: debe verse fondo negro sólido
3. Scroll: el fondo debe cubrir todo el contenido sin repetirse
4. Sección Falla: debe verse la imagen de traje con overlay semitransparente
5. **Transiciones:** Los cambios de modo deben ser graduales (2.4s), nunca instantáneos

```bash
npm run build
npm run test:e2e
```

## 🎗️ Cenefa Decorativa (Frieze)

La web incluye una banda decorativa (`.frieze`) que se utiliza como separador visual o elemento de marca.

- **Fuente:** `scss/base/_frieze.scss`
- **Variables:** `scss/abstracts/_variables.scss`

### Variables Clave

| Variable | Valor Defecto | Descripción |
| :--- | :--- | :--- |
| `$frieze-img` | `url('../img/cenefa_sin_fondo.svg')` | Imagen SVG de la cenefa |
| `$frieze-bg` | `$blanco-hueso` (#F5F5F5) | Color de fondo de la banda (v4.1.3 cambio de transparent a hueso) |
| `$frieze-size` | `clamp(30px, 8vw, 50px)` | Altura responsive |

---

*Última actualización: 30 de enero de 2026 - v4.1.3*

## 🏛️ Componente Frieze (Cenefa)

La cenefa (`.frieze`) es un elemento decorativo que utiliza transiciones suaves para adaptarse al cambio de tema.

- **Archivo fuente**: `scss/base/_frieze.scss`
- **Función**: Borde decorativo superior/inferior.

### Colores y Comportamiento

| Tema | Variable SCSS | Color |
|------|--------------|-------|
| Claro | `$frieze-bg` | `$blanco-hueso` (#F5F5F5) |
| Oscuro | `$frieze-bg-dark` | `$gris-muy-oscuro` (#444) |

### Implementación Técnica

Utiliza `var(--theme-transition)` (2.4s) para sincronizarse con el fade del fondo global.

```scss
.frieze {
  background-color: v.$frieze-bg;
  
  // Transición sincronizada
  transition: background-color var(--theme-transition, 2.4s ease-in-out);

  // Sobrescritura para modo oscuro
  body.modo-oscuro & {
    background-color: v.$frieze-bg-dark;
  }
}
```

### Implementación SCSS

```scss
.frieze {
  // Propiedades base
  transition: background-color var(--theme-transition, 2.4s ease-in-out);

  // Selector de contexto para modo oscuro
  body.modo-oscuro & {
    background-color: v.$frieze-bg-dark;
  }
}
```
