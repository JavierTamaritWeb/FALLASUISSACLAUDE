# 🛠 Scripts y Utilidades del Repositorio

Esta guía documenta los scripts de mantenimiento que no forman parte del flujo diario de Gulp pero sí son importantes para SEO, pruebas locales y tareas puntuales de refactor.

## 📍 Scripts cubiertos

- `scripts/generate-og-image.mjs`
- `scripts/serve-dist.mjs`
- `scripts/refactor-scss-namespaces.mjs`

## 1. `generate-og-image.mjs`

### `generate-og-image.mjs`: propósito

Regenera `img/og-share.png` con el formato que usa el sitio para Open Graph y WhatsApp.

### `generate-og-image.mjs`: entrada y salida

- entrada: `img/Escudo_falla.avif`
- salida: `img/og-share.png`

### `generate-og-image.mjs`: qué hace

- redimensiona a `1200x630`
- usa fondo azul corporativo
- exporta PNG optimizado para social preview
- avisa si el fichero se acerca o supera los `300KB`
- si el PNG sale demasiado pesado, intenta recomprimirlo

### `generate-og-image.mjs`: cómo ejecutarlo

```bash
npm run generate:og
```

### `generate-og-image.mjs`: pasos posteriores

1. actualiza el cache-buster `?v=YYYYMMDD` en todas las referencias HTML
2. ejecuta `npm run build`
3. valida al menos:

```bash
npm run test:e2e
```

Si has tocado OG, snapshots o cabeceras compartidas, usa además `npm run test:e2e:full`.

## 2. `serve-dist.mjs`

### `serve-dist.mjs`: propósito

Levanta un servidor HTTP simple sobre `dist/` para revisar la salida generada o apoyar pruebas locales.

### `serve-dist.mjs`: valores por defecto

- puerto: `4173`
- raíz: `dist`
- host: `127.0.0.1`

### `serve-dist.mjs`: cómo ejecutarlo

```bash
node scripts/serve-dist.mjs
```

### `serve-dist.mjs`: cambiar puerto o raíz

```bash
node scripts/serve-dist.mjs --port 4174 --root dist
```

### `serve-dist.mjs`: notas

- resuelve rutas de forma segura para no salir de la carpeta raíz servida
- devuelve `404` si el archivo no existe
- sirve tipos MIME comunes del proyecto: HTML, CSS, JS, JSON, XML, imágenes y PDF

## 3. `refactor-scss-namespaces.mjs`

### `refactor-scss-namespaces.mjs`: propósito

Es un codemod para normalizar imports y usos de namespaces en SCSS.

### `refactor-scss-namespaces.mjs`: qué migra

- `@use '...variables' as *` → alias `v`
- `@use '...mixins' as *` → alias `m`
- usos de variables sin namespace → `v.$variable`
- includes heredados de mixins → `@include m.algo(...)`

### `refactor-scss-namespaces.mjs`: cuándo usarlo

- migraciones amplias de SCSS
- limpieza posterior a refactors de namespaces
- nunca como sustituto de una revisión manual del diff

### `refactor-scss-namespaces.mjs`: cómo ejecutarlo

```bash
node scripts/refactor-scss-namespaces.mjs
```

### `refactor-scss-namespaces.mjs`: precauciones

- ejecútalo desde la raíz del repo
- modifica archivos en sitio
- revisa siempre el diff antes de darlo por bueno
- después valida con build y tests del guardrail SCSS

```bash
npm run build
npx playwright test tests/scss-guardrails.e2e.spec.js
```

## ✅ Recomendaciones rápidas

| Caso | Script | Verificación mínima |
| ------ | -------- | --------------------- |
| regenerar OG | `npm run generate:og` | `npm run build` + tests OG relevantes |
| servir `dist/` | `node scripts/serve-dist.mjs` | revisión manual o Playwright apuntando a la salida |
| migrar namespaces SCSS | `node scripts/refactor-scss-namespaces.mjs` | `npm run build` + `tests/scss-guardrails.e2e.spec.js` |

## 🔗 Relacionado

- [`build-and-deploy.md`](./build-and-deploy.md)
- [`open-graph-whatsapp.md`](./open-graph-whatsapp.md)
- [`e2e-testing.md`](./e2e-testing.md)

---

Última actualización: 13 de marzo de 2026 - v4.2.16
