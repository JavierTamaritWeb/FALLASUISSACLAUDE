# 🟦 Open Graph (WhatsApp, Facebook, Twitter)

Esta guía documenta cómo mantenemos la imagen de previsualización (Open Graph) para que **WhatsApp muestre correctamente** la tarjeta al compartir enlaces.

## ✅ Qué problema resuelve

WhatsApp suele fallar o no actualizar la imagen de previsualización por:

- **Caché agresiva** de la URL de `og:image` (si ya se compartió antes, WhatsApp puede seguir usando una versión antigua).
- Imágenes demasiado grandes o con características que a veces causan problemas (peso alto, transparencias, etc.).

## 🖼️ Imagen OG del proyecto

- Archivo fuente de salida: `img/og-share.png`
- Fuente de generación: `img/Escudo_falla.avif`
- Estándar recomendado:
  - Tamaño: **1200×630**
  - Formato: **PNG**
  - Fondo: **sólido** (evita problemas de transparencias y modo oscuro)
  - Peso objetivo: **< 300KB** (WhatsApp suele necesitarlo)

### Generar/actualizar la imagen

El repo incluye un generador basado en `sharp`:

```bash
npm run generate:og
```

Esto ejecuta `scripts/generate-og-image.mjs` y regenera `img/og-share.png`.

## 🔁 Cache-buster (`?v=...`) para WhatsApp

Para forzar a WhatsApp a refrescar la imagen, **no basta con reemplazar el archivo**: hay que cambiar la URL.

La estrategia del proyecto es añadir un query param a la URL de la imagen:

- Antes: `https://fallasuissa.es/img/og-share.png`
- Ahora: `https://fallasuissa.es/img/og-share.png?v=20260122`

### Regla del proyecto

En cualquier HTML que tenga metatags Open Graph/Twitter:

- `og:image` debe apuntar a `.../og-share.png?v=...`
- `og:image:secure_url` igual
- `twitter:image` igual
- `link rel="image_src"` (si existe) igual

### Cuándo cambiar el `v=`

- Cada vez que cambies la imagen OG (o quieras forzar recacheo) cambia el valor de `v=`.
- Recomendación: usar una fecha `YYYYMMDD`.

## 🧪 Tests para evitar regresiones

Se han añadido tests para garantizar que esto no se rompe con el tiempo.

### 1) Validación de la imagen OG

Archivo: `tests/og-image.e2e.spec.js`

Valida:

- Que existe `img/og-share.png`
- Que pesa menos de 300KB
- Que mide 1200×630

### 2) Validación de metatags (fuente)

Archivo: `tests/og-meta-cachebust.e2e.spec.js`

Valida que ningún HTML (excluyendo `dist/`) referencia `og-share.png` **sin** `?v=`.

### 3) Validación de metatags (artefacto `dist/`)

Archivo: `tests/og-meta-cachebust-dist.e2e.spec.js`

Valida que el build en `dist/` también contiene la URL versionada.

## 🏗️ Flujo recomendado (antes de desplegar)

1) Si cambias la imagen OG:

```bash
npm run generate:og
```

2) Rebuild de producción:

```bash
npm run build
```

3) Ejecuta tests:

```bash
npm run test:e2e
```

## 📌 Verificación en producción

- Herramienta de Meta (Facebook Sharing Debugger): fuerza re-scrape y ayuda a que WhatsApp se ponga al día.
- Si WhatsApp sigue sin actualizar, suele ser caché: volver a compartir tras cambiar `?v=`.

---

*Última actualización: 22 de enero de 2026*
