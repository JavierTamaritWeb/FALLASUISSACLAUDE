# 🧾 Scrollbar y Modo Oscuro (Safari/WebKit)

Esta guía documenta el comportamiento del scrollbar (thumb/track) en modo claro/oscuro y los detalles necesarios para que se aplique correctamente en Safari.

## 🎯 Objetivo

- `thumb` (barra): **siempre** color corporativo `#FF6F61`.
- `track` (fondo):
  - Modo claro: gris claro.
  - Modo oscuro: **casi negro** `#111`.

## 🧠 Por qué Safari es especial

En Safari (y especialmente en macOS/iOS), el scrollbar del viewport puede estar asociado al elemento `html` en lugar de `body`.

Si el modo oscuro solo se activa en `body` (`body.modo-oscuro`), es posible que:

- el scrollbar del viewport no recoja los overrides de `::-webkit-scrollbar-track`.
- visualmente no se vea el track `#111` aunque la regla exista para `body`.

Por eso, el modo oscuro se sincroniza en **`html` y `body`**, y la CSS incluye selectores para ambos.

## 🧩 Implementación (dónde tocar)

### CSS (SCSS)

Archivo principal:
- `scss/animaciones/_modo-oscuro.scss`

Claves de la implementación:
- Reglas WebKit:
  - `::-webkit-scrollbar-thumb` con `#FF6F61`
  - `::-webkit-scrollbar-track` con gris claro
  - Overrides en oscuro para:
    - `body.modo-oscuro` (compat)
    - `html.modo-oscuro` (Safari viewport)
    - `html:has(body.modo-oscuro)` (fallback cuando aplique)

- Reglas Firefox:
  - `scrollbar-color` en `body` y `html`.

### JavaScript (modo oscuro)

Se aplica la clase `modo-oscuro` tanto en `document.body` como en `document.documentElement`:

- `js/dark.js`
  - Al cargar: respeta `localStorage.darkMode`
  - Al hacer click: sincroniza `html` con el estado real de `body`

- `js/lang.js`
  - En su inicialización también aplica la clase, para evitar inconsistencias según el orden de carga.

## 🧪 Tests (para que no se rompa)

Los pseudo-elementos de scrollbar (`::-webkit-scrollbar*`) no son fiables de validar por estilos computados en WebKit, y los screenshots pueden ser frágiles (overlay scrollbars en macOS).

Por eso el test valida:

1) Que el artefacto de producción `dist/css/main.css` contiene los selectores/colores esperados.
2) Que con `localStorage.darkMode=true` el `<html>` queda con `modo-oscuro`.

Archivo:
- `tests/scrollbar-theme.e2e.spec.js`

## 🔁 Flujo recomendado al cambiar tema/scrollbars

1) Cambia SCSS/JS.
2) Regenera `dist/`:

```bash
npm run build
```

3) Ejecuta tests:

```bash
npm run test:e2e
```

## 📝 Nota sobre macOS (overlay scrollbars)

Si en macOS tienes "Mostrar barras de desplazamiento: Automáticamente", el track puede no dibujarse siempre de forma constante (solo aparece durante el scroll). Esto puede afectar a la percepción visual, pero no invalida la regla CSS.

## 🔗 Relacionado

- [`global-styles.md`](./global-styles.md) - Fondo del sitio (`background-image` en body, gradiente en modo claro, negro con `background-image: none` en modo oscuro)

---

*Última actualización: 26 de enero de 2026 - v4.0.0*
