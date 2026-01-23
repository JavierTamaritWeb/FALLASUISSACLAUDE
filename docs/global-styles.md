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

El fondo del sitio se implementa con un pseudo-elemento `::before` fijo:

```scss
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(135deg, #0a4b8d 0%, #02427a 60%, #003366 100%);
}
```

**Por qué usar `::before` en lugar de `background` directo:**
- `position: fixed` asegura que el fondo cubra todo el viewport
- Evita problemas de altura en páginas cortas
- El gradiente no se repite ni se corta al hacer scroll
- Compatible con todos los navegadores modernos

### Colores del gradiente (modo claro)

| Posición | Color | Descripción |
|----------|-------|-------------|
| 0% | `#0a4b8d` | Azul corporativo |
| 60% | `#02427a` | Azul medio |
| 100% | `#003366` | Azul oscuro |

## 🌙 Modo Oscuro

En modo oscuro, el fondo cambia a negro sólido:

```scss
body.modo-oscuro::before {
  background: v.$negro; // #000
}
```

La transición entre modos se gestiona automáticamente por `js/dark.js`.

## 🧩 Integración con otros archivos

El archivo `_globales.scss` se importa en `main.scss` después de `normalize`:

```scss
@use 'abstracts/normalize';
@use 'abstracts/globales';
@use 'abstracts/accessibility';
```

**Importante:** No definir `background` en otros archivos para evitar conflictos. Los backgrounds duplicados fueron eliminados de:
- `scss/base/_typography.scss`
- `scss/animaciones/_modo-oscuro.scss`

## ⚠️ Consideraciones

### Orden de cascada
El archivo `_globales.scss` se carga temprano. Si defines backgrounds en archivos posteriores, sobrescribirán el gradiente.

### z-index
El pseudo-elemento usa `z-index: -1` para quedar detrás del contenido. No uses `z-index` negativos en otros elementos que deban verse.

### Safari/iOS
El uso de `position: fixed` en el pseudo-elemento es compatible con Safari/iOS sin problemas de `transform`.

## 🧪 Verificación

Para verificar que el fondo funciona correctamente:

1. Modo claro: debe verse el gradiente azul
2. Modo oscuro: debe verse fondo negro sólido
3. Scroll: el fondo debe permanecer fijo

```bash
npm run build
npm run test:e2e
```

---

*Última actualización: 23 de enero de 2026*
