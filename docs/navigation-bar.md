# 🧭 Barra de navegación (Header fijo + Menú móvil)

Esta guía documenta **exactamente** cómo funciona la barra de navegación (navbar) del proyecto: estilos, comportamiento en móvil/desktop, accesibilidad y consideraciones especiales (Safari/iOS).

> Objetivo: que la barra se vea **siempre** durante el scroll, que sea **táctil (44px)**, que el estado activo sea claro y accesible, y que el menú móvil sea un overlay robusto.

---

## ✅ Archivos implicados (fuente de verdad)

- **Estilos (SCSS):** `scss/layout/_header.scss`
- **Menú móvil + scroll state (JS):** `js/nav-menu.js`
- **Modo oscuro/claro (JS) + compat iOS:** `js/dark.js`
- **Compatibilidad theme/iOS (SCSS):** `scss/components/_theme-compatibility.scss`
- **Modo oscuro (SCSS):** `scss/animaciones/_modo-oscuro.scss`
- **Artefacto compilado:** `dist/css/main.css` y `dist/*.html`

---

## 🧩 Estructura HTML esperada

Dentro de cada página, en el header existe:

- Contenedor de barra: `.header__barra` o `.header-inner__barra`
- Contenedor botones: `.header__botones`
- Notificación inline (en la barra): `#notificacion` (visible cuando añade clase `.mostrar`)
- Selector idioma:
  - Botón: `.header__lang-switcher#langSwitcher`
  - Menú: `.header__lang-options#langOptions`
- Botón modo oscuro/claro: `.header__modo-boton#botonModoOscuro` (o `.header-inner__modo-boton`)
- Navegación: `.navegacion` con enlaces `.navegacion__enlace`

> Nota importante: `#notificacion` debe ser **único** en el documento. Si se duplica por accidente (por ejemplo, por copiar/pegar secciones), el comportamiento puede ser ambiguo. Los tests E2E seleccionan la notificación dentro de la barra para ser robustos, pero lo recomendado es mantener IDs únicos.

### Estado activo en enlaces (recomendado)

El enlace de la página actual debe llevar:

- `class="navegacion__enlace active"`
- `aria-current="page"`

Ejemplo:

```html
<a class="navegacion__enlace active" href="index.html" aria-current="page">Inicio</a>
```

**Por qué:**
- `.active` mantiene compatibilidad con el markup existente.
- `aria-current="page"` mejora accesibilidad (lectores de pantalla) y permite estilos robustos.

---

## ✅ Checklist por página (HTML)

Cuando crees o edites una página, revisa esto:

1) En el `<nav class="navegacion">`:
  - existe exactamente **un** enlace marcado como activo
  - ese enlace tiene **las dos cosas**: `active` + `aria-current="page"`
2) El resto de enlaces:
  - **no** deben tener `aria-current="page"`
3) Si la navbar cambia entre páginas (mismo HTML copiado):
  - verifica que la página actual coincide con el `href` del enlace activo

Ejemplo (correcto):

```html
<a class="navegacion__enlace active" href="eventos.html" aria-current="page">Eventos</a>
```

Ejemplo (incorrecto):

```html
<!-- Incorrecto: dos enlaces marcados como current -->
<a class="navegacion__enlace active" href="index.html" aria-current="page">Inicio</a>
<a class="navegacion__enlace active" href="eventos.html" aria-current="page">Eventos</a>
```

---

## 📌 Barra fija en scroll (siempre visible)

### Qué se hace

La barra `.header__barra` y `.header-inner__barra` se comportan como **barra fija**:

- `position: fixed`
- `top: calc(env(safe-area-inset-top) + 1rem)`
- `left/right: 0`, centrada con `margin: 0 auto` y `max-width`.

Esto está en `scss/layout/_header.scss` dentro del bloque:

- `// Barras de Navegación Fijas para .header y .header-inner`

