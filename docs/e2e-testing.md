# 🧪 Tests E2E (Playwright)

**25 test suites** | **130+ tests**

Esta guía documenta cómo ejecutar los tests end-to-end (E2E) del proyecto y qué validan.

## ✅ Qué se valida

Los tests se centran en:

### 🧭 Navbar (desktop y móvil)

- Desktop: navegación visible, botón hamburguesa oculto, selector de idioma con etiqueta "IDIOMA · …".
- Móvil (<768px): botón hamburguesa visible, navegación cerrada por defecto y apertura/cierre correcto.
- Interacciones: cierre con Escape, click fuera (backdrop) y cierre al clicar un enlace.
- Accesibilidad: ARIA básico (por ejemplo `aria-expanded`, `aria-label`).

### 📐 Layout del header en móvil (una sola fila)

- En móvil (<768px) el header mantiene **una sola línea** con 3 zonas:
  - izquierda: botones (idioma + modo)
  - centro: notificación inline (`#notificacion`) cuando está visible
  - derecha: botón de menú (hamburguesa)
- Se valida con geometría (bounding boxes) para evitar regresiones de CSS (por ejemplo que vuelva a apilarse en columna).

Archivo de test:

- `tests/header-mobile-layout.e2e.spec.js`

Referencia técnica:

- [`navigation-bar.md`](./navigation-bar.md)

### 🎛️ UI: transición de enlaces de la navbar

- Se valida que los enlaces `.navegacion__enlace` tienen una transición de `background-color` dentro del rango esperado.

Archivo de test:

- `tests/nav-transition.e2e.spec.js`

### 🖼️ “El Monumento” (Swiper)

- El slider no debe “recortar” imágenes por estilos de altura/overflow.
- Se valida comportamiento responsive en varios viewports.

Guía técnica del slider: [`swiper-monumento.md`](./swiper-monumento.md)

Referencia técnica de implementación (CSS/JS, breakpoints, iOS/Safari): [`navigation-bar.md`](./navigation-bar.md)

### 🧾 Scrollbar (modo oscuro) — Safari/WebKit

- El thumb debe mantenerse en `#FF6F61`.
- En modo oscuro, el track del viewport debe poder forzarse a `#111` también cuando Safari asocia el scrollbar a `html` (no solo a `body`).

Nota: por limitaciones reales de WebKit (pseudo-elementos de scrollbar) y por la variabilidad de los “overlay scrollbars” en macOS, estos checks se hacen validando el CSS compilado en `dist/` y el estado de clase en `<html>`.

Archivo de test:

- `tests/scrollbar-theme.e2e.spec.js`

Guía técnica:

- [`scrollbar-theme.md`](./scrollbar-theme.md)

### 🌍 i18n (traducciones)

- Idioma por defecto (ES) y presencia de claves críticas (`data-i18n`).
- Cambio a Valenciano y validación de textos traducidos.
- Persistencia por `localStorage.lang` al navegar entre páginas y al recargar.

Archivo de test:

- `tests/i18n.e2e.spec.js`

Guía técnica:

- [`i18n-translations.md`](./i18n-translations.md)

### 🎨 Header bar background

- Se valida que el fondo de la barra del header tiene el color y estilos correctos en modo claro/oscuro.

Archivo de test:

- `tests/header-bar-bg.e2e.spec.js`

### 🛡️ SCSS Guardrails

- Se valida que las variables SCSS eliminadas (como `$color-instagram`, `$color-falla`, etc.) no se reintroduzcan en el código.
- Protege contra regresiones de refactorización SCSS.

Archivo de test:

- `tests/scss-guardrails.e2e.spec.js`

### 📸 Visual Regression

- Tests de regresión visual para componentes críticos.
- Compara capturas de pantalla para detectar cambios no intencionados.

Archivo de test:

- `tests/visual-regression.e2e.spec.js`

### 🟦 Open Graph (WhatsApp)

- La imagen `img/og-share.png` debe existir, pesar < 300KB y medir 1200×630.
- Ningún HTML debe referenciar `og-share.png` sin cache-buster `?v=...` (evita problemas de caché en WhatsApp).
- El build en `dist/` también debe contener la URL versionada.

Archivos de test:

- `tests/og-image.e2e.spec.js`
- `tests/og-meta-cachebust.e2e.spec.js`
- `tests/og-meta-cachebust-dist.e2e.spec.js`

### ⏱️ Countdown (Cuenta atrás)

- Verifica el cálculo de fechas de inicio/fin del ciclo de Fallas.
- **La Crida** (inicio): último domingo de febrero a las 20:00 (calculado dinámicamente).
- **Fin**: 20 de marzo a las 00:00 (fecha fija).
- **Reinicio**: después del 20 de marzo, se reinicia automáticamente para contar hacia el año siguiente.
- Valida que la UI del countdown muestra valores numéricos correctos.
- **Mensaje bilingüe durante las Fallas**:
  - Español: "¡Estamos en Fallas!"
  - Valenciano: "Ja estem en Falles!"
  - Cambio de idioma actualiza el mensaje automáticamente.

