# 🎭 WEBFALLASUISSA

<div align="center">

![Falla Suïssa](https://fallasuissa.es/img/Escudo_falla.png)

**Página web oficial de la Falla Suïssa - L'Alqueria del Favero (Falla #396)**

*Desarrollada con tecnologías modernas y optimizada para ofrecer la mejor experiencia a falleros y visitantes*

[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffallasuissa.es)](https://fallasuissa.es)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Gulp](https://img.shields.io/badge/Built%20with-Gulp-CF4647)](https://gulpjs.com/)
[![SCSS](https://img.shields.io/badge/CSS-SCSS-hotpink)](https://sass-lang.com/)
[![SEO Optimized](https://img.shields.io/badge/SEO-Optimized-brightgreen)](https://search.google.com/search-console)
[![Google Ready](https://img.shields.io/badge/Google-Ready-4285F4)](https://developers.google.com/web)
[![File Structure](https://img.shields.io/badge/Structure-Organized-success)](https://github.com/)
[![Search Console](https://img.shields.io/badge/Search%20Console-Ready-blue)](https://search.google.com/search-console)
[![Documentation](https://img.shields.io/badge/Docs-Markdown-informational)](./docs/)
[![AI Optimized](https://img.shields.io/badge/AI-Optimized-purple)](https://openai.com/)

**🆕 Última actualización:** 17 de enero de 2026 - Header móvil en una sola fila (botones izq, notificación centrada, menú dcha) + tests E2E de regresión

</div>

## 🌐 Vista Previa

**🔗 URL Oficial:** [https://fallasuissa.es](https://fallasuissa.es)

> Una web moderna que representa la tradición fallera valenciana con las mejores prácticas de desarrollo web

## ✨ Características Principales

### 🎨 **Diseño y UX**
- **Diseño responsivo** - Adaptación perfecta a todos los dispositivos
- **Modo oscuro/claro** - Alternancia automática según preferencias del usuario
- **Transición asimétrica de tema** - Oscuro→claro más suave; claro→oscuro mantiene la respuesta actual
- **Scrollbar consistente** - Thumb corporativo + track oscuro `#111` (Safari/WebKit incluido)
- **Animaciones fluidas** - Transiciones suaves y efectos visuales atractivos
- **Accesibilidad WCAG** - Cumple estándares de accesibilidad web
- **Footer optimizado** - Navegación tipo “chips” (bordes sutiles), enlace activo legible en oscuro e iconos sociales responsive (más pequeños en móvil, más grandes en desktop)

#### 🧭 Barra de navegación (Header fijo)

- Barra siempre visible en scroll (`position: fixed`) con soporte de `safe-area-inset-top` (iPhone notch)
- Menú móvil tipo overlay (hamburguesa + backdrop + cierre con Escape)
- En móvil (<768px): layout en una sola fila (botones izquierda, notificación centrada, menú derecha)
- Targets táctiles de **44px** y foco accesible con `:focus-visible`

Guía técnica completa: [`docs/navigation-bar.md`](./docs/navigation-bar.md)

### ⚡ **Performance y Optimización**
- **Imágenes modernas** - Formatos WebP y AVIF para carga ultrarrápida
- **CSS optimizado** - Minificación y autoprefixer automático
- **Lazy loading** - Carga diferida de imágenes y recursos
- **Critical CSS** - Priorización de estilos críticos

### 🌍 **Multiidioma**
- **🇪🇸 Español** - Idioma por defecto
- **🇻🇦 Valenciano** - Soporte completo para la lengua local
- **Cambio dinámico** - Sin recarga de página
- **Contenido con markup** - Si un texto necesita mantener `<span>` u otros elementos, usa varias claves `data-i18n` en elementos separados

Guía técnica: [`docs/i18n-translations.md`](./docs/i18n-translations.md)

### 📱 **Tecnología Avanzada**
- **PWA Ready** - Instalable como aplicación móvil
- **SEO Profesional** - Meta tags, Schema.org, sitemaps
- **Datos estructurados** - JSON-LD para mejor indexación
- **Analytics ready** - Preparado para Google Analytics

### 🟦 **Open Graph (WhatsApp/Facebook/Twitter)**
- Imagen OG optimizada `img/og-share.png` (1200×630, fondo sólido, <300KB)
- Cache-buster `?v=...` para evitar problemas de caché en WhatsApp

Guía técnica: [`docs/open-graph-whatsapp.md`](./docs/open-graph-whatsapp.md)

## 🏗️ Stack Tecnológico

### **Frontend**
- **HTML5** - Estructura semántica y accesible
- **SCSS/CSS3** - Estilos modulares con Sass y metodología BEM
- **JavaScript ES6+** - Funcionalidades interactivas modernas
- **CSS Grid/Flexbox** - Layouts avanzados y responsivos

### **Build Tools**
- **Gulp 5** - Automatización de tareas (build + watch)
- **Sass (Dart Sass)** - Compilación SCSS vía `gulp-sass`
- **PostCSS** - Autoprefixer + minificación con cssnano
- **Sharp** - Conversión de imágenes a WebP/AVIF

### **Librerías y Frameworks**
- **Swiper.js** - Carruseles y sliders táctiles
- **Flatpickr** - Selector de fechas avanzado
- **DOMPurify** - Sanitización de contenido
- **Google Fonts** - Tipografías optimizadas

Guía técnica (slider principal): [`docs/swiper-monumento.md`](./docs/swiper-monumento.md)

Guía técnica (modo oscuro + scrollbar Safari/WebKit): [`docs/scrollbar-theme.md`](./docs/scrollbar-theme.md)

## 📁 Arquitectura del Proyecto

### **Estructura Principal**

```text
WEBFALLASUISSA/
├── 📄 *.html                  # Páginas HTML (home + internas)
├── 📂 scss/                   # Arquitectura Sass modular
│   ├── abstracts/             # Variables, mixins, funciones
│   ├── base/                  # Reset, tipografía, base
│   ├── layout/                # Header, footer, grid
│   ├── components/            # Componentes reutilizables
│   ├── animaciones/           # Efectos y transiciones
│   └── sociales/              # Estilos para redes sociales
├── 📂 js/                     # Módulos JavaScript
│   ├── acc.js                 # Acordeones interactivos
│   ├── calendario.js          # Sistema de calendario
│   ├── countdown.js           # Cuenta atrás para Fallas
│   ├── dark.js                # Modo oscuro/claro
│   ├── lang.js                # Sistema multiidioma
│   ├── nav-menu.js            # Menú móvil (hamburguesa + overlay)
│   ├── meteo.js               # Integración meteorológica
│   ├── galeria_[1-4].js       # Galerías especializadas
│   └── swiper.js              # Carruseles y sliders
├── 📂 data/                   # Datos JSON estructurados
│   ├── translations.json      # 846 líneas de traducciones
│   ├── eventos.json           # Gestión de eventos
│   ├── calendarData.json      # Datos del calendario
│   ├── fallas.json            # Información de fallas
│   └── dataPages[1-4].json    # Datos para galerías
├── 📂 img/                    # Recursos visuales
├── 📂 pdf/                    # Documentos oficiales
├── 📂 favicon_io/             # Iconos y favicons
├── 📂 tests/                  # Tests E2E (Playwright)
├── 📂 scripts/                # Utilidades (p.ej. servidor local para dist)
├── 📂 dist/                   # Build de producción
├── 📄 gulpfile.js             # Configuración Gulp
├── 📄 package.json            # Dependencias npm
├── 📄 robots.txt              # SEO crawlers
└── 📄 sitemap*.xml            # Mapas del sitio
```

### **Páginas Disponibles**

| Página | Descripción | Funcionalidades |
|--------|-------------|-----------------|
| `index.html` | Página principal | Historia, organigrama, cuenta atrás |
| `lafalla.html` | Información detallada | Falleras mayores, presidentes |
| `eventos.html` | Sistema de eventos | Calendario, tablón, PDFs |
| `calendario.html` | Calendario interactivo | Exportación ICS, filtros |
| `meteo.html` | Meteorología | Tiempo actual, pronóstico 5 días |
| `blog.html` | Noticias y artículos | Sistema de contenidos |
| `galerias.html` | Hub de galerías | Acceso a todas las galerías |
| `galeria_[1-4].html` | Galerías específicas | Visualizador full-screen |
| `organigrama.html` | Organigrama detallado | Estructura interactiva |
| `mapa.html` | Ubicación geográfica | Mapa interactivo |
| `base.html` | Template base | Estructura común |

## 🔎 SEO y Optimización para Buscadores

### **Google Search Console Ready**

- ✅ **Core Web Vitals optimizados**
  - LCP (Largest Contentful Paint): Imágenes principales optimizadas
  - FID (First Input Delay): Elementos interactivos acelerados
  - CLS (Cumulative Layout Shift): Layouts estables sin saltos
- ✅ **Mobile-First Indexing**
  - Targets táctiles mínimo 44px para móviles
  - Viewport optimizado para todos los dispositivos
  - Performance móvil mejorada
- ✅ **Structured Data (Schema.org)**
  - LocalBusiness y Organization markup
  - Event structured data para actividades
  - Rich snippets para resultados mejorados

### **Archivos SEO Especializados**

```text
├── 📄 robots.txt              # Optimizado para Googlebot
├── 📄 robots-ai-optimized.txt # Variante avanzada (bots IA + directivas extra)
├── 📄 sitemap.xml             # Sitemap principal corregido
├── 📄 sitemap-google.xml      # Sitemap especializado para Google
├── 📄 sitemap-images.xml      # Mapa de imágenes
├── 📄 sitemap-index.xml       # Índice principal de sitemaps
├── 📄 ld-json-enhanced.json   # Datos estructurados avanzados
├── 📄 schema-organization.json # Schema específico de organización
└── 📄 ai-crawl.html          # Página especializada para IA crawlers
```

### **Optimizaciones CSS para SEO**

```scss
// 📂 scss/_google-seo.scss - Optimizaciones específicas Google
- Core Web Vitals CSS
- Performance budgets
- Accessibility improvements
- Mobile-first responsive design
- Image lazy loading support
- Critical above-the-fold optimization
```

### **Meta Tags Avanzados**

- ✅ **Open Graph completo** para redes sociales
- ✅ **Twitter Cards** para mejor compartición
- ✅ **Geolocalización precisa** de Valencia
- ✅ **Hreflang** para español/valenciano
- ✅ **Canonical URLs** optimizadas
- ✅ **Meta robots** con directivas avanzadas

## 🚀 Instalación y Desarrollo

### **Prerequisitos**

- Node.js 18+
- npm 9+
- Git

### **1. Clonar el repositorio**

```bash
git clone https://github.com/JavierTamaritWeb/WEBFALLASUISSA.git
cd WEBFALLASUISSA
```

### **2. Instalar dependencias**

```bash
npm install
```

### **3. Comandos disponibles**

```bash
# 🚀 Desarrollo (hace build y se queda en watch)
npm run dev

# 📦 Build de producción (genera/actualiza dist/)
npm run build

# SEO (alias mantenido por compatibilidad)
npm run seo:dist

# 🧪 Tests E2E (Playwright)
npm run test:e2e:install
npm run test:e2e
npm run test:e2e:ui

# 🎯 Tareas Gulp individuales (coinciden con gulpfile.js)
npx gulp css
npx gulp images
npx gulp js
npx gulp data
npx gulp pdf
npx gulp favicon
npx gulp html
npx gulp rootFiles
npx gulp seo
npx gulp updateDistSitemapsLastmod
```

## ✅ Checklist antes de hacer push

Como `dist/` está versionado y los tests E2E validan el artefacto real, antes de subir cambios (especialmente si tocas `scss/`, `js/` o `data/`):

```bash
# 1) Regenera dist/
npm run build

# 2) Ejecuta la suite E2E
npm run test:e2e
```

Notas:

- Si te pasa algo raro al lanzar `npm run test:e2e` (por ejemplo, estás fuera de la raíz del repo), ejecuta Playwright directamente: `npx playwright test`.
- Guía técnica Safari/scrollbar: [`docs/scrollbar-theme.md`](./docs/scrollbar-theme.md)

## 🧭 Navbar (UX/UI)

- En móvil (<768px), la navegación usa un menú tipo **dropdown overlay** con botón hamburguesa, cierre por Escape, click fuera (backdrop) y al clicar un enlace.
- El selector de idioma muestra **“IDIOMA · Español/Valencià”** en desktop y se compacta a **solo icono** en móvil manteniendo accesibilidad mediante `aria-label`.
- Archivos clave:
  - `js/nav-menu.js`
  - `js/lang.js`
  - `scss/layout/_header.scss`

### **4. Estructura de distribución**

El comando `build` genera la carpeta `dist/` optimizada para producción:

```text
dist/
├── 📂 css/           # CSS compilado, minificado y con autoprefixer
├── 📂 img/           # Imágenes optimizadas (original + WebP + AVIF)
├── 📂 js/            # JavaScript (copiado desde js/)
├── 📂 data/          # Archivos JSON de configuración
├── 📂 pdf/           # Documentos PDF oficiales
├── 📂 favicon_io/    # Iconos, favicons y manifest
├── 📄 *.html         # Páginas HTML optimizadas
├── 📄 robots.txt     # Configuración para web crawlers
└── 📄 sitemap*.xml   # Mapas del sitio para SEO
```

## 🎯 Funcionalidades Principales

### **🏡 Página Principal**

- ✅ **Historia de la falla** - Relato "Somni" por Paula Peiró
- ✅ **Cuenta atrás dinámico** - Tiempo restante para las Fallas 2026
- ✅ **Presentación de representantes** - Falleras mayores y presidentes
- ✅ **Organigrama interactivo** - Estructura completa de la comisión
- ✅ **Slider de monumentos** - Imágenes optimizadas del monumento

### **📅 Sistema de Eventos y Calendario**

- ✅ **Calendario interactivo** - Navegación por meses y años
- ✅ **Gestión de eventos** - Visualización de actividades programadas
- ✅ **Tablón digital** - Anuncios y comunicados oficiales
- ✅ **Descarga de documentos** - PDFs oficiales y reglamentos
- ✅ **Exportación ICS** - Integración con calendarios personales
- ✅ **Filtros avanzados** - Por tipo de evento y fechas

### **🌤️ Información Meteorológica**

- ✅ **Tiempo actual** - Condiciones meteorológicas en tiempo real
- ✅ **Pronóstico extendido** - Previsión detallada de 5 días
- ✅ **Datos específicos** - Información localizada para Valencia
- ✅ **API integration** - Conexión con servicios meteorológicos

### **📸 Sistema de Galerías**

- ✅ **4 galerías especializadas** - Categorización por eventos
- ✅ **Visualizador full-screen** - Experiencia inmersiva
- ✅ **Optimización automática** - Formatos WebP/AVIF
- ✅ **Lazy loading** - Carga progresiva para mejor performance
- ✅ **Navigation táctil** - Swipe y gestos en dispositivos móviles

### **🗺️ Mapa Interactivo**

- ✅ **Ubicación de la falla** - Geolocalización precisa
- ✅ **Puntos de interés** - Lugares relevantes del barrio
- ✅ **Navegación integrada** - Conexión con apps de mapas
- ✅ **Información contextual** - Detalles de ubicaciones

## 🔧 Configuración Avanzada de Gulp

### **Automatización de Tareas**

```javascript
// Tareas principales del gulpfile.js
const tasks = {
  styles: 'SCSS → CSS (autoprefixer + minificación)',
  images: 'Optimización + conversión WebP/AVIF',
  scripts: 'JavaScript processing',
  watch: 'Desarrollo con hot reload',
  build: 'Build completo de producción'
};
```

### **Optimizaciones Implementadas**

- ✅ **Compilación SCSS** con Dart Sass
- ✅ **Autoprefixer** para compatibilidad cross-browser
- ✅ **Minificación CSS** con CSSNano
- ✅ **Optimización de imágenes** con ImageMin
- ✅ **Conversión WebP/AVIF** automática
- ✅ **Sourcemaps** para debugging
- ✅ **Error handling** con Plumber
- ✅ **Watch mode** para desarrollo ágil

## 📈 SEO y Performance Profesional

### **🔍 SEO Avanzado**

- ✅ **Meta tags optimizados** - Title, description, keywords
- ✅ **Open Graph** - Integración con redes sociales
- ✅ **Twitter Cards** - Previsualizaciones enriquecidas
- ✅ **JSON-LD Schema.org** - Datos estructurados para buscadores
- ✅ **Canonical URLs** - Evitar contenido duplicado
- ✅ **Robots.txt** - Configuración para crawlers
- ✅ **Sitemaps XML** - Indexación completa del sitio

### **⚡ Performance Optimizado**

- ✅ **Core Web Vitals** - Métricas de experiencia del usuario
- ✅ **Critical CSS** - Estilos críticos inline
- ✅ **Image optimization** - Formatos modernos y compresión
- ✅ **Font optimization** - Google Fonts con preload
- ✅ **Lazy loading** - Carga diferida de recursos
- ✅ **Minificación** - CSS y assets optimizados

### **📊 Estructura de Sitemaps**

```xml
<!-- Estructura de sitemaps implementada -->
sitemap-index.xml     → Hub principal de sitemaps
├── sitemap.xml       → Páginas principales
├── sitemap-images.xml → Todas las imágenes
├── sitemap-google.xml → Variantes/optimización Google
└── sitemap-ai-optimized.xml → Variante para IA
```

## 🌍 Sistema Multiidioma Avanzado

### **Idiomas Soportados**

- **🇪🇸 Español** - Idioma por defecto (completo)
- **🇻🇦 Valenciano** - Soporte completo nativo

### **Gestión de Traducciones**

```json
// data/translations.json - 846 líneas de contenido
{
  "es": {
    "nav": {...},
    "countdown": {...},
    "falla": {...},
    "eventos": {...}
  },
  "va": {
    // Traducciones completas al valenciano
  }
}
```

### **Funcionalidades del Sistema**

- ✅ **Cambio dinámico** - Sin recarga de página
- ✅ **Persistencia** - Recuerda la preferencia del usuario
- ✅ **SEO multiidioma** - Meta tags específicos por idioma
- ✅ **Contenido adaptado** - Fechas, números y formatos localizados

## 🧪 Tests E2E (Playwright)

Los tests E2E validan la navbar (desktop/móvil) en varias páginas y comprueban accesibilidad e interacciones (abrir/cerrar, Escape, click fuera, navegación por enlace).

```bash
# Instala navegadores (una vez por máquina)
npm run test:e2e:install

# Ejecuta los tests
npm run test:e2e

# UI interactiva
npm run test:e2e:ui
```

Notas:

- Los tests sirven `dist/` automáticamente (ver `playwright.config.js`).
- Si cambias HTML/SCSS/JS, ejecuta antes `npm run build` para refrescar `dist/`.
- Guía ampliada: [docs/e2e-testing.md](./docs/e2e-testing.md).

## 🤝 Guía de Contribución

### **Para Desarrolladores**

1. **Fork** el repositorio
2. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Realiza tus cambios** siguiendo las convenciones del proyecto
4. **Commit** con mensajes descriptivos:
   ```bash
   git commit -m "feat: añadir funcionalidad X"
   ```
5. **Push** a tu rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
6. **Abre un Pull Request** con descripción detallada

### **Convenciones del Proyecto**

- ✅ **CSS**: Metodología BEM y arquitectura SCSS modular
- ✅ **JavaScript**: ES6+ con módulos separados
- ✅ **Commits**: Conventional Commits (feat, fix, docs, style)
- ✅ **Código**: Comentarios en español para contexto fallero

## 🏷️ Licencia y Derechos

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

### **Uso Permitido**

- ✅ Uso comercial y privado
- ✅ Modificación y distribución
- ✅ Uso como base para otros proyectos falleros

### **Condiciones**

- ⚠️ Incluir el aviso de copyright
- ⚠️ Incluir la licencia en las copias

## 👥 Equipo y Organización

### **💻 Desarrollo Web**

- **Javier Tamarit** - Delegado Web y Desarrollador Principal
  - Arquitectura del proyecto y desarrollo frontend
  - Optimización de performance y SEO
  - Integración de sistemas y APIs

### **🎭 Falla Suïssa - L'Alqueria del Favero #396**

**Ejercicio 2025-26**

#### **Representantes Principales**

- **José Santos Quiles** - Presidente
- **Marta Soriano Dolz** - Fallera Mayor
- **Prados Santos Ramos** - Fallera Mayor Infantil
- **Javier Santos Ramos** - Presidente Infantil

#### **Junta Directiva**

- **Paula Peiró** - Secretaria
- **Marta Soriano** - Vicepresidenta (Eventos)
- **Prados Ramos** - Vicepresidente (Protocolo y Deportes)
- **Rodrigo Sobero** - Vicepresidente (Festejos)
- **David Gómez** - Área Económica
- **Miguel Ángel Pallardó** - Área Económica
- **Sara Medina** - Delegada de Infantil

## 📝 Changelog y Actualizaciones

### 🧪 **Unreleased**

- ✅ Navbar mejorada: menú móvil overlay (hamburguesa + backdrop) y cierre accesible
- ✅ Selector de idioma mejorado: etiqueta “IDIOMA · …” en desktop y modo icon-only en móvil
- ✅ Tests E2E con Playwright (navbar en múltiples páginas y breakpoints)

### 🆕 **[v2.0.0] - 12 de enero de 2026 - Build actualizado y documentación alineada**

- ✅ Build sin warnings de Sass legacy (migración a `gulp-sass` + `sass`)
- ✅ Script `seo:dist` funcional (alias `seoDist`)
- ✅ Dependencias alineadas (incluye actualización de `baseline-browser-mapping`)
- ✅ Repo más limpio: `node_modules/` ignorado y fuera del control de versiones
- ✅ Documentación técnica actualizada (scripts, tareas Gulp y guía de despliegue)

### 🆕 **[v2.10.0] - 13 de agosto de 2025 - Optimización Avanzada SEO + IA**

#### 🤖 **Mejoras Avanzadas de Inteligencia Artificial**

- **Nuevos archivos especializados:**
  ```text
  📂 seo/
  ├── 📄 ai-enhanced-faq.md           # FAQ optimizada específicamente para IA
  ├── 📄 advanced-schema-graph.json   # Schema.org con @graph y propiedades extendidas
  ├── 📄 ai-analytics-config.md       # Configuración avanzada de analytics para IA
  ├── 📄 ai-link-building-strategy.md # Estrategia completa de descubrimiento por IA
  └── 📄 advanced-technical-seo.md    # Configuración técnica avanzada (.htaccess, headers)
  ```

#### 🔧 **Mejoras Técnicas Avanzadas**

- **Meta tags expandidos para IA:** 25+ etiquetas específicas incluyendo contexto cultural, geolocalización y prioridades de entrenamiento
- **Headers HTTP optimizados:** Configuración específica para crawlers de IA con cache y compresión
- **Schema.org Graph:** Implementación de @graph con múltiples entidades conectadas
- **Analytics para IA:** Detección y seguimiento específico de crawlers de IA
- **Core Web Vitals para IA:** Monitoreo de rendimiento específico para sistemas de IA

#### 📊 **Sistemas de Monitoreo Avanzado**

- **Detección automática de crawlers IA:** ChatGPT, Claude, Perplexity, Bard, Copilot
- **Validación de Schema automatizada:** Sistema de puntuación para optimización IA
- **Performance tracking específico:** Métricas dedicadas para interacciones con IA

### 🆕 **[v2.9.0] - 13 de agosto de 2025 - Optimización para IA (ChatGPT, Claude, etc.)**

#### 🤖 **Archivos Específicos para IA**

- **Nuevos archivos creados:**
  ```text
  📂 seo/
  ├── 📄 ai-training-data.md       # Contexto cultural detallado para IA
  ├── 📄 ai-enhanced-schema.json   # Schema.org ampliado con knowsAbout
  └── 📄 ai-crawl.html            # Página específica para crawlers IA
  
  📄 robots-ai-optimized.txt       # Robots.txt con bots de IA específicos
  📄 sitemap-ai-optimized.xml      # Sitemap con contenido para IA
  ```

#### 🎯 **Meta Tags Específicos para IA**

- **Añadidos al index.html:**
  ```html
  <meta name="ai:content_type" content="cultural_organization">
  <meta name="ai:topic" content="Spanish traditional culture, Valencia, UNESCO heritage">
  <meta name="ai:context" content="Traditional Valencian falla commission founded 2024">
  ```

#### 🧠 **Sistemas IA Optimizados**

- **ChatGPT/GPT Models:** Contexto cultural y turístico de Valencia
- **Claude/Anthropic:** Información educativa sobre tradiciones españolas  
- **Perplexity:** Datos factuale sobre cultura valenciana
- **Bing AI:** Organización cultural y empresarial local
- **SearchGPT:** Eventos culturales y turismo en Valencia

#### 📊 **Contenido Educativo para IA**

- **¿Qué es una Falla?** - Explicación completa para IA
- **Contexto UNESCO** - Patrimonio Cultural Inmaterial
- **Organización comunitaria** - Estructura tradicional española
- **Eventos culturales** - Festivales y tradiciones valencianas
- **Contexto geográfico** - Valencia, Mediterráneo, España

#### 🔍 **Keywords Semánticos para IA**

```
#Valencia #Spain #Culture #Tradition #Festival #UNESCO #Heritage
#LasFallas #Suissa #AlqueriaDelFavero #Valencian #Community #Art
```

### 🆕 **[v2.8.0] - 13 de agosto de 2025 - Archivo Verificación Google Mejorado**

#### 🔧 **Archivo de Verificación Profesional**

- **Mejorado:** `google12345678901234567890.html` ahora es un HTML completo
- **Características nuevas:**
  - Página HTML informativa con contexto
  - Instrucciones integradas paso a paso
  - Meta robots `noindex, nofollow` para no interferir SEO
  - Información del proyecto y dominio
  - Enlaces directos a Search Console

#### ✅ **Ventajas del nuevo formato**

- **🎯 Informativo:** El usuario ve contenido útil si accede al archivo
- **📋 Autoexplicativo:** Instrucciones completas en el propio archivo
- **🔒 SEO-safe:** No interfiere con indexación principal
- **📱 Responsive:** HTML válido que se ve bien en cualquier dispositivo
- **🔧 Contexto:** Información específica del proyecto Falla Suïssa

#### 📄 **Estructura del archivo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta name="robots" content="noindex, nofollow">
    <title>Google Search Console - Verificación</title>
</head>
<body>
    <!-- Instrucciones completas integradas -->
</body>
</html>
```

### 🆕 **[v2.7.0] - 13 de agosto de 2025 - Documentación Técnica Organizada**

#### 📚 **Nueva Carpeta `/docs/` con Documentación Markdown**

- **Estructura creada:**
  ```text
  📂 docs/
  ├── 📄 README.md                    # Índice de documentación
  ├── 📄 google-search-console.md     # Verificación Search Console
  └── 📄 robots-configuration.md      # Configuración robots.txt
  ```

#### 🔄 **Migración .txt → .md**

- **Eliminados:** `GOOGLE_VERIFICATION_INSTRUCTIONS.txt`, `robots-optimized.txt`
- **Convertidos:** A Markdown con formato profesional
- **Mejorados:** Sintaxis highlighting, tablas, enlaces, emojis

#### ✅ **Beneficios de la nueva documentación**

- **📖 Legibilidad:** Markdown con formato Github Flavored  
- **🔗 Navegación:** Enlaces internos entre documentos
- **📊 Estructurada:** Tablas, listas, ejemplos de código
- **🔍 Searchable:** Mejor indexación y búsqueda
- **📱 Responsive:** Se ve bien en cualquier dispositivo

#### 🔧 **Gulp Optimizado**

- **Excluye `docs/`** del build de producción (solo desarrollo)
- **Watch mode** no incluye documentación técnica
- **Build limpio** sin archivos de documentación innecesarios

### 🆕 **[v2.6.0] - 13 de agosto de 2025 - Google Search Console Verification**

#### 🔍 **Archivo de Verificación Google Search Console**

- **Archivos creados:**
  ```text
  ├── 📄 google12345678901234567890.html    # Archivo verificación (template)
  └── 📄 GOOGLE_VERIFICATION_INSTRUCTIONS.txt # Instrucciones detalladas
  ```

#### ⚙️ **Configuración de Verificación**

- **Método 1 - Archivo HTML:**
  1. Ve a [Google Search Console](https://search.google.com/search-console)
  2. Añade propiedad: `https://fallasuissa.es`
  3. Selecciona "Archivo HTML" como método
  4. Reemplaza `google12345678901234567890.html` con tu archivo real
  5. Gulp lo copiará automáticamente a `/dist/`

- **Método 2 - Meta Tag (alternativo):**
  ```html
  <meta name="google-site-verification" content="TU_CODIGO_AQUI" />
  ```
  - Ya preparado en `index.html` (comentado)
  - Solo descomenta y añade tu código

#### 🔧 **Optimizaciones Gulp**

- **Auto-detección:** Gulp detecta automáticamente archivos `google*.html`
- **Watch mode:** Cambios en verificación se copian en tiempo real
- **Build production:** Incluido en `npx gulp build`

### 🆕 **[v2.5.0] - 13 de agosto de 2025 - Estructura SEO Optimizada**

#### 📂 **Reorganización de Archivos SEO**

- **Nueva estructura organizada:**
  ```text
  ├── 📄 .htaccess              # Debe estar en raíz (Apache requirement)
  ├── 📄 robots.txt             # Debe estar en raíz (SEO standard)
  ├── 📄 sitemap*.xml           # Deben estar en raíz (Google requirement)
  └── 📂 seo/                   # Archivos auxiliares organizados
      ├── 📄 ai-crawl.html      # Página para IA crawlers
      ├── 📄 ld-json-enhanced.json    # Datos estructurados avanzados
      └── 📄 schema-organization.json # Schema específico organización
  ```

#### 🔧 **Optimizaciones Gulp**

- **Tarea `seoFiles` mejorada:**
  - Archivos críticos se mantienen en raíz automáticamente
  - Archivos auxiliares organizados en `/seo/` 
  - Preserva estructura en build de producción
  - Compatible con Google Search Console requirements

#### ✅ **Beneficios de la nueva estructura**

- **🎯 SEO-friendly:** Archivos críticos donde deben estar
- **📁 Organización:** Archivos auxiliares en carpeta específica  
- **🔧 Mantenimiento:** Más fácil localizar y actualizar archivos
- **⚡ Build:** Gulp optimizado para nueva estructura

### 🆕 **[v2.4.0] - 13 de agosto de 2025 - Optimizaciones SEO Google Search**

#### ✅ **Nuevas Funcionalidades SEO**

- **Archivos SEO especializados:**
  - `robots-optimized.txt` - Versión avanzada con directivas específicas para Googlebot
  - `sitemap-google.xml` - Sitemap especializado con timestamps y metadatos de imagen
  - `ld-json-enhanced.json` - Datos estructurados completos para LocalBusiness
  - `ai-crawl.html` - Página dedicada para IA crawlers con contexto detallado

#### 🔧 **Optimizaciones Implementadas**

- **Core Web Vitals CSS (`scss/_google-seo.scss`):**
  - LCP (Largest Contentful Paint) optimization
  - FID (First Input Delay) acceleration
  - CLS (Cumulative Layout Shift) prevention
  - Mobile-first indexing improvements
  - Critical above-the-fold content optimization

#### 🛠️ **Correcciones Críticas**

- **Sitemap principal:** Corregidos espacios en URLs y error tipográfico "montly" → "monthly"
- **Meta tags avanzados:** Agregados Open Graph, Twitter Cards, geolocalización
- **Canonical URLs:** Optimizadas de `/index.html` a `/` para mejor SEO
- **Robots.txt:** Actualizado con directivas específicas para Google Search Console

#### 📊 **Mejoras de Performance**

- **Lazy loading** mejorado para imágenes
- **Font-display: swap** para fuentes optimizadas  
- **Critical CSS** separado para mejor First Contentful Paint
- **Accessibility improvements** para mejor ranking SEO

### 📋 **Próximas Mejoras Planificadas**

- [ ] Google Analytics 4 integration
- [ ] Search Console verification  
- [ ] Rich snippets para eventos
- [ ] AMP pages implementation
- [ ] Core Web Vitals monitoring

## 📞 Contacto y Redes Sociales

### **🌐 Web y Email**

- **Web Oficial:** [https://fallasuissa.es](https://fallasuissa.es)
- **Email:** [info@fallasuissa.es](mailto:info@fallasuissa.es)

### **📱 Redes Sociales**

| Plataforma | Usuario | Enlace |
|-----------|---------|---------|
| **Facebook** | FallaSuissaLalqueriadelFavero | [Ver perfil](https://www.facebook.com/FallaSuissaLalqueriadelFavero) |
| **Instagram** | @fallasuissa_lalqueriadelfavero | [Ver perfil](https://www.instagram.com/fallasuissa_lalqueriadelfavero/) |
| **TikTok** | @fallasuissaalqueria | [Ver perfil](https://tiktok.com/@fallasuissaalqueria) |

### **📍 Ubicación**

- **Dirección:** Calle Suïssa, Valencia 46024
- **Barrio:** L'Alqueria del Favero - Les Moreres
- **Coordenadas:** 39.4537245, -0.3376502

## 🏆 Reconocimientos y Estadísticas

### **📊 Datos del Proyecto**

- **Líneas de código:** ~15,000+ líneas
- **Archivos JavaScript:** 16 módulos especializados
- **Traducciones:** 846 líneas en 2 idiomas
- **Páginas:** 11 páginas optimizadas
- **Performance Score:** 95+ en PageSpeed Insights
- **SEO Score:** 100/100 en herramientas de análisis

### **🎯 Alcance y Impacto**

- **Falleros atendidos:** 113+ miembros de la comisión
- **Visitantes web:** Información pública para toda la comunidad
- **Eventos gestionados:** Sistema completo de calendario y actividades
- **Documentos servidos:** PDFs oficiales y reglamentos

## 🔄 Roadmap y Futuras Mejoras

### **🚀 Próximas Funcionalidades**

- [ ] **PWA completa** - Service Worker y funcionalidad offline
- [ ] **Push notifications** - Alertas de eventos importantes
- [ ] **Sistema de usuarios** - Login para falleros registrados
- [ ] **Chat integrado** - Comunicación interna de la comisión
- [ ] **App móvil nativa** - Desarrollo con React Native

### **⚡ Optimizaciones Planificadas**

- [ ] **CDN integration** - Distribución global de contenido
- [ ] **Database integration** - Backend para gestión dinámica
- [ ] **Analytics avanzado** - Métricas detalladas de uso
- [ ] **A/B Testing** - Optimización continua de UX

---

<div align="center">

## 🎭 Falla Suïssa - L'Alqueria del Favero #396

### *Tradició, Cultura i Germanor*

**Ejercicio 2025-26**

[![Visitar Web](https://img.shields.io/badge/🌐_Visitar_Web-fallasuissa.es-blue?style=for-the-badge)](https://fallasuissa.es)

**🔥 Plantem falla per primera vegada! 🔥**

*"¡Sssshhhhh… silencio que se rueda!"*

---

**© 2026 Falla Suïssa - L'Alqueria del Favero | Tots els drets reservats**

*Desenvolupat amb ❤️ per a la comunitat fallera*

</div>
