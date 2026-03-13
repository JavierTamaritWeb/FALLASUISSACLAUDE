# 📚 Documentación Técnica - WEBFALLASUISSA

## 📁 Índice de Documentos

| Documento | Descripción | Actualización |
| ----------- | ------------- | --------------- |
| [`build-and-deploy.md`](./build-and-deploy.md) | Build con Gulp, contenido de `dist/`, despliegue y relación con los tests | 13/03/2026 |
| [`e2e-testing.md`](./e2e-testing.md) | Estrategia Playwright: smoke suite, full suite, validación HOPE, scrollbars y regressions clave | 13/03/2026 |
| [`scrollbar-theme.md`](./scrollbar-theme.md) | Scrollbar general del sitio, caso especial de `llibret_2026.html` y estrategia WebKit/Firefox | 13/03/2026 |
| [`structured-data.md`](./structured-data.md) | JSON-LD del sitio, referencias HOPE-INCLIVA y validación de metadatos técnicos | 13/03/2026 |
| [`architecture-constraints.md`](./architecture-constraints.md) | Constraints de arquitectura que no deben romperse al tocar navegación, gradientes, notificaciones o banner | 13/03/2026 |
| [`scripts-utilities.md`](./scripts-utilities.md) | Scripts utilitarios del repo: OG image, servidor local de `dist/` y migración SCSS | 13/03/2026 |
| [`open-graph-whatsapp.md`](./open-graph-whatsapp.md) | Open Graph para WhatsApp/Facebook/Twitter, `og-share.png` y cache-buster `?v=...` | 09/03/2026 |
| [`navigation-bar.md`](./navigation-bar.md) | Barra de navegación fija, overlay móvil, cierre por Escape/backdrop y layout responsivo | 09/03/2026 |
| [`global-styles.md`](./global-styles.md) | Estilos globales, gradiente base, transición de tema y fondos especiales | 09/03/2026 |
| [`i18n-translations.md`](./i18n-translations.md) | Sistema i18n con `data-i18n`, `translations.json` y textos con markup | 09/03/2026 |
| [`gestion-tablon.md`](./gestion-tablon.md) | Guía canónica del tablón dinámico (`data/board.json`, adjuntos, validación y troubleshooting) | 13/03/2026 |
| [`meteo-ui.md`](./meteo-ui.md) | Animaciones y responsividad del icono meteorológico | 30/01/2026 |
| [`google-search-console.md`](./google-search-console.md) | Verificación en Google Search Console | 09/03/2026 |
| [`robots-configuration.md`](./robots-configuration.md) | Configuración de `robots.txt` y variantes para bots | 09/03/2026 |
| [`swiper-monumento.md`](./swiper-monumento.md) | Swiper “El Monumento”: anti-cropping y autoheight | 09/03/2026 |

## 🎯 Documentos por Categoría

### 🔍 SEO, datos estructurados y bots

- [`structured-data.md`](./structured-data.md): JSON-LD inline, grafos compartidos, HOPE-INCLIVA y validación técnica.
- [`open-graph-whatsapp.md`](./open-graph-whatsapp.md): `og-share.png`, cache-buster y controles anti-regresión.
- [`google-search-console.md`](./google-search-console.md): verificación y alta en Search Console.
- [`robots-configuration.md`](./robots-configuration.md): robots, variantes y relación con sitemaps.
- Índice SEO/IA de la carpeta `seo/`: [`../seo/README.md`](../seo/README.md).

### 🧪 Build, tests y utilidades

- [`build-and-deploy.md`](./build-and-deploy.md): build reproducible y qué sale en `dist/`.
- [`e2e-testing.md`](./e2e-testing.md): qué cubre Playwright y cuándo ejecutar smoke o full suite.
- [`scripts-utilities.md`](./scripts-utilities.md): scripts no diarios pero relevantes para mantenimiento.

### 🎨 Frontend y comportamiento visual

- [`navigation-bar.md`](./navigation-bar.md): barra fija, overlay móvil y accesibilidad base.
- [`scrollbar-theme.md`](./scrollbar-theme.md): scrollbar corporativo global y excepción del llibret digital.
- [`global-styles.md`](./global-styles.md): gradientes, tema oscuro y transiciones de fondo.
- [`swiper-monumento.md`](./swiper-monumento.md): slider principal y protección frente a recortes.
- [`meteo-ui.md`](./meteo-ui.md): icono meteorológico y layout asociado.

### 🧩 Contenido y datos editables

- [`i18n-translations.md`](./i18n-translations.md): traducciones ES/VA y claves `data-i18n`.
- [`gestion-tablon.md`](./gestion-tablon.md): tablón dinámico y `data/board.json`.
- [`architecture-constraints.md`](./architecture-constraints.md): restricciones técnicas que afectan a cambios de contenido, tema y navegación.

## 📝 Notas de Mantenimiento

- [`MANUAL_TABLON.md`](./MANUAL_TABLON.md) se mantiene solo como alias histórico. La guía vigente del tablón es [`gestion-tablon.md`](./gestion-tablon.md).
- La versión funcional documentada del proyecto es `v4.2.16`. `package.json` sigue marcando `4.2.0`, así que para referencias humanas usa la versión publicada en README/CLAUDE hasta que se sincronice.
- Si una guía entra en conflicto con [`../CLAUDE.md`](../CLAUDE.md), prevalece `CLAUDE.md` como fuente operativa del repositorio.

## 🔄 Cuándo actualizar esta carpeta

Actualiza estas guías cuando cambies:

- scripts de `package.json` o utilidades en `scripts/`
- tareas exportadas en `gulpfile.js`
- estructura o artefactos críticos de `dist/`
- archivos SEO de raíz (`robots*.txt`, `sitemap*.xml`, verificaciones `google*.html`)
- JSON-LD inline, metadatos OG/Twitter o referencias a HOPE-INCLIVA
- scrollbars, modo oscuro, gradientes o compatibilidad Safari/WebKit/Firefox
- navegación fija, overlay móvil, z-index o banner de subvención
- sistema de traducciones (`data/translations.json`, claves `data-i18n`)
- sección de colaboraciones, lightbox HOPE y grid compartido
- wrappers HTML de PDFs con Open Graph, favicon y social preview

---

*Documentación técnica de Falla Suïssa - L'Alqueria del Favero*
*Última actualización: 13 de marzo de 2026 - v4.2.16*