Ejemplos de fechas:
- 2026: La Crida el 22 de febrero a las 20:00 (domingo)
- 2027: La Crida el 28 de febrero a las 20:00 (domingo)
- 2028: La Crida el 27 de febrero a las 20:00 (domingo)

Tests (11 en total):
- Cálculo de fechas (4): 2026, 2027, fin de Fallas, reinicio automático
- UI (2): countdown visible, valores numéricos
- Mensaje bilingüe (5): status ongoing, traducciones, elemento HTML, texto español, cambio a valenciano

Archivo de test:

- `tests/countdown.e2e.spec.js`

### 🎨 Background Gradient (Fondo degradado)

- Verifica que el gradiente azul se aplica correctamente en modo claro
- Valida que el fondo es negro sólido en modo oscuro (después de la transición CSS)
- Comprueba que el fondo cubre todo el viewport (height completo)
- Valida que el gradiente se mantiene al hacer scroll
- Verifica que el CSS compilado contiene las reglas necesarias

El gradiente está implementado directamente en `body` usando `background-image` (no pseudo-elemento):

```scss
body {
  background-color: #0a4b8d;
  background-image: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
  background-repeat: no-repeat;
  background-size: cover;
}
```

En modo oscuro se elimina el gradiente:

```scss
body.modo-oscuro {
  background-color: #000;
  background-image: none;
}
```

**Nota importante sobre transiciones:** El modo oscuro tiene una transición CSS de 2.4s, por lo que los tests esperan 3s para validar el color final.

Archivo de test:

- `tests/background-gradient.e2e.spec.js`

Guía técnica:

- [`global-styles.md`](./global-styles.md)

### 🎬 Gradient Transition (Transición de gradiente en Footer)

- Verifica que el footer tiene un pseudo-elemento `::before` para el gradiente
- Valida que la opacidad del pseudo-elemento es 1 en modo claro
- Valida que la opacidad del pseudo-elemento es 0 en modo oscuro
- Comprueba que la transición está configurada con `opacity`
- Valida transición bidireccional (claro→oscuro y oscuro→claro) de forma gradual

El footer usa un pseudo-elemento para permitir transiciones suaves entre el gradiente azul y el fondo negro:

```scss
.footer {
  position: relative;
  background-color: #02427a; // Color sólido de base

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
    z-index: 0;
    opacity: 1;
    transition: opacity var(--theme-transition, 2.4s ease-in-out);
  }
}

body.modo-oscuro .footer::before {
  opacity: 0;
}
```

**Nota:** El header no usa pseudo-elementos para evitar conflictos de z-index con la navegación móvil (`.nav-backdrop`). Solo el footer tiene transición suave del gradiente.

Archivo de test:

- `tests/gradient-transition.e2e.spec.js`

### 🔄 Theme Transition (Transición de tema)

- Verifica que la clase `transicion-a-claro` se aplica al cambiar de oscuro a claro
- Valida que el header tiene la duración de transición correcta (2.4s)
- Comprueba que el modal-content también tiene la transición configurada

Archivo de test:

- `tests/theme-transition.e2e.spec.js`

### 🎭 Modal Transition (Transición del modal)

Tests para verificar las transiciones suaves del modal "¿Quieres formar parte?":

- **modal-transition.e2e.spec.js**: Verifica que el modal tiene la propiedad `transition` configurada y que el color de fondo cambia al cambiar tema
- **modal-transition-duration.e2e.spec.js**: Valida que la duración es 2.4s y que el cambio es gradual (no instantáneo)
- **modal-dark-to-light.e2e.spec.js**: Test específico para la transición oscuro→claro, verificando colores intermedios

Archivos de test:

- `tests/modal-transition.e2e.spec.js`
- `tests/modal-transition-duration.e2e.spec.js`
- `tests/modal-dark-to-light.e2e.spec.js`

### 🖼️ Background Transition (Transición de fondo)

- Verifica que `body::before` tiene el gradiente y transición de opacidad
- Valida que la sección `.falla` usa `::before` para el overlay con imagen de fondo
- Comprueba que el overlay cambia de color gradualmente en modo oscuro

El patrón de overlay permite transiciones suaves entre el gradiente azul (claro) y el fondo negro (oscuro):

```scss
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: linear-gradient(...);
  opacity: 1;
  transition: opacity var(--theme-transition);
  z-index: -1;
}

body.modo-oscuro::before {
  opacity: 0;
}
```

Archivo de test:

- `tests/background-transition.e2e.spec.js`

### 🔄 Gradient-to-Solid Transitions (Transiciones de gradiente a color sólido)

Verifica que los componentes con gradientes transicionan correctamente usando el patrón de overlay `::before`:

**`.quieres-mas`** (Sección "¿Quieres formar parte?"):
- Verifica estructura CSS: `position: relative`, `::before` con gradiente
- Valida que `opacity` del `::before` es 1 en modo claro y 0 en modo oscuro
- Comprueba transición gradual (2.4s) en ambas direcciones

**`.countdown__contenedor`** (Caja del countdown):
- Mismas validaciones que `.quieres-mas`
- Incluye `overflow: hidden` para respetar `border-radius`

**Patrón CSS:**

