# Swiper en "El Monumento" (anti-cropping + autoheight + hook temporal)

Esta guía documenta el visor del monumento tal y como está implementado en marzo de 2026. El objetivo no es solo describir cómo funciona hoy, sino dejar claro qué parte es estructural y qué parte es un ajuste temporal ligado a las imágenes del ejercicio 2025-2026.

## Objetivo

- evitar recortes de imagen en el slider
- mantener un comportamiento responsive consistente entre home y página interna
- asegurar que cada instancia usa sus propios controles
- documentar el hook temporal de la foto real principal para que pueda reevaluarse o eliminarse el próximo ejercicio

## Archivos implicados

- JS de inicialización: `js/swiper.js`
- SCSS del componente: `scss/animaciones/_swiper.scss`
- HTML principal: `index.html`
- HTML duplicado en interna: `lafalla.html`
- Test E2E dedicado: `tests/monumento-swiper.e2e.spec.js`
- Constraint de arquitectura relacionada: `docs/architecture-constraints.md`
- Mantenimiento anual: `docs/monumento-rotacion-anual.md`

## Markup actual del visor

El visor del monumento vive hoy en `index.html` y `lafalla.html` con la misma estructura base:

```html
<div class="swiper swiper--autoheight contenedor" data-testid="monumento-swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">
      <img src="img/falla2026.avif" alt="Monumento fallero principal de la Falla Suïssa 2026">
    </div>
    <div class="swiper-slide">
      <img src="img/falla2026-Infantil.avif" alt="Monumento fallero infantil de la Falla Suïssa 2026">
    </div>
    <div class="swiper-slide swiper-slide--monumento-real">
      <img src="img/falla2026-real.avif" alt="Vista real del monumento fallero principal de la Falla Suïssa 2026">
    </div>
    <div class="swiper-slide">
      <img src="img/falla2026-infantil-real.avif" alt="Vista real del monumento fallero infantil de la Falla Suïssa 2026">
    </div>
  </div>

  <div class="swiper-pagination"></div>
  <div class="swiper-button-prev"></div>
  <div class="swiper-button-next"></div>
  <div class="swiper-scrollbar"></div>
</div>
```

## Estado actual del slider (marzo 2026)

El visor del monumento trabaja con 4 slides base no duplicadas:

- `img/falla2026.avif`
- `img/falla2026-Infantil.avif`
- `img/falla2026-real.avif`
- `img/falla2026-infantil-real.avif`

Convención actual de carga:

- las 2 primeras imágenes usan carga prioritaria o eager
- las 2 fotos reales usan `loading="lazy"`

La tercera slide, la de `img/falla2026-real.avif`, lleva una clase extra:

- `swiper-slide--monumento-real`

Esa clase no forma parte del contrato general del componente. Es un hook visual temporal que existe únicamente para la foto real principal de 2026.

## Relación con `js/swiper.js`

El comportamiento base del visor no depende del hook temporal. Lo gobierna `js/swiper.js`:

- inicializa cada `.swiper` por instancia
- activa `autoHeight` cuando el contenedor tiene `.swiper--autoheight`
- recalcula la altura tras carga o decode de imágenes
- vuelve a recalcular altura tras cada transición de slide

Esto significa que el contrato estructural del componente es:

- `loop: true`
- `autoHeight` condicionado por clase
- controles locales a la instancia
- `object-fit: contain` en las imágenes

El hook `swiper-slide--monumento-real` se superpone a ese comportamiento, pero no lo sustituye.

## Por qué el cropping suele pasar

Los problemas típicos en este visor aparecen por una combinación de:

- `object-fit` incorrecto
- altura fija del contenedor
- ancho excesivo del Swiper en desktop
- cálculo de altura antes de que las imágenes hayan terminado de cargar
- botones laterales ocupando espacio visual sobre fotos más anchas

La solución base del repositorio es:

- `object-fit: contain` para evitar recorte
- `swiper--autoheight` para adaptar la altura al slide activo
- contención de ancho en `scss/animaciones/_swiper.scss`
- padding lateral por slide en tablet y desktop para reservar hueco a los botones

## Regla general de layout en tablet y desktop

En `>= 768px`, el visor usa un margen lateral de seguridad dentro de cada slide:

```scss
.swiper.swiper--autoheight .swiper-slide {
  padding-inline: 3.5rem;
}
```

Ese padding cumple dos funciones a la vez:

- deja espacio a los botones prev/next
- evita que "asome" la slide siguiente

Con 3rem como valor general, el botón previo podía llegar a invadir algunos píxeles del área útil de la imagen. Por eso el valor general estable quedó en 3.5rem.

## Hook temporal de `falla2026-real.avif`

### Qué problema resuelve

La foto real principal `img/falla2026-real.avif` se veía más pequeña de lo deseado en pantallas superiores a 768px. El usuario pidió que se viera más grande en ambos visores, pero sin romper ninguna de estas garantías:

- sin solape con botones
- sin overflow horizontal
- sin mostrar dos slides a la vez
- sin perder `autoHeight`