### Safe area (iPhone notch)

Se usa `env(safe-area-inset-top)` para que la barra no se meta debajo de la zona del notch.

**Nota:** si en un futuro se cambia el padding del header, no hay que "compensar" el notch manualmente en JS: debe mantenerse vía CSS.

---

## 🔮 Barra Translúcida (Patrón Overlay)

**IMPORTANTE:** La barra de navegación usa un patrón específico para ser translúcida Y permitir transiciones suaves entre modos claro/oscuro.

### Por qué se usa este patrón

CSS no puede animar directamente entre `linear-gradient` y `background-color`. Para lograr transiciones suaves, usamos el **patrón overlay con `::before`**.

### Implementación

```scss
.header__barra,
.header-inner__barra {
  // 1. Fondo transparente en modo claro (el gradiente está en ::before)
  background: transparent;
  backdrop-filter: blur(10px);

  // 2. Pseudo-elemento con gradiente translúcido
  // Opacidad 0.25 para efecto glassmorphism translúcido
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(10, 75, 141, 0.25),
      rgba(2, 66, 122, 0.25) 60%,
      rgba(0, 51, 102, 0.25) 100%
    );
    border-radius: inherit;
    opacity: 1;
    transition: opacity 2.4s ease-in-out;
    z-index: 0;
    pointer-events: none;
  }

  // 3. CRÍTICO: Excluir .navegacion del selector > *
  // para no romper position:absolute del menú móvil
  > *:not(.navegacion) {
    position: relative;
    z-index: 1;
  }
}

// 4. Modo oscuro: fondo translúcido oscuro + ocultar ::before
body.modo-oscuro .header__barra,
body.modo-oscuro .header-inner__barra {
  background: rgba(51, 51, 51, 0.7);

  &::before {
    opacity: 0;
  }
}
```

### Reglas críticas

1. **NUNCA usar `overflow: hidden`** en `.header__barra` - recorta el menú desplegable móvil
2. **SIEMPRE excluir `.navegacion`** del selector `> *` con `:not(.navegacion)` - el menú móvil necesita `position: absolute`
3. **Fondo base `transparent`** en modo claro - el gradiente viene del `::before`
4. **Transición de 2.4s** sincronizada con `--theme-transition`

---

## 🌓 Transición de Tema (Dark/Light Mode)

Para lograr una transición suave entre el modo claro (gradiente azul) y el modo oscuro (fondo oscuro), se utiliza una técnica específica.

**Técnica Implementada (Pseudo-elemento `::before`):**

1.  **Modo Claro**:
    *   Elemento: `background: transparent`
    *   `::before`: gradiente azul translúcido con `opacity: 1`
    *   Resultado: barra azul translúcida con blur

2.  **Modo Oscuro**:
    *   Elemento: `background: rgba(51, 51, 51, 0.7)` (gris translúcido)
    *   `::before`: `opacity: 0` (gradiente oculto)
    *   Resultado: barra gris translúcida con blur

3.  **Transición**:
    *   El `::before` anima su `opacity` de 1 → 0 (o viceversa)
    *   El elemento anima su `background` de transparent → gris
    *   Ambas transiciones duran 2.4s = transición suave

Esta lógica se aplica en `scss/layout/_header.scss` y `scss/animaciones/_modo-oscuro.scss`.

### 🔔 Notificación de cambio de tema (Toast)

Al alternar el modo oscuro/claro, aparece una notificación breve (`#notificacion`).
- **Lógica de protección (Debounce):** En `js/dark.js`, se verifica si la notificación ya está visible (`.mostrar`) para evitar solapamientos o duplicados.
- **Limpieza:** Se eliminó código redundante en `js/lang.js` que causaba conflictos de inicialización (doble disparo al cargar).

---

## 🧊 Estilo "glass" (claro y oscuro)

La barra y el dropdown móvil usan:

