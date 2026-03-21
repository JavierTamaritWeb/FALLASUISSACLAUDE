# 🧾 Scrollbars, Modo Oscuro y Casos Especiales

Esta guía documenta el comportamiento del scrollbar del sitio en claro/oscuro y el caso especial de [`../llibret_2026.html`](../llibret_2026.html), que no usa la misma paleta ni el mismo punto de implementación que el resto de páginas.

## 🎯 Objetivo

### Sitio general

- `thumb`: color corporativo `#FF6F61`.
- `track`:
  - modo claro: gris claro `#E3E2E2`
  - modo oscuro: casi negro `#111`

### Llibret digital 2026

- `thumb`: dorado `#FFD700`
- `track`: gris claro `#E3E2E2`
- forma del thumb: estrecha y alargada
- longitud mínima del thumb: vinculada a `--nav-float-offset` para aproximarlo a la barra flotante del llibret

## 🧠 Por qué Safari y macOS son especiales

En Safari, y especialmente con overlay scrollbars de macOS/iOS, el scrollbar del viewport puede asociarse a `html` en vez de `body`. Si el modo oscuro solo se refleja en `body`, el track del viewport puede ignorar los overrides de `::-webkit-scrollbar-track`.

Por eso el tema oscuro se sincroniza en `html` y `body`, y la CSS global contempla selectores para ambos estados.

## 🧩 Implementación actual

### 1. Scrollbar global del sitio

Archivo principal:

- `scss/animaciones/_modo-oscuro.scss`

Claves:

- WebKit:
  - `::-webkit-scrollbar-thumb` con `#FF6F61`
  - `::-webkit-scrollbar-track` con gris claro
  - overrides oscuros en `body.modo-oscuro`, `html.modo-oscuro` y `html:has(body.modo-oscuro)`
- Firefox:
  - `scrollbar-color` aplicado en `body` y `html`

### 2. Scrollbar especial del llibret

Archivo:

- [`../llibret_2026.html`](../llibret_2026.html)

Claves:

- La página lleva CSS inline y no depende del SCSS global para el scrollbar.
- En WebKit usa `@supports (selector(::-webkit-scrollbar))` para aislar las reglas nativas del motor.
- En Firefox y navegadores sin pseudo-elementos WebKit usa `@supports not (selector(::-webkit-scrollbar))` con `scrollbar-color` y `scrollbar-width`.
- El `thumb` dorado no es un error: es una decisión específica del documento digital y tiene un test propio.
- La longitud mínima del thumb se fija con `min-height: var(--nav-float-offset)` para acompañar visualmente la barra flotante superior del llibret.

### 3. JavaScript de tema

Archivo:

- `js/dark.js`

Responsabilidades:

- leer `localStorage.darkMode`
- sincronizar `document.body` y `document.documentElement`
- evitar race conditions con otras capas de UI

## 🌐 Estrategia cross-browser

| Motor | Estrategia | Qué se comprueba |
| ------- | ------------ | ------------------ |
| WebKit | `::-webkit-scrollbar*` | color del thumb/track, layout y, en el llibret, validación iPhone emulada |
| Firefox | `scrollbar-color` + `scrollbar-width` | fallback funcional y ausencia de overflow |
| Chromium | soporte WebKit de escritorio | HTML/CSS generado correcto y layout estable |

Regla práctica:

- si tocas el scrollbar global, valida la CSS compilada y el estado de `html`
- si tocas el scrollbar del llibret, valida el HTML generado de la propia página
- no intentes forzar equivalencia visual exacta entre motores: el scrollbar nativo impone límites, sobre todo en macOS

## 🧪 Tests

### Scrollbar global

Archivo:

- `tests/scrollbar-theme.e2e.spec.js`

Valida:

1. que `dist/css/main.css` contiene los colores y selectores esperados
2. que `html` recibe `modo-oscuro` cuando `localStorage.darkMode=true`

### Scrollbar del llibret

Archivo:

- `tests/llibret-scrollbar.e2e.spec.js`

Valida:

1. que `dist/llibret_2026.html` contiene la estructura `@supports` correcta
2. que el `thumb` dorado y el `track` gris claro están presentes
3. que no hay overflow horizontal en escritorio
4. que la vista iPhone emulada se valida en WebKit

## 🔁 Flujo recomendado al tocar scrollbars o tema

### Cambios globales (SCSS/JS)

```bash
npm run build
npm run test:e2e:full
```

### Cambios solo en el llibret

```bash
npm run build
npx playwright test tests/llibret-scrollbar.e2e.spec.js --browser=webkit
npx playwright test tests/llibret-scrollbar.e2e.spec.js --browser=chromium
npx playwright test tests/llibret-scrollbar.e2e.spec.js --browser=firefox
```

Si el cambio toca además tema global, navegación o gradientes, vuelve a la full suite.

## 📝 Nota sobre macOS (overlay scrollbars)

Con la opción del sistema “Mostrar barras de desplazamiento: Automáticamente”, el track puede dibujarse solo mientras haces scroll. Eso afecta a la percepción visual, no a la validez de la CSS.

## 🔗 Relacionado

- [`global-styles.md`](./global-styles.md): gradientes y transición de tema
- [`e2e-testing.md`](./e2e-testing.md): estrategia de pruebas Playwright
- [`architecture-constraints.md`](./architecture-constraints.md): restricciones que afectan a navegación, gradientes y banner

---

Última actualización: 20 de marzo de 2026 - v4.6.2
