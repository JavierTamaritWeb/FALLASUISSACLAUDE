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

*Última actualización: 13 de febrero de 2026 - v4.2.9 - Rename y clarificación de instrucciones*