- fondos con alpha (`rgba(...)`)
- `backdrop-filter: blur(...)` para efecto de cristal
- sombra y borde suave

**Valores de opacidad:**

| Elemento | Modo Claro | Modo Oscuro |
|----------|------------|-------------|
| Barra (::before) | 0.25 | 0 (oculto) |
| Barra scroll (::before) | 0.30 | 0 (oculto) |
| Barra (elemento) | transparent | 0.7 |
| Menú móvil | 0.85 (azul) | 0.85 (negro) |

**Nota:** La opacidad de 0.25/0.30 en el gradiente permite translucidez mientras mantiene buen contraste con el texto blanco gracias al efecto glassmorphism (`backdrop-filter: blur`).

---

## 🎛️ Botones: tamaño táctil y estados

### Tamaño accesible (44px)

Los controles interactivos principales cumplen objetivo táctil:

- `.header__modo-boton` / `.header-inner__modo-boton`
- `.header__lang-switcher`
- `.header__menu-toggle` (hamburguesa)
- `.navegacion__enlace`

**Regla clave:** `min-height: 44px`

### Foco: `:focus-visible` (no "naranja pegado")

Para evitar que al hacer click quede un estado persistente "tipo hover", se prioriza `:focus-visible` frente a `:focus`.

- Mouse/touch: normalmente no muestra el foco persistente.
- Teclado: sí muestra el foco (accesibilidad).

### Modo oscuro: hover/touch naranja

Dentro de `body.modo-oscuro` se fuerzan los estados `:hover`, `:focus-visible` y `:active` para que **también** se vea el naranja en oscuro.

---

## 🟧 Estilo del enlace activo (active / aria-current)

El enlace activo se define por:

- `.navegacion__enlace.active`
- `.navegacion__enlace[aria-current="page"]`

### En modo claro

- Fondo: blanco translúcido (`rgba(255,255,255,0.75)`)
- Texto: tono azul oscuro de la barra (`rgba(3,49,95,0.95)`)

### En modo oscuro

Override dentro de `body.modo-oscuro`:

- Fondo: blanco translúcido (ligeramente más alto en hover/focus)
- Texto: gris oscuro (`rgba(34,34,34,0.95)`)

---

## 📱 Menú móvil (overlay dropdown)

### Activación

En móvil (≤767px):

- Se crea/usa un botón hamburguesa `.header__menu-toggle`.
- La navegación `.navegacion` se convierte en panel overlay.
- Se crea un backdrop `.nav-backdrop` para cerrar al tocar fuera.

Toda la lógica está en `js/nav-menu.js`.

### Comportamiento exacto

- La hamburguesa solo abre/cierra en móvil (media query en JS: `(max-width: 767px)`).
- Al abrir:
  - `.navegacion` recibe `.is-open`
  - `body` recibe `.nav-open` (bloquea scroll)
  - `.nav-backdrop` recibe `.is-active`
  - se intenta enfocar el primer link (mejor UX teclado)
- Al cerrar:
  - se eliminan esas clases
- Cierra cuando:
  - click en un enlace del menú (antes de navegar)
  - tecla `Escape`
  - click en backdrop
  - resize a desktop

### CSS del overlay

En `scss/layout/_header.scss` (bloque responsive móvil):

```scss
@media (max-width: 767px) {
  .navegacion {
    display: none;
    position: absolute;      // ⚠️ CRÍTICO: necesario para dropdown
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: rgba(2, 66, 122, 0.85);  // Azul translúcido
    backdrop-filter: blur(12px);
    border-radius: 1.2rem;
    z-index: 2500;
  }

  .navegacion.is-open {
    display: flex;
  }
}
```

### Z-index layering (móvil)

| Elemento | z-index | Descripción |
|----------|---------|-------------|
| `.nav-backdrop` | 1500 | Capa para clicks fuera |
| `.header__barra` | 2000 | Barra de navegación |
| `.navegacion` | 2500 | Menú desplegable |
| `.header__menu-toggle` | 2600 | Botón hamburguesa |

