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

## 🖼️ Fondo con Gradiente

El fondo del sitio se implementa directamente en `body` usando `background-image`:

```scss
html {
  height: 100%;
  scroll-behavior: smooth;
}

body {
  min-height: 100%;
  background-color: #0a4b8d;
  background-image: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
  background-repeat: no-repeat;
  background-size: cover;
}
```

**Por qué esta implementación:**
- `html { height: 100% }` + `body { min-height: 100% }` asegura que el fondo cubra todo el viewport
- `background-size: cover` + `background-repeat: no-repeat` evita que el gradiente se corte o repita
- `background-color` actúa como fallback mientras carga el gradiente
- Más simple y directo que usar pseudo-elementos
- Compatible con todos los navegadores modernos

### Colores del gradiente (modo claro)

| Posición | Color | Descripción |
|----------|-------|-------------|
| 0% | `#0a4b8d` | Azul corporativo |
| 60% | `#02427a` | Azul medio |
| 100% | `#003366` | Azul oscuro |

## 🌙 Modo Oscuro

En modo oscuro, el fondo cambia a negro sólido eliminando el gradiente:

```scss
body.modo-oscuro {
  background-color: v.$negro; // #000
  background-image: none;
}
```

La transición entre modos se gestiona automáticamente por `js/dark.js` y se anima con las variables CSS de transición definidas en `_modo-oscuro.scss`.

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

## 🧪 Verificación

Para verificar que el fondo funciona correctamente:

1. Modo claro: debe verse el gradiente azul diagonal (135°)
2. Modo oscuro: debe verse fondo negro sólido
3. Scroll: el fondo debe cubrir todo el contenido sin repetirse
4. Sección Falla: debe verse la imagen de traje con overlay semitransparente

```bash
npm run build
npm run test:e2e
```

---

*Última actualización: 25 de enero de 2026*
