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
- **NO usar** URLs con `?lang=ca` ni `?lang=es` como destino de hreflang: el cambio de idioma es client-side via `js/lang.js`.
- **Para una página nueva**: añadir DOS entradas al sitemap (ES y VA) con sus 3 alternates.

### Procedimiento tras un aviso de GSC

1. Reenviar `https://fallasuissa.es/sitemap-index.xml` para que Google detecte las URLs `/va/`.
2. En el informe del aviso, pulsar **"Validar corrección"**.
3. Reindexación típica: 1-2 semanas.
4. **Inspección manual**: GSC → Inspección de URL → `https://fallasuissa.es/va/` → "Probar URL publicada" → confirmar que el HTML renderizado contiene texto valenciano.

---

Última actualización: 7 de mayo de 2026 - v4.6.23