### Backdrop transparente

El `.nav-backdrop` es **intencionalmente transparente** (`background: transparent`) para no oscurecer la página, pero sigue siendo funcional para detectar clicks fuera del menú.

**Nota para tests:** Como el backdrop es transparente, Playwright no puede hacer click directo. Los tests usan `page.evaluate(() => document.querySelector('.nav-backdrop').click())`.

---

## 📐 Layout móvil: una sola fila (3 zonas)

Objetivo en móvil (<768px): mantener el header **en una sola línea** con:

- izquierda: `.header__botones` (idioma + modo)
- centro: `#notificacion` (cuando está visible)
- derecha: `.header__menu-toggle` (hamburguesa)

### Implementación (SCSS)

En móvil, la barra usa un layout de 3 columnas (tipo grid) para evitar que el header vuelva a apilarse:

- `.header__barra, .header-inner__barra` se configuran para disposición horizontal
- Se asignan áreas/columnas para garantizar el orden visual: botones → notificación → menú

Esto vive en `scss/layout/_header.scss`.

### Notificación: inline (no "toast" flotante)

El proyecto tiene estilos globales tipo toast para `#notificacion` (centrado abajo, `position: fixed`) en:

- `scss/base/_notificaciones.scss`

Para el header móvil, se sobreescribe esa presentación para que `#notificacion` sea **inline** dentro de la barra (con elipsis, altura consistente y sin transformaciones de toast).

---

---

## 🍏 Safari/iOS: regla de oro (no romper `position: fixed`)

### Problema típico

En Safari/iOS (WebKit), si un ancestro (o el propio `body`) tiene `transform`, puede crear un nuevo contexto de composición y **romper** el comportamiento de `position: fixed` (se vuelve "relative" a ese contexto o se comporta de forma inconsistente).

### Regla del proyecto

- **No aplicar `transform` al `body`** para hacks de repaint.

Esto se refuerza en:

- `scss/components/_theme-compatibility.scss`:
  - `body.modo-oscuro, body.modo-claro { transform: none; -webkit-transform: none; }`
- `js/dark.js`:
  - cuando necesita "empujón" en iOS, fuerza reflow con `void document.body.offsetHeight;` en lugar de transforms.

---

## 🧰 Depuración rápida en iPhone/Safari

Si notas que en iOS la barra no se comporta como esperas (se mueve, deja de ser fija, "tiembla" o el overlay no coincide):

### 1) Confirmar que estás viendo el build correcto

- Si estás probando el sitio desplegado: revisa que has subido `dist/` (no la raíz del repo).
- Si estás probando local: asegúrate de estar sirviendo `dist/`.

### 2) Buscar transforms que rompan el fixed

Checklist:

- No debe existir `transform` en `body`/`html` (ni en contenedores que envuelvan la barra).
- Evita introducir hacks tipo `translateZ(0)` para "suavizar scroll" en iOS.

### 3) Verificar safe area

En dispositivos con notch, el `top` debe usar:

- `top: calc(env(safe-area-inset-top) + 1rem)`

Si ves la barra pegada arriba del todo o cortada, revisa que no haya otra regla CSS que pise ese `top`.

### 4) Revisar caché (muy común en iOS)

Cuando cambias CSS/JS y no se refleja:

- prueba en Safari iOS con una ventana privada
- o fuerza recarga (si procede)
- o cambia el nombre/hash del archivo en despliegues críticos (estrategia de cache-busting)

### 5) Overlay móvil

Si el menú móvil no abre/cierra bien:

- confirma que `js/nav-menu.js` se está cargando en esa página
- confirma que existe `.navegacion` dentro de `.header__barra` o `.header-inner__barra`
- confirma que el breakpoint coincide en CSS y JS (767px)

---

## 🧪 Tests E2E

