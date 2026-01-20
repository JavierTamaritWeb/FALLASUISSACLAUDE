# 📚 Documentación Técnica - WEBFALLASUISSA

## 📁 Índice de Documentos

| Documento | Descripción | Actualización |
|-----------|-------------|---------------|
| [`build-and-deploy.md`](./build-and-deploy.md) | Guía de build, `dist/` y despliegue | 17/01/2026 |
| [`e2e-testing.md`](./e2e-testing.md) | Tests end-to-end (Playwright) | 17/01/2026 |
| [`navigation-bar.md`](./navigation-bar.md) | Barra de navegación: header fijo, menú móvil, layout móvil en una fila, accesibilidad y Safari/iOS | 17/01/2026 |
| [`swiper-monumento.md`](./swiper-monumento.md) | Swiper “El Monumento”: anti-cropping + autoheight | 15/01/2026 |
| [`scrollbar-theme.md`](./scrollbar-theme.md) | Scrollbar (thumb/track) + modo oscuro, compat Safari/WebKit | 15/01/2026 |
| [`i18n-translations.md`](./i18n-translations.md) | i18n: `data-i18n` + `translations.json` (saltos de línea, claves, textos con markup) | 17/01/2026 |
| [`google-search-console.md`](./google-search-console.md) | Verificación Google Search Console | 15/01/2026 |
| [`robots-configuration.md`](./robots-configuration.md) | Configuración robots.txt y variantes | 15/01/2026 |

## 🎯 Documentos por Categoría

### 🔍 **SEO y Buscadores**
- **Google Search Console:** Verificación paso a paso
- **Robots.txt:** Configuración optimizada para bots
- **Sitemaps:** Generación y publicación (ver guía de build/despliegue)

Índice SEO/IA (carpeta `seo/`): [`../seo/README.md`](../seo/README.md)

### 📋 **Próximos Documentos Planificados**
- [ ] `sitemap-configuration.md` - Configuración de sitemaps
- [ ] `structured-data.md` - Datos estructurados Schema.org
- [ ] `performance-optimization.md` - Optimización Core Web Vitals
- [ ] `accessibility-guide.md` - Guía de accesibilidad WCAG
- [ ] `deployment-guide.md` - Guía de despliegue y hosting (si cambian proveedores/entornos)

## 📄 **Formato de Documentación**

Todos los documentos siguen este estándar:

- ✅ **Markdown** con sintaxis Github Flavored
- ✅ **Emojis** para mejor legibilidad
- ✅ **Ejemplos de código** con syntax highlighting
- ✅ **Tablas** para información estructurada
- ✅ **Enlaces** a recursos externos
- ✅ **Fecha de actualización** en cada documento

## 🔄 **Mantenimiento**

Actualiza estos documentos cuando cambies:

- Scripts de `package.json`
- Tareas exportadas en `gulpfile.js`
- Estructura de `dist/` (si se despliega/commitea)
- Archivos SEO en la raíz (`robots*.txt`, `sitemap*.xml`, verificaciones `google*.html`)
- Sistema de traducciones (`data/translations.json`, claves `data-i18n`)
- Integración de sliders (Swiper) y sus tests E2E
- Sistema de tema (modo oscuro) y compatibilidad de scrollbar (Safari/WebKit)
- Transición oscuro→claro (clase temporal `transicion-a-claro` y variables de transición)

---

*Documentación técnica de Falla Suïssa - L'Alqueria del Favero*  
*Última actualización: 17 de enero de 2026*
