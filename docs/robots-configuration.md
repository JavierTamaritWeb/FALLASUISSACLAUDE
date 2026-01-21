# 🤖 Robots.txt - Configuración Avanzada

## 📋 Configuración Optimizada para SEO

### 🎯 **Directivas Principales**

```txt
User-agent: *
Allow: /
```

Permite a todos los bots rastrear el sitio web por defecto.

### 📁 **Recursos Permitidos**

```txt
# Archivos esenciales para renderizado
Allow: /*.js$          # JavaScript
Allow: /*.css$         # Hojas de estilo
Allow: /*.woff2$       # Fuentes web
Allow: /*.webp$        # Imágenes modernas
Allow: /*.avif$        # Imágenes nueva generación

# Directorios de contenido
Allow: /img/           # Imágenes
Allow: /pdf/           # Documentos
```

### 🚫 **Directorios Bloqueados**

```txt
# Archivos de desarrollo
Disallow: /scss/           # Código fuente SCSS
Disallow: /node_modules/   # Dependencias Node.js
Disallow: /.git/           # Control de versiones
Disallow: /gulpfile.js     # Configuración build
Disallow: /package*.json   # Configuración npm
```

**Razón:** Estos archivos no aportan valor SEO y pueden revelar información técnica.

### ⏱️ **Crawl Delay**

```txt
# General - Ser amigable con el servidor
Crawl-delay: 1

# Google - Sin delay (prioridad)
User-agent: Googlebot
Crawl-delay: 0
```

### 🗺️ **Sitemaps**

```txt
Sitemap: https://fallasuissa.es/sitemap-index.xml
```

### 🎯 **Bots Específicos Permitidos**

| Bot | Propósito | Configuración |
|-----|-----------|---------------|
| **Googlebot** | Búsqueda Google | Sin delay, acceso completo |
| **Bingbot** | Búsqueda Bing | Delay 1s, acceso completo |
| **facebookexternalhit** | Previews Facebook | Acceso completo |
| **Twitterbot** | Cards Twitter | Acceso completo |
| **LinkedInBot** | Previews LinkedIn | Acceso completo |
| **WhatsApp** | Previews WhatsApp | Acceso completo |

### 🚫 **Bots Bloqueados**

```txt
# Bots de herramientas SEO
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot  
Disallow: /

User-agent: MJ12bot
Disallow: /
```

**Razón:** Estos bots consumen recursos sin aportar valor directo al SEO.

### 📊 **Mejores Prácticas Implementadas**

#### ✅ **SEO-Friendly**
- Permite recursos críticos para renderizado
- Sitemaps declarados correctamente
- Bots sociales habilitados

#### ✅ **Performance**
- Bloquea archivos innecesarios
- Crawl-delay apropiado
- Prioriza Googlebot

#### ✅ **Seguridad**
- Oculta archivos de configuración
- Bloquea directorios sensibles
- Evita bots agresivos

### 🔧 **Validación**

Para validar tu robots.txt:

1. **Google Search Console:**
   - Herramientas → Probador de robots.txt
   - Verifica que Googlebot puede acceder a páginas importantes

2. **Online Validators:**
   - [robots-txt.com](https://www.robots-txt.com/robots-txt-checker/)
   - [SEO Site Checkup](https://seositecheckup.com/tools/robots-txt-validator)

### 📁 **Ubicación del Archivo**

```txt
https://fallasuissa.es/robots.txt
```

**Crítico:** Debe estar en la raíz del dominio para que los bots lo encuentren.

### 🔄 **Versiones del Archivo**

| Archivo | Propósito |
|---------|-----------|
| `robots.txt` | Versión en producción (activa) |
| `robots-ai-optimized.txt` | Variante avanzada (incluye bots de IA y directivas extra) |

### 🧩 Relación con el build (`dist/`)

En este repo, los archivos de la raíz (incluyendo `robots.txt`, `robots-ai-optimized.txt`, `sitemap*.xml` y `google*.html`) se copian a `dist/` durante `gulp build` mediante la tarea `rootFilesTask`.

Nota: si tu despliegue publica **solo** la carpeta `dist/`, entonces rutas como `/scss/` o `/node_modules/` no existirán en producción. Mantenerlas como `Disallow` no rompe nada, pero no aportan protección adicional (robots.txt no es un mecanismo de seguridad).

### ⚠️ **Consideraciones**

- **No es una seguridad:** robots.txt es público y sugiere, no obliga
- **Tiempo de caché:** Los bots pueden cachear durante horas
- **Sintaxis crítica:** Un error puede bloquear todo el sitio
- **Mayúsculas importan:** Los user-agents son case-sensitive

---

*Configuración optimizada para Falla Suïssa - Última actualización: 21 de enero de 2026*