Los tests E2E validan la navbar (desktop vs móvil) y el comportamiento del overlay:

- Guía: `docs/e2e-testing.md`
- Suites:
  - `tests/nav.e2e.spec.js` - Comportamiento general
  - `tests/header-bar-bg.e2e.spec.js` - Fondo translúcido y transiciones
  - `tests/header-mobile-layout.e2e.spec.js` - Layout móvil
  - `tests/nav-transition.e2e.spec.js` - Transiciones de enlaces

Recomendación de flujo:

```bash
npm run build
npm run test:e2e
```

---

## 🧱 Cómo cambiar la navbar sin romper nada

### Checklist de cambios

1) **¿Tamaño táctil?** Mantener `min-height: 44px` en controles.
2) **¿Foco accesible?** Preferir `:focus-visible`.
3) **¿iOS?** No introducir `transform` en `body` ni hacks similares.
4) **¿Activo correcto?** Mantener `.active` y `aria-current="page"` en el enlace actual.
5) **¿Móvil?** Si cambias breakpoints, actualiza **CSS y JS**:
   - CSS usa `@media (max-width: 767px)`
   - JS usa `matchMedia('(max-width: 767px)')`
6) **¿Patrón overlay?** No usar `overflow: hidden` en la barra
7) **¿Selector `> *`?** Siempre excluir `.navegacion` con `:not(.navegacion)`

### Recompilar

Para regenerar CSS en `dist/`:

```bash
npx gulp css
```

Build completo:

```bash
npm run build
```

---

## 🧯 Troubleshooting rápido

- **La barra no se queda fija en iPhone:** busca `transform` aplicado a `body/html` o ancestros.
- **El hover "naranja pegado" vuelve:** revisa que los estilos estén en `:focus-visible` y no en `:focus`.
- **No se ven cambios:** asegúrate de estar sirviendo `dist/` y de haber ejecutado `npm run build` o `npx gulp css`.
- **El menú móvil no abre:** confirma que `js/nav-menu.js` se carga en esa página y que existe `.navegacion` dentro de `.header__barra`/`.header-inner__barra`.
- **El menú móvil no se despliega (queda cortado):** verifica que NO hay `overflow: hidden` en `.header__barra`.
- **El menú aparece con posición incorrecta:** verifica que el selector `> *` excluye `.navegacion` con `:not(.navegacion)`.
- **La transición de la barra es instantánea:** verifica que el `::before` tiene `transition: opacity 2.4s` y que `transicion-a-claro` está configurado.

---

## 🐞 Historial de Bugs Visuales (Stacking Context)

### v4.1.1 - Visibilidad texto menú Desktop >768px (Light Mode)

**Problema:** En modo claro y pantalla escritorio, el texto de navegación (`.navegacion`) se veía deslavado o con poca nitidez a pesar de tener el color correcto.
**Causa:** El contenedor `.navegacion` tenía `position: static` por defecto. El fondo "glassmorphism" (`.header__barra::before`) es un elemento posicionado absolutamente con opacidad. Debido al contexto de apilamiento (stacking context), el texto estático se renderizaba visualmente "debajo" o mezclado incorrectamente con el filtro del pseudo-elemento, perdiendo contraste.
**Solución:** Se forzó un nuevo contexto de apilamiento para la navegación en desktop:

```scss
// scss/layout/_header.scss
@media (min-width: 768px) {
  .navegacion {
    position: relative; // Antes static
    z-index: 5;         // Elevar sobre el ::before (fondo)
    // ...
  }
}
```

### v4.0.0 - Menú Móvil Backdrop
**Problema:** El backdrop oscurecía el propio menú.
**Solución:** Se movió el backdrop dentro de `.header__barra` y se asignaron z-index explícitos: Botón (2600) > Menú (2500) > Backdrop (1500).

---

*Última actualización: 9 de marzo de 2026 - v4.2.16*
