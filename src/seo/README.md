# 🔎 SEO / AI (carpeta `src/seo/`)

Esta carpeta agrupa documentación y artefactos relacionados con SEO técnico, datos estructurados y contenido orientado a descubrimiento por buscadores y sistemas de IA.

## ✅ Importante (fuente vs. build)

- **Fuente de verdad:** `src/seo/` (esta carpeta)
- **Artefacto compilado:** `dist/seo/`

El build copia `src/seo/**/*` a `dist/seo/`.

- Edita **siempre** `src/seo/`.
- No edites `dist/seo/` (se sobrescribe en cada build).

Build recomendado:

- `npm run build`
- Alternativa explícita sin watch: `npx gulp build`

## 📚 Documentos (Markdown)

- `advanced-technical-seo.md`
  - Ideas de SEO técnico (Apache/Nginx), cabeceras y ejemplos de configuración.
  - Nota: es documentación/plantilla, no configuración activa del servidor.

- `ai-training-data.md`
  - “AI crawling instructions” / contenido para contextualización.
  - Mantenerlo alineado con el contenido real publicado (páginas y secciones vigentes).

- `ai-enhanced-faq.md`
  - FAQ orientada a motores/IA (texto “evergreen”).
  - Evitar datos que caducan (nombres/años) salvo que exista un flujo de actualización.

- `ai-link-building-strategy.md`
  - Estrategia de descubrimiento (robots/sitemaps) y pautas de enlazado.
  - Usar fechas/ejemplos como placeholders si no hay automatización.

- `ai-analytics-config.md`
  - Propuestas de instrumentación (GA4, píxel, métricas).
  - Aviso: no ejecutar snippets sin consentimiento/cumplimiento de privacidad.

## 🧩 Artefactos (JSON/HTML)

- `schema-organization.json`
  - FUENTE ÚNICA del JSON-LD Organization + WebSite: el build (`gulpfile.js → processJsonLd`) lo inyecta en todas las páginas. Al relevar cargos se edita aquí (`member`). Ver `docs/structured-data.md`.
- `ai-enhanced-schema.json`
  - Endpoint de compatibilidad para agentes; el build lo genera desde `schema-organization.json`. No mantener otra lista de cargos o datos institucionales.
- (`ld-json-enhanced.json` y `advanced-schema-graph.json` se eliminaron en v4.28.0: contenían datos inventados.)

- `ai-crawl.html`
  - Página auxiliar orientada a rastreo/IA.

## 🤖 Descubrimiento para asistentes de IA (raíz pública, v4.43.0)

- `src/robots.txt` — único robots: grupos explícitos que permiten a los rastreadores de IA de búsqueda, asistente y entrenamiento, bloqueo de scrapers SEO comerciales y Bytespider, `Content-Signal` y las dos directivas `Sitemap:`. Ver `docs/robots-configuration.md`.
- `src/llms.txt` — resumen curado del sitio según llmstxt.org (se mantiene a mano; `tests/unit/robots.test.cjs` exige que toda página publicable aparezca en él o esté declarada opcional).
- `dist/llms-full.txt` — lo genera el build (`scripts/seo-artifacts.cjs → buildLlmsFull`) con el título y la descripción de las 62 páginas ES/VA más esta guía; no se edita.
- `src/indexnow.txt` — clave pública de IndexNow; `tools/deploy.sh` notifica las URL cambiadas tras cada deploy (`docs/seo-indexnow.md`).

## 🔄 Mantenimiento recomendado

- Si cambia la estructura del sitio (nuevas páginas/rutas), revisa:
  - `ai-training-data.md`
  - `ai-link-building-strategy.md`

- Si cambian representantes, textos o contenido “Nosotros/Historia”, revisa:
  - `ai-enhanced-faq.md`
  - `ai-training-data.md`

- Si cambian robots/sitemaps del root, revisa:
  - `ai-link-building-strategy.md`
  - `docs/robots-configuration.md`

---

Última actualización: 5 de octubre de 2026 - v4.43.0
