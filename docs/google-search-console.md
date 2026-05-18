# 🔍 Google Search Console - Verificación

## 📋 Instrucciones Paso a Paso

### 🌐 **Método 1: Archivo HTML (Recomendado)**

1. **Accede a Search Console:**
   - Ve a [Google Search Console](https://search.google.com/search-console)
   - Inicia sesión con tu cuenta de Google

2. **Añadir Propiedad:**
   ```
   https://fallasuissa.es
   ```

3. **Seleccionar Método:**
   - Elige "Archivo HTML" como método de verificación
   - Google generará un archivo como: `googleXXXXXXXXXXXXXXXX.html`

4. **Disponer el Archivo HTML:**
   - Descarga el archivo que Google te proporciona (ej: `googleXXXXXXXXXXXXXXXX.html`)
   - Colócalo en la raíz del proyecto
   - **Nota:** El archivo `google-site-verification.html` presente en el repositorio contiene solo instrucciones, no lo uses para verificar.

5. **Verificar Acceso:**
   - Asegúrate de que el archivo sea accesible en:
   ```
   https://fallasuissa.es/googleXXXXXXXXXXXXXXXX.html
   ```

6. **Completar Verificación:**
   - Vuelve a Search Console y haz clic en "Verificar"
   - **Mantén el archivo** incluso después de la verificación

### 🏷️ **Método 2: Meta Tag (Alternativo)**

Si prefieres usar meta tag, ya está preparado en `index.html`:

```html
<!-- Descomenta y añade tu código -->
<meta name="google-site-verification" content="TU_CODIGO_AQUI" />
```

**Ubicación:** `index.html` línea ~21

### ⚙️ **Automatización con Gulp**

El sistema Gulp está configurado para:

- ✅ **Auto-detectar** archivos `google*.html`
- ✅ **Copiar automáticamente** a `/dist/` durante el build (tarea `rootFilesTask`)
- ✅ **Watch mode** - Cambios en tiempo real
- ✅ **Incluir en producción** con `npm run build`

Comando recomendado:

```bash
npm run build
```

Alternativa “one-shot” (sin watchers) si quieres ejecutar Gulp explícitamente:

```bash
npx gulp build
```

### 📊 **Verificación Exitosa**

Una vez verificado tendrás acceso a:

- **Rendimiento de búsqueda** - Clics, impresiones, CTR
- **Cobertura del índice** - Páginas indexadas
- **Experiencia de página** - Core Web Vitals
- **Mejoras** - Datos estructurados, AMP, etc.
- **Enlaces** - Enlaces internos y externos
- **Sitemaps** - Estado de sitemaps enviados

### 🔗 **Enlaces Útiles**

- [Google Search Console](https://search.google.com/search-console)
- [Documentación oficial](https://developers.google.com/search/docs/advanced/crawling/verifying-googlebot)
- [Core Web Vitals](https://web.dev/vitals/)

### ⚠️ **Notas Importantes**

- El archivo debe estar en la **raíz del dominio**
- Debe ser **accesible públicamente** (no protegido por contraseña)
- **No modifiques** el contenido que Google proporciona
- **Mantén el archivo** incluso después de la verificación exitosa
- La verificación puede tardar **unos minutos** en completarse

---

## 🚨 Aviso "Duplicada: el usuario no ha indicado ninguna versión canónica" (resuelto en v4.6.22 + v4.6.23)

GSC puede reportar este aviso cuando detecta páginas con contenido similar y la señal de canonical es incoherente con `hreflang`. En este proyecto se manifestó así: `dist/index.html` (ES) y `dist/va/index.html` (VA) compartían `canonical` apuntando a la ES y `hreflang` declarando la VA como `ca`. Resultado: Google ignoraba el hreflang y consolidaba las dos URLs como duplicadas.

### Cómo lo resuelve el repo

**v4.6.22 — `gulpfile.js` como única fuente de canonical/hreflang.** En `modifyHtmlStream` el build:

1. Elimina cualquier `<link rel="canonical">` y `<link rel="alternate" hreflang=...>` preexistente en el HTML del root.
2. Reinyecta un bloque coherente:
   - `canonical` autoreferencial (cada URL apunta a sí misma: `/X.html` o `/va/X.html`).
   - `hreflang` bidireccional (`es`, `ca`, `x-default`).
3. Se eliminan las URLs fantasma `?lang=ca`/`?lang=es` (no son páginas crawlables).

`sitemap.xml` se reescribe con 48 entradas (24 ES + 24 VA), cada una con `<xhtml:link rel="alternate">` para los 3 idiomas.

**v4.6.23 — pre-render de valenciano en build.** El cuerpo HTML servido en `dist/va/*.html` ahora contiene texto valenciano real (no español), de modo que Google y otros crawlers ven divergencia de contenido entre ES y VA y dejan de tratarlas como duplicadas. Detalles en [`i18n-translations.md`](./i18n-translations.md).

### Reglas operativas

- **NO añadir** `<link rel="canonical">` ni `<link rel="alternate" hreflang=...>` a mano en los HTML del root: el build los borra. Si necesitas tocarlos, edita `modifyHtmlStream` en `gulpfile.js`.
- **NO usar** URLs con `?lang=ca` ni `?lang=es` como destino de hreflang: el cambio de idioma es client-side via `src/js/lang.js`.
- **Para una página nueva**: añadir DOS entradas al sitemap (ES y VA) con sus 3 alternates.

### Procedimiento tras un aviso de GSC

1. Reenviar `https://fallasuissa.es/sitemap-index.xml` para que Google detecte las URLs `/va/`.
2. En el informe del aviso, pulsar **"Validar corrección"**.
3. Reindexación típica: 1-2 semanas.
4. **Inspección manual**: GSC → Inspección de URL → `https://fallasuissa.es/va/` → "Probar URL publicada" → confirmar que el HTML renderizado contiene texto valenciano.

---

## 🚨 Aviso "No se ha encontrado (404)" — limpieza de URLs antiguas (v4.7.4)

GSC reportó 24 URLs 404 (pico de 36 en abril, descendiendo solo a 24 en mayo). El análisis de los ejemplos mostrados por GSC reveló **4 patrones**, no 24 URLs sueltas:

| Patrón | Origen | URLs afectadas |
|---|---|---|
| **A** — `/va/pdf/*` | Google indexó variantes VA que **nunca existieron** (los PDFs solo viven en `/pdf/*`). Probablemente generadas al resolver enlaces relativos desde páginas `/va/`. | 3 ejemplos: `Llibret_2024-25.html`, `Llibret_2025-26.html`, `Presentacion_Fallera_2026.html` |
| **B** — `migany2025*.pdf` | Wrappers Mig Any 2025 eliminados sin equivalente actual. | 3 ejemplos: `.pdf`, `_ingles.pdf`, `_ucraniano.pdf` |
| **C** — `2024_LLIBRET_FALLA _MORERES_DIGITAL.pdf` en raíz `/pdf/` | El archivo se reorganizó a `/pdf/Llibrets/`. | 2 ejemplos (con y sin `www.`) |
| **D** — `C6xxx_*.pdf` | Bases campeonatos JCF temporada **2025-26** (sustituidas por las 2026-27 en `/pdf/JCF-2026-27/`). | 12+ ejemplos (TENIS, BOLOS, PETANCA, VOLEY PLAYA…) |

### Cómo lo resuelve el repo

`src/.htaccess` declara 4 reglas dentro del bloque `<IfModule mod_rewrite.c>`, **después** de la redirección `www → no-www` y **antes** de la negociación de Markdown:

```apache
# A) /va/pdf/* → /pdf/*
RewriteRule ^va/pdf/(.*)$ /pdf/$1 [R=301,L]

# B) migany2025*.pdf → 410 Gone (sin equivalente)
RewriteRule ^pdf/migany2025.*\.pdf$ - [R=410,L]

# C) Llibret 2024 movido a /pdf/Llibrets/
RewriteRule "^pdf/2024_LLIBRET_FALLA._MORERES_DIGITAL\.pdf$" \
    "/pdf/Llibrets/2024_LLIBRET_FALLA%20_MORERES_DIGITAL.pdf" [R=301,L]

# D) Bases JCF antiguas → /deportes.html
RewriteRule "^pdf/C6[0-9]+.*\.pdf$" /deportes.html [R=301,L]
```

### Reglas operativas

- **301 vs 410**: usar 301 cuando hay destino equivalente (la página o el documento sigue existiendo). Usar **410 Gone** cuando el recurso se eliminó sin sustituto — Google lo retira del índice más rápido que un 404.
- **No tocar las URLs antiguas con `www.fallasuissa.es`**: el bloque `Redirección www a no-www` ya las pasa a `https://fallasuissa.es/...` (301), y luego las nuevas reglas de limpieza las atrapan en una segunda redirección. Esto produce 2 saltos, aceptable para Google (<5).
- **Códigos C6xxx**: son numeración interna de la Junta Central Fallera. El patrón `^pdf/C6[0-9]+.*\.pdf$` es seguro y no afectará a archivos legítimos (los actuales viven bajo `/pdf/JCF-2026-27/` y NO empiezan con `C6` en raíz).
- **Si añades un PDF nuevo**: ponlo bajo su carpeta correspondiente (`/pdf/JCF-2026-27/`, `/pdf/Llibrets/`, `/pdf/Presentaciones/`) — NO en la raíz `/pdf/`. Si por error queda en raíz, las URLs antiguas pueden no resolverse al reorganizarlo después.
- **Si eliminas un PDF**: si no tiene equivalente, añade una regla 410 Gone. Si tiene equivalente, añade una 301.

### Verificar tras el deploy

```bash
# Debe redirigir a /pdf/Llibrets/Llibret_2025-26.html
curl -sI https://fallasuissa.es/va/pdf/Llibrets/Llibret_2025-26.html | grep -E '^(HTTP|Location)'

# Debe redirigir a /deportes.html
curl -sI https://fallasuissa.es/pdf/C6192_XXXIII_Campeonato_PETANCA.pdf | grep -E '^(HTTP|Location)'

# Debe devolver HTTP/1.1 410 Gone
curl -sI https://fallasuissa.es/pdf/migany2025.pdf | grep -E '^HTTP'
```

### Procedimiento tras un aviso de GSC

1. Exportar los ejemplos de URLs desde GSC → **Indexación → No se ha encontrado (404)**.
2. Clasificar en **patrones** (no en URLs sueltas): renombrados, eliminados, prefijos inventados, carpetas reorganizadas.
3. Añadir 1 regla `RewriteRule` por patrón en `src/.htaccess` (301 si hay destino, 410 si no).
4. `npm run build` (la regla viaja a `dist/.htaccess` vía `rootFilesTask`).
5. Tras desplegar, validar con `curl -sI` que cada patrón devuelve el código esperado.
6. En GSC, pulsar **"Validar corrección"** en el informe. Google re-rastreará en 2-3 semanas.

---

Última actualización: 18 de mayo de 2026 - v4.7.4