```scss
.componente {
  background-color: $color-oscuro; // Color base para modo oscuro
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(...);
    opacity: 1;
    transition: opacity 2.4s ease-in-out;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }
}

body.modo-oscuro .componente::before {
  opacity: 0;
}
```

**Importante:** CSS no puede transicionar entre `linear-gradient` y color sólido. Por eso usamos `opacity` en el pseudo-elemento.

Archivos de test:

- `tests/quieres-mas-transition.e2e.spec.js`
- `tests/countdown-transition.e2e.spec.js`
- `tests/modal-quieres-elements.e2e.spec.js` (diagnóstico de elementos del modal)

## 📦 Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

Instala dependencias:

```bash
npm install
```

## 🧰 Instalación de navegadores (Playwright)

Playwright requiere instalar los navegadores la primera vez en cada máquina:

```bash
npm run test:e2e:install
```

## ▶️ Ejecutar los tests

Ejecución estándar (headless):

```bash
npm run test:e2e
```

Modo UI (útil para depurar):

```bash
npm run test:e2e:ui
```

## 🏗️ Importante: tests contra dist/

La suite está configurada para **servir `dist/`** durante la ejecución, para validar el artefacto real de despliegue.

- Si cambias HTML/SCSS/JS, ejecuta antes:

```bash
npm run build
```

Configuración relacionada:

- `playwright.config.js` (webServer y baseURL)
- `scripts/serve-dist.mjs` (servidor estático local)
- `tests/nav.e2e.spec.js` (navbar)
- `tests/header-mobile-layout.e2e.spec.js` (layout móvil en una fila)
- `tests/header-bar-bg.e2e.spec.js` (fondo de barra del header)
- `tests/nav-transition.e2e.spec.js` (transición de enlaces navbar)
- `tests/monumento-swiper.e2e.spec.js` (Swiper "El Monumento")
- `tests/scrollbar-theme.e2e.spec.js` (Scrollbar + modo oscuro Safari)
- `tests/i18n.e2e.spec.js` (Sistema i18n)
- `tests/scss-guardrails.e2e.spec.js` (Guardrails SCSS)
- `tests/visual-regression.e2e.spec.js` (Regresión visual)
- `tests/og-image.e2e.spec.js` (Validación imagen OG)
- `tests/og-meta-cachebust.e2e.spec.js` (Cache-buster OG en HTML fuente)
- `tests/og-meta-cachebust-dist.e2e.spec.js` (Cache-buster OG en dist/)
- `tests/background-gradient.e2e.spec.js` (Background gradient)
- `tests/background-transition.e2e.spec.js` (Transición de fondo body/falla)
- `tests/gradient-transition.e2e.spec.js` (Transición de gradiente en footer)
- `tests/theme-transition.e2e.spec.js` (Transición de tema oscuro/claro)
- `tests/modal-transition.e2e.spec.js` (Transición del modal)
- `tests/modal-transition-duration.e2e.spec.js` (Duración transición modal)
- `tests/modal-dark-to-light.e2e.spec.js` (Modal oscuro a claro)
- `tests/modal-quieres-elements.e2e.spec.js` (Diagnóstico elementos modal)
- `tests/modal-transition-debug.e2e.spec.js` (Debug visual transición modal)
- `tests/quieres-mas-transition.e2e.spec.js` (Transición gradiente quieres-mas)
- `tests/countdown-transition.e2e.spec.js` (Transición gradiente countdown)
- `tests/countdown.e2e.spec.js` (Countdown de Fallas)
- `tests/nav-mobile-dropdown.e2e.spec.js` (Menú móvil desplegable)

### 📱 Menú móvil desplegable

- Verifica que `.navegacion` tiene `position: absolute` en móvil
- Valida que `.header__barra` NO tiene `overflow: hidden` (recortaría el menú)
- Comprueba fondos translúcidos en modo claro (azul) y oscuro (negro)
- Valida transiciones graduales del patrón overlay `::before`
- Verifica que solo el enlace activo tiene fondo blanco

**Reglas críticas protegidas por estos tests:**

1. **NO usar `overflow: hidden`** en `.header__barra`
2. **Excluir `.navegacion`** del selector `> *` con `:not(.navegacion)`
3. **Fondo `transparent`** en modo claro (gradiente en `::before`)
4. **Transición de 2.4s** sincronizada con el tema

Archivo de test:

- `tests/nav-mobile-dropdown.e2e.spec.js`

Guía técnica:

- [`navigation-bar.md`](./navigation-bar.md)

## 🧯 Troubleshooting

- Error por navegadores no instalados:
  - Ejecuta `npm run test:e2e:install`

- Cambios no reflejados en tests:
  - Ejecuta `npm run build` antes de `npm run test:e2e`

- El comando no ejecuta Playwright (o parece ejecutar otra cosa):
  - Asegúrate de estar en la **raíz** del repo (donde está `package.json`).
  - Como alternativa directa, ejecuta: `npx playwright test`

- Conflictos de puerto (si el servidor no arranca):
  - Revisa el puerto configurado en `playwright.config.js`.

---

*Última actualización: 13 de febrero de 2026 - v4.2.9*
