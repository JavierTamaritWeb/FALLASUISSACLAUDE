---
name: frontend-improve
description: Analiza y mejora el código frontend (SCSS, HTML, JS)
---

# Mejorar Frontend

Analiza y mejora el código frontend del proyecto.

## Instrucciones

Cuando el usuario invoque este skill, sigue estos pasos:

### 1. Identificar el alcance

Pregunta al usuario qué quiere mejorar:
- **Página específica**: Analizar una página HTML concreta
- **Componente SCSS**: Revisar un componente de estilos
- **JavaScript**: Optimizar un módulo JS
- **General**: Análisis completo del proyecto

### 2. Análisis según el tipo

#### Para SCSS/CSS:
- Verificar metodología BEM (Block__Element--Modifier)
- Buscar código duplicado que pueda refactorizarse
- Revisar uso correcto de variables (`scss/abstracts/_variables.scss`)
- Comprobar mixins reutilizables
- Validar breakpoints responsive (767px móvil, 768px+ desktop)
- Revisar transiciones y animaciones (usar `var(--theme-transition)`)
- Verificar compatibilidad modo oscuro

#### Para HTML:
- Validar semántica (header, main, section, article, nav, footer)
- Revisar accesibilidad (alt en imágenes, aria-labels, roles)
- Comprobar atributos `data-i18n` para traducciones
- Verificar estructura de formularios (labels, required, patterns)
- Revisar meta tags (og:image, viewport, description)

#### Para JavaScript:
- Buscar código que pueda modularizarse
- Revisar manejo de eventos (delegación vs listeners directos)
- Comprobar uso de async/await vs callbacks
- Verificar manejo de errores (try/catch)
- Revisar localStorage para persistencia de preferencias

### 3. Verificaciones de rendimiento

- Imágenes: ¿Usan WebP/AVIF? ¿Tienen lazy loading?
- CSS: ¿Hay reglas no utilizadas?
- JS: ¿Hay código muerto o imports no usados?
- Fonts: ¿Usan font-display: swap?

### 4. Verificaciones de accesibilidad

- Contraste de colores suficiente
- Tamaño mínimo de touch targets (44x44px)
- Focus visible en elementos interactivos
- Textos alternativos en imágenes
- Navegación por teclado

### 5. Proponer mejoras

Presenta las mejoras clasificadas:

- 🔴 **Críticas**: Afectan funcionalidad o accesibilidad
- 🟡 **Recomendadas**: Mejoran calidad o rendimiento
- 🟢 **Opcionales**: Refinamientos menores

### 6. Implementar cambios

Si el usuario aprueba:
1. Realizar los cambios propuestos
2. Ejecutar `npm run build`
3. Ejecutar `npm run test:e2e` para verificar que no hay regresiones
4. Mostrar resumen de cambios realizados

## Archivos clave

| Tipo | Ubicación |
|------|-----------|
| Variables SCSS | `scss/abstracts/_variables.scss` |
| Modo oscuro | `scss/animaciones/_modo-oscuro.scss` |
| Traducciones | `data/translations.json` |
| Tests E2E | `tests/*.e2e.spec.js` |
