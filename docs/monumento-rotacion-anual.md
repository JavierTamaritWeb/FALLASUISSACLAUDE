# Rotación anual de imágenes del monumento

Esta guía existe para el mantenimiento del visor del monumento cuando cambia el ejercicio fallero. El objetivo es evitar dos errores frecuentes:

- cambiar solo los nombres de archivo y dejar lógica visual heredada que ya no aplica
- borrar el hook temporal de 2026 sin comprobar antes si la nueva foto real necesita un ajuste similar

Si solo necesitas entender el visor actual, consulta `docs/swiper-monumento.md`. Esta guía está centrada en la rotación anual y en la posible retirada del hook `swiper-slide--monumento-real`.

## Qué cambia normalmente cada año

En el visor del monumento suelen cambiar:

- las rutas de imagen
- los textos `alt`
- el año mencionado en esos `alt`
- la proporción real de las fotos del monumento
- la necesidad o no de mantener un ajuste visual específico para la foto real principal

## Archivos que debes revisar siempre

- `index.html`
- `lafalla.html`
- `tests/monumento-swiper.e2e.spec.js`
- `src/scss/animaciones/_swiper.scss`
- `docs/swiper-monumento.md`
- `docs/architecture-constraints.md`
- `docs/README.md` si se renombra o se retira esta guía

No edites `dist/` a mano. Regénéralo con build.

## Búsquedas rápidas recomendadas

Antes de tocar nada, busca al menos estas cadenas en el repo:

- `falla2026.avif`
- `falla2026-Infantil.avif`
- `falla2026-real.avif`
- `falla2026-infantil-real.avif`
- `swiper-slide--monumento-real`
- `falla2026-real\\.avif`

La última es importante porque aparece en la validación del test E2E.

## Secuencia recomendada de cambio anual

### 1. Sustituir las rutas y los textos alternativos

Actualiza primero el markup base en:

- `index.html`
- `lafalla.html`

Revisa:

- nombres de archivo
- orden de slides
- textos `alt`
- año referenciado en los `alt`
- prioridades de carga (`eager`, `lazy`, `fetchpriority`)

### 2. Ajustar el test al nuevo set de slides

`tests/monumento-swiper.e2e.spec.js` valida el array exacto de slides base. Si cambian los nombres, el test fallará aunque el visor se vea bien.

Debes actualizar:

- `expectedSrcs`
- cualquier regex de navegación que apunte a la slide real principal

## Cómo decidir si el hook temporal sigue siendo necesario

El hook actual se apoya en:

- clase HTML: `swiper-slide--monumento-real`
- selector SCSS: `:has(.swiper-slide-active.swiper-slide--monumento-real)`

No lo mantengas por costumbre. Haz esta comprobación:

### Mantener o ajustar el hook si ocurre al menos una de estas situaciones

- la nueva foto real principal se sigue viendo demasiado pequeña en `>= 768px`
- con la geometría general del visor no aprovecha bien el ancho disponible
- al compararla con el resto de slides queda visualmente muy contenida
- al quitar el hook la composición pierde equilibrio en desktop

### Eliminar el hook si ocurre todo esto

- la nueva foto real principal ya se ve proporcionada con la geometría general
- no hay solape con botones usando solo la regla general de 3.5rem
- la ampliación adicional ya no aporta una mejora clara
- la tercera slide pasa los tests sin la clase y sin las reglas específicas

## Si el hook deja de hacer falta

Haz la retirada completa, no parcial.

### Cambios a eliminar

En HTML:

- quitar `swiper-slide--monumento-real` de `index.html`
- quitar `swiper-slide--monumento-real` de `lafalla.html`

En SCSS:

- eliminar la regla que baja el `padding-inline` a 3rem
- eliminar la recolocación especial de `.swiper-button-prev`
- eliminar la recolocación especial de `.swiper-button-next`
- eliminar la ampliación de `max-width: 70rem` ligada a la slide real activa

En documentación:

- actualizar `docs/swiper-monumento.md`
- actualizar `docs/architecture-constraints.md`
- revisar esta misma guía para reflejar que el hook ya no existe

En tests:

- mantener la cobertura de la tercera slide
- adaptar solo nombres o regex si han cambiado los assets

## Si el hook sigue siendo necesario pero cambia la foto

Puede ocurrir que el patrón general siga sirviendo, pero la nueva imagen necesite otro ajuste fino.

En ese caso:

1. conserva la clase solo si sigue describiendo una slide concreta y justificada
2. prueba primero cambios mínimos en padding y anchura máxima
3. no apliques reglas permanentes a todo el carrusel por resolver un único caso
4. verifica siempre que no reaparece el solape con botones

La lección de 2026 es importante:

- reducir padding de forma estática parecía suficiente
- pero rompía la separación con el botón previo en tablet y desktop
- por eso el ajuste final quedó condicionado al estado activo de esa slide

## Qué validar visualmente antes de cerrar el cambio

Comprueba al menos esto en `index.html` y `lafalla.html`:

- la foto real principal se ve completa
- no aparece recorte lateral ni vertical
- no hay overflow horizontal del documento
- no se ven dos slides a la vez en tablet o desktop
- los botones no pisan la imagen activa
- el cambio de altura del Swiper sigue siendo natural

## Comandos de validación

```bash
npm run build
npx playwright test tests/monumento-swiper.e2e.spec.js
npm run test:e2e
```

Si el ajuste ha tocado geometría, snapshots o layout compartido, termina con:

```bash
npm run test:e2e:full
```

## Señales de que la rotación quedó incompleta

- el test del Swiper falla por `expectedSrcs`
- la tercera slide ya no coincide con la regex del test
- la documentación sigue hablando de `falla2026-real.avif`
- existe la clase `swiper-slide--monumento-real`, pero ya no hay razón visual para conservarla
- alguien ha tocado `dist/` manualmente para salir del paso

## Regla operativa

Cuando cambie el juego de imágenes del monumento, asume por defecto que el hook temporal debe reevaluarse. Solo debe sobrevivir si la nueva foto real demuestra que sigue aportando valor.

---

Última actualización: 20 de marzo de 2026 - v4.6.2