### Qué se probó primero y por qué no bastó

El primer intento fue reducir el padding lateral de esa slide concreta a 3rem siempre.

Resultado:

- la imagen ganaba algo de tamaño
- pero en tablet y desktop el botón previo podía solaparse con el contenido de la imagen activa

Conclusión:

- 3rem no era un valor seguro como regla estática para todo el estado del visor
- el ajuste tenía que activarse solo cuando esa foto concreta fuera la slide activa

### Solución final implementada

La solución estable usa un selector condicional con `:has(...)`:

```scss
@media (min-width: 768px) {
  .swiper.swiper--autoheight:has(.swiper-slide-active.swiper-slide--monumento-real) .swiper-slide--monumento-real {
    padding-inline: 3rem;
  }

  .swiper.swiper--autoheight:has(.swiper-slide-active.swiper-slide--monumento-real) .swiper-button-prev {
    left: 0;
  }

  .swiper.swiper--autoheight:has(.swiper-slide-active.swiper-slide--monumento-real) .swiper-button-next {
    right: 0;
  }
}

@media (min-width: 1200px) {
  .swiper.swiper--autoheight:has(.swiper-slide-active.swiper-slide--monumento-real) {
    max-width: 70rem;
  }
}
```

### Qué hace exactamente

Cuando la slide activa es la que tiene simultáneamente:

- `.swiper-slide-active`
- `.swiper-slide--monumento-real`

entonces el visor cambia temporalmente su geometría:

- la slide real usa `padding-inline: 3rem` en vez de 3.5rem
- el botón previo se pega al borde izquierdo (`left: 0`)
- el botón siguiente se pega al borde derecho (`right: 0`)
- en `>= 1200px`, el contenedor pasa de `max-width: 64rem` a `max-width: 70rem`

El resto del tiempo, el visor conserva la regla general más conservadora.

### Por qué esta solución es la correcta hoy

Porque concentra el ajuste en el único estado donde hace falta:

- solo para la foto real principal
- solo cuando está activa
- solo en breakpoints donde ese ajuste aporta valor

Eso reduce el riesgo de que el resto del carrusel herede una geometría innecesariamente agresiva.

### Por qué no debe tratarse como patrón genérico

Este hook no describe una categoría abstracta de slides. Describe una necesidad concreta de `img/falla2026-real.avif` en el ejercicio actual.

Por tanto:

- no debe copiarse a otras slides por inercia
- no debe renombrarse como si fuera una feature general del Swiper
- no debe conservarse automáticamente cuando cambien las imágenes de 2027

Si el año que viene la nueva foto real no necesita este empuje visual, lo correcto será eliminar la clase y sus reglas SCSS, no arrastrarlas por costumbre.

## Tests que protegen este contrato

La suite `tests/monumento-swiper.e2e.spec.js` valida el visor sobre `index.html` y `lafalla.html` en mobile, tablet y desktop.

Cobertura relevante:

- el set exacto de 4 slides base
- `object-fit: contain` en la imagen activa
- una sola slide visible en tablet y desktop
- ausencia de overflow horizontal en desktop
- ausencia de solape entre botones y la imagen activa
- estabilidad de `autoHeight`
- navegación hasta la tercera slide `falla2026-real.avif`

Detalle importante:

- la suite ya no valida solo la slide inicial y la segunda
- ahora también navega hasta la tercera slide para proteger específicamente el hook temporal

## Interacción con `.reveal`

En `index.html`, el Swiper vive dentro de `.falla__monumento.reveal`. Por eso los tests que interactúan con las flechas del slider deben:

- hacer `scrollIntoViewIfNeeded()` sobre el Swiper
- esperar a que el reveal esté visible y estable
- solo entonces clicar navegación

Sin ese paso, Playwright puede medir una geometría transitoria y detectar falsamente varias slides visibles a la vez.

## Mantenimiento anual

La rotación anual de imágenes del monumento no es solo un cambio de `src`. También puede invalidar el hook temporal.

Checklist rápido:

1. cambiar imágenes y `alt` en `index.html` y `lafalla.html`
2. actualizar el set esperado de `tests/monumento-swiper.e2e.spec.js`
3. revisar visualmente si la nueva foto real principal sigue necesitando el hook
4. si no lo necesita, eliminar `swiper-slide--monumento-real` y las reglas `:has(...)`
5. ejecutar build y tests antes de darlo por cerrado

Guía detallada de esa rotación: `docs/monumento-rotacion-anual.md`

## Verificación recomendada

```bash
npm run build
npx playwright test tests/monumento-swiper.e2e.spec.js
npm run test:e2e
npm run test:e2e:full
```

## Resumen operativo

- `swiper--autoheight` y `js/swiper.js` son parte estable del componente
- `swiper-slide--monumento-real` es un hook temporal, específico de 2026
- si las imágenes del próximo ejercicio cambian de proporción, hay que reevaluar ese hook antes de conservarlo o eliminarlo

---

Última actualización: 20 de marzo de 2026 - v4.6.2
