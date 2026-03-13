# 🧱 Constraints de Arquitectura

Esta guía resume las restricciones técnicas del repositorio que no deben romperse al tocar navegación, gradientes, notificaciones, banner institucional o scroll visual.

Si esta guía y `CLAUDE.md` se contradicen, prevalece `CLAUDE.md`.

## 🎯 Objetivo

Evitar regresiones que ya ocurrieron y que hoy están controladas por combinaciones concretas de CSS, HTML, JS y tests.

## 1. Menú móvil y stacking context

Regla:

El backdrop del menú móvil debe seguir insertándose dentro de `.header__barra`, no en `body`.

Por qué:

Moverlo a `body` rompe el stacking context del header fijo y reintroduce conflictos entre botón hamburguesa, overlay y navegación.

Valores que no deben perderse:

- menú: `z-index: 2500`
- backdrop: `z-index: 1500`
- botón menú: `z-index: 2600`

Archivos implicados:

- `js/nav-menu.js`
- `scss/layout/` y componentes del header
- [`navigation-bar.md`](./navigation-bar.md)

Verificación recomendada:

```bash
npm run build
npx playwright test tests/nav.e2e.spec.js
```

## 2. Navegación desktop por encima del glassmorphism

Regla:

En desktop, `.navegacion` necesita `position: relative` y `z-index: 5`.

Por qué:

Sin esa capa, la navegación puede quedar por debajo de overlays visuales del header.

Archivos implicados:

- SCSS del header y navegación desktop
- [`navigation-bar.md`](./navigation-bar.md)

Verificación recomendada:

- `tests/nav.e2e.spec.js`
- comprobación manual de desktop si el cambio toca stacking o glassmorphism

## 3. Gradientes con transición real a oscuro

Regla:

`.quieres-mas` y `.countdown__contenedor` usan pseudo-elementos `::before` para el gradiente. No se debe sustituir ese patrón por cambios directos de `background` entre gradiente y sólido.

Por qué:

CSS no anima bien una transición entre `linear-gradient(...)` y un color sólido. El patrón actual usa opacidad sobre un pseudo-elemento para evitar parpadeos y cortes bruscos.

Archivos implicados:

- `scss/` de los bloques afectados
- [`global-styles.md`](./global-styles.md)

Verificación recomendada:

```bash
npm run build
npx playwright test tests/quieres-mas-transition.e2e.spec.js
npx playwright test tests/countdown-transition.e2e.spec.js
```

## 4. Animación de notificaciones: una sola fuente

Regla:

La regla de animación para `#notificacion.mostrar` debe vivir solo en `_notificaciones.scss`.

Por qué:

Añadir otra regla competidora en `_accessibility.scss` o en otro archivo reintroduce flashes fantasma y estados inconsistentes.

Archivos implicados:

- `scss/components/_notificaciones.scss`
- posibles overrides de accesibilidad o layout del header

Verificación recomendada:

- revisión manual del panel de notificación en home y páginas internas
- smoke suite si el cambio afecta al header

## 5. Banner de subvención: persistencia y renderizado

Persistencia:

Regla:

- el cierre del banner no debe persistirse en `localStorage`
- el comportamiento funcional usa solo `sessionStorage`
- `localStorage.bannerSubvencionCerrado` queda reservado para Playwright

Por qué:

- el banner debe mostrarse en la primera carga de la pestaña
- no debe reaparecer al navegar dentro de la misma pestaña
- debe reaparecer al recargar de verdad

Renderizado y compatibilidad Safari:

Regla:

- mantener `<picture>` con variantes AVIF/WebP/PNG
- no volver a un SVG filtrado directamente

Por qué:

- Safari/WebKit tiene problemas de composición con SVGs que incluyen ciertos filtros internos

Modo oscuro:

Regla:

- mantener `filter: invert(1) hue-rotate(180deg)` en la imagen institucional

Por qué:

- `invert(1)` a secas altera el escudo y rompe los tonos rojos

Archivos implicados:

- `js/banner-subvencion.js`
- HTML de la home
- estilos del banner

Verificación recomendada:

```bash
npm run build
npx playwright test tests/banner-subvencion.e2e.spec.js
```

Si además tocas navegación, tema o snapshots, ejecuta `npm run test:e2e:full`.

## 6. Qué hacer antes de tocar una zona sensible

Checklist rápido:

1. Localiza si la zona está nombrada en esta guía o en `CLAUDE.md`.
2. Comprueba qué tests la cubren.
3. Haz el cambio mínimo posible.
4. Regenera `dist/` con `npm run build`.
5. Ejecuta al menos el spec focalizado; usa la full suite cuando toque tema, navegación, gradientes, OG o meteo.

## 🔗 Relacionado

- [`navigation-bar.md`](./navigation-bar.md)
- [`global-styles.md`](./global-styles.md)
- [`scrollbar-theme.md`](./scrollbar-theme.md)
- [`e2e-testing.md`](./e2e-testing.md)
- [`../CLAUDE.md`](../CLAUDE.md)

---

Última actualización: 13 de marzo de 2026 - v4.2.16
