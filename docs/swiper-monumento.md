# 🖼️ Swiper en “El Monumento” (anti-cropping + autoheight)

Esta guía explica cómo está integrado Swiper en el proyecto y qué convenciones seguimos para evitar problemas típicos (cropping, altura incorrecta, controles cruzados entre sliders, etc.).

## ✅ Objetivo

- Evitar que las imágenes del slider se **recorten** (especialmente en fotos horizontales).
- Mantener un comportamiento **responsive**.
- Asegurar que cada Swiper se inicializa **por instancia** (sin controles globales).

## 📌 Archivos implicados

- JS (inicialización Swiper): `js/swiper.js`
- SCSS (estilos Swiper): `scss/animaciones/_swiper.scss`
- HTML (uso principal): `index.html` y/o `lafalla.html`
- Tests E2E: `tests/monumento-swiper.e2e.spec.js`

## 🧱 Markup recomendado

- Usa un contenedor `.swiper` por slider.
- Incluye sus controles **dentro** del contenedor (pagination/nav/scrollbar).

Ejemplo (resumido):

```html
<div class="swiper swiper--autoheight" data-testid="monumento-swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide"><img src="img/falla2026.avif" alt="Monumento principal" /></div>
    <div class="swiper-slide"><img src="img/falla2026-Infantil.avif" alt="Monumento infantil" /></div>
    <div class="swiper-slide"><img src="img/falla2026-real.avif" alt="Vista real del monumento principal" /></div>
    <div class="swiper-slide"><img src="img/falla2026-infantil-real.avif" alt="Vista real del monumento infantil" /></div>
  </div>

  <div class="swiper-pagination"></div>
  <div class="swiper-button-prev"></div>
  <div class="swiper-button-next"></div>
  <div class="swiper-scrollbar"></div>
</div>
```

## 🧾 Estado actual del slider (marzo 2026)

El visor del monumento en [`index.html`](../index.html) y [`lafalla.html`](../lafalla.html) trabaja ahora con **4 slides base no duplicadas**:

- `img/falla2026.avif`
- `img/falla2026-Infantil.avif`
- `img/falla2026-real.avif`
- `img/falla2026-infantil-real.avif`

Convención actual de carga:

- las 2 primeras imágenes usan carga prioritaria/eager
- las 2 fotos reales usan `loading="lazy"`

La suite `tests/monumento-swiper.e2e.spec.js` valida el set exacto de slides base y evita contar los duplicados internos que Swiper añade cuando `loop: true` está activo.

## 🎚️ Modo autoheight (cuándo usarlo)

Este repo usa una convención: si el contenedor tiene la clase:

- `.swiper--autoheight`

…entonces el Swiper se inicializa con `autoHeight` y además fuerza recalculado de altura tras cargas/transiciones.

Usa `.swiper--autoheight` cuando:

- Las imágenes tienen **ratios** diferentes.
- Hay riesgo de CLS visual o “corte” por altura fija.

No lo uses si:

- Todas las slides tienen la misma altura y prefieres un layout estable.

## 🧠 Por qué el “cropping” suele pasar

Normalmente pasa por una combinación de:

- `object-fit: cover` (recorte intencional) o un alto fijo en el contenedor.
- Swiper calculando altura antes de que las imágenes terminen de cargar/decodificar.

La solución aquí se basa en:

- Estilos que priorizan **no recortar**.
- Recalcular altura tras `load/decode` y en eventos de transición.

## 🧪 Tests

La suite incluye una batería para asegurar que el slider de “El Monumento” no se recorta ni se desborda en viewports típicos.

### Nota importante sobre `.reveal`

En `index.html`, el Swiper vive dentro de `.falla__monumento.reveal`. Por eso, los tests que interactúan con las flechas del slider deben:

- hacer `scrollIntoViewIfNeeded()` sobre el Swiper
- esperar a que el bloque reveal esté visible y estable
- solo entonces clicar navegación

Sin ese paso, Playwright puede medir una geometría transitoria y detectar falsamente varias slides visibles a la vez.

- Ejecuta: `npm run test:e2e:full`
- Nota: los tests se ejecutan contra `dist/`, así que conviene hacer `npm run build` antes.

---

Última actualización: 18 de marzo de 2026 - v4.2.16
