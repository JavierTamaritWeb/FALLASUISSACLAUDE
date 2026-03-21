# 📚 Documentación Técnica - WEBFALLASUISSA

## 📁 Índice de Documentos

| Documento | Descripción | Actualización |
| ----------- | ------------- | --------------- |
| [`build-and-deploy.md`](./build-and-deploy.md) | Build con Gulp, contenido de `dist/`, despliegue y relación con tests funcionales, visuales y snapshots | 20/03/2026 |
| [`e2e-testing.md`](./e2e-testing.md) | Estrategia Playwright: smoke suite, banner, modal sobre DOM real, validación HOPE y aislamiento de regresiones visuales | 20/03/2026 |
| [`scrollbar-theme.md`](./scrollbar-theme.md) | Scrollbar general del sitio, caso especial de `llibret_2026.html` y estrategia WebKit/Firefox | 20/03/2026 |
| [`structured-data.md`](./structured-data.md) | JSON-LD del sitio, referencias HOPE-INCLIVA y validación de metadatos técnicos | 20/03/2026 |
| [`architecture-constraints.md`](./architecture-constraints.md) | Constraints de arquitectura que no deben romperse al tocar navegación, banner, modal, gradientes, reveal, blog-detail o el hook temporal del Swiper del monumento | 20/03/2026 |
| [`scripts-utilities.md`](./scripts-utilities.md) | Scripts utilitarios del repo: OG image, servidor local de `dist/` y migración SCSS | 20/03/2026 |
| [`open-graph-whatsapp.md`](./open-graph-whatsapp.md) | Open Graph para WhatsApp/Facebook/Twitter, `og-share.png` y cache-buster `?v=...` | 20/03/2026 |
| [`navigation-bar.md`](./navigation-bar.md) | Barra de navegación fija, overlay móvil, cierre por Escape/backdrop y layout responsivo | 20/03/2026 |
| [`global-styles.md`](./global-styles.md) | Estilos globales, gradiente base, reveal on scroll, fondos especiales y notas técnicas del banner | 20/03/2026 |
| [`i18n-translations.md`](./i18n-translations.md) | Sistema i18n con `data-i18n`, `translations.json`, `translationsReady`, nodos dinámicos y renderizado por párrafos | 20/03/2026 |
| [`gestion-tablon.md`](./gestion-tablon.md) | Guía canónica del tablón dinámico (`data/board.json`, adjuntos, filtrado de inválidos, validación y troubleshooting) | 20/03/2026 |
| [`meteo-ui.md`](./meteo-ui.md) | Meteo: estructura del widget, animaciones, sincronización con i18n y estabilidad visual | 20/03/2026 |
| [`google-search-console.md`](./google-search-console.md) | Verificación en Google Search Console | 20/03/2026 |
| [`robots-configuration.md`](./robots-configuration.md) | Configuración de `robots.txt` y variantes para bots | 20/03/2026 |
| [`swiper-monumento.md`](./swiper-monumento.md) | Swiper “El Monumento”: anti-cropping, autoheight y hook temporal de la foto real 2026 | 20/03/2026 |
| [`monumento-rotacion-anual.md`](./monumento-rotacion-anual.md) | Checklist anual para cambiar imágenes del monumento y decidir si el hook temporal debe mantenerse o eliminarse | 20/03/2026 |

## 🎯 Documentos por Categoría

### 🔍 SEO, datos estructurados y bots

- [`structured-data.md`](./structured-data.md): JSON-LD inline, grafos compartidos, HOPE-INCLIVA y validación técnica.
- [`open-graph-whatsapp.md`](./open-graph-whatsapp.md): `og-share.png`, cache-buster y controles anti-regresión.
- [`google-search-console.md`](./google-search-console.md): verificación y alta en Search Console.
- [`robots-configuration.md`](./robots-configuration.md): robots, variantes y relación con sitemaps.
- Índice SEO/IA de la carpeta `seo/`: [`../seo/README.md`](../seo/README.md).

### 🧪 Build, tests y utilidades

- [`build-and-deploy.md`](./build-and-deploy.md): build reproducible y qué sale en `dist/`.
- [`e2e-testing.md`](./e2e-testing.md): qué cubre Playwright y cuándo ejecutar smoke o full suite, incluyendo el bloque HOPE y su copy responsive.
- [`scripts-utilities.md`](./scripts-utilities.md): scripts no diarios pero relevantes para mantenimiento.

### 🎨 Frontend y comportamiento visual

- [`navigation-bar.md`](./navigation-bar.md): barra fija, overlay móvil y accesibilidad base.
- [`scrollbar-theme.md`](./scrollbar-theme.md): scrollbar corporativo global y excepción del llibret digital.
- [`global-styles.md`](./global-styles.md): gradientes, tema oscuro, reveal on scroll y transiciones de fondo.
- [`swiper-monumento.md`](./swiper-monumento.md): slider principal, protección frente a recortes y hook temporal de la foto real de 2026.
- [`monumento-rotacion-anual.md`](./monumento-rotacion-anual.md): procedimiento anual para cambiar imágenes del monumento sin arrastrar lógica temporal que ya no haga falta.
- [`meteo-ui.md`](./meteo-ui.md): icono meteorológico y layout asociado.

### 🧩 Contenido y datos editables

- [`i18n-translations.md`](./i18n-translations.md): traducciones ES/VA, claves `data-i18n` y bloques que se renderizan por párrafos.
- [`gestion-tablon.md`](./gestion-tablon.md): tablón dinámico y `data/board.json`.
- [`architecture-constraints.md`](./architecture-constraints.md): restricciones técnicas que afectan a cambios de contenido, tema y navegación.

## 📝 Notas de Mantenimiento

- [`MANUAL_TABLON.md`](./MANUAL_TABLON.md) se mantiene solo como alias histórico. La guía vigente del tablón es [`gestion-tablon.md`](./gestion-tablon.md).
- La versión funcional documentada del proyecto es `v4.6.2` y `package.json`/`package-lock.json` ya están sincronizados con esa release.
- Si una guía entra en conflicto con [`../CLAUDE.md`](../CLAUDE.md), prevalece `CLAUDE.md` como fuente operativa del repositorio.

## 🔄 Cuándo actualizar esta carpeta

Actualiza estas guías cuando cambies:

- scripts de `package.json` o utilidades en `scripts/`
- tareas exportadas en `gulpfile.js`
- estructura o artefactos críticos de `dist/`
- archivos SEO de raíz (`robots*.txt`, `sitemap*.xml`, verificaciones `google*.html`)
- JSON-LD inline, metadatos OG/Twitter o referencias a HOPE-INCLIVA
- scrollbars, modo oscuro, gradientes, reveal on scroll o compatibilidad Safari/WebKit/Firefox
- geometría o set de imágenes del Swiper del monumento, especialmente si tocas `swiper-slide--monumento-real`
- navegación fija, overlay móvil, z-index o banner de subvención
- sistema de traducciones (`data/translations.json`, claves `data-i18n`, renderizado por párrafos en `js/lang.js`)
- coordinación entre i18n y módulos dinámicos como `js/meteo.js`
- sección de colaboraciones, lightbox HOPE, copy responsive y grid compartido
- wrappers HTML de PDFs con Open Graph, favicon y social preview
- flujo del modal “¿Quieres formar parte?”, su dependencia EmailJS o el markup embebido en `index.html`
- estrategias de snapshot visual, estado determinista de tema o estabilización de `.reveal`

---

*Documentación técnica de Falla Suïssa - L'Alqueria del Favero*
*Última actualización: 20 de marzo de 2026 - v4.6.2*
