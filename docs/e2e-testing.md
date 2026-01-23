# 🧪 Tests E2E (Playwright)

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

*Última actualización: 23 de enero de 2026*
