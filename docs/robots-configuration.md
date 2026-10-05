# 🤖 robots.txt, llms.txt y descubrimiento para IA

**Versión:** 4.43.0 · **Última actualización:** 5 de octubre de 2026

Desde 4.43.0 el sitio publica **un único** `robots.txt` (`src/robots.txt`, copiado tal cual a `dist/` por `rootFilesTask`). El antiguo `robots-ai-optimized.txt` se retiró: los rastreadores solo leen `/robots.txt`, así que sus grupos por bot viven ahora ahí; la URL antigua responde `301 → /robots.txt` (regla E2 del `.htaccess`).

## Política

Decisión del usuario del 5 de octubre de 2026: **las IA no maliciosas leen todo el proyecto con facilidad**; se bloquean únicamente los scrapers SEO comerciales y Bytespider.

| Grupo | Bots | Regla | Motivo |
|---|---|---|---|
| Buscadores y asistentes de IA | Googlebot, Google-Extended, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User, Applebot, Applebot-Extended, DuckDuckBot, DuckAssistBot, CCBot, Amazonbot, meta-externalagent, meta-externalfetcher, FacebookBot, cohere-ai, MistralAI-User, YouBot, Diffbot, Yandex, Seznam, Naver | `Allow: /` | Búsqueda, citación y entrenamiento permitidos: es contenido cultural público que busca difusión |
| Scrapers SEO y Bytespider | AhrefsBot, SemrushBot, MJ12bot, DotBot, BLEXBot, DataForSeoBot, PetalBot, Bytespider | `Disallow: /` | Consumen ancho de banda sin aportar visitas; Bytespider suele ignorar robots y no aporta tráfico |
| Resto (`*`) | cualquier otro | `Allow: /` + `Content-Signal: search=yes, ai-train=yes, ai-input=yes` | Abierto; solo oculta `?preview=` (bypass de mantenimiento), `?lang=` (301 al idioma) y `mantenimiento.html` |

Sin `Crawl-delay` (Google lo ignora y Bing lo trata como sugerencia). Dos directivas `Sitemap:` (`sitemap-index.xml` y `sitemap.xml`). `Content-Signal` se conserva a propósito aunque Lighthouse lo marque como directiva desconocida (auditoría 4.30.21).

## Cómo cambiar la política

- **Readmitir un bot bloqueado**: borra su línea `User-agent:` del grupo de bloqueo. Si un bot deja de aparecer en el grupo de IA, pasa a regirse por `*` (también abierto), así que el grupo de IA es explícito, no restrictivo.
- **Bloquear un bot nuevo**: añade `User-agent: Nombre` al grupo de bloqueo (una línea por nombre; las reglas del grupo se aplican a todos sus agentes).
- **Cerrar el entrenamiento de IA**: cambia `ai-train=yes` por `ai-train=no` y mueve `Google-Extended`, `GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Applebot-Extended` y `meta-externalagent` al grupo de bloqueo (son los agentes de entrenamiento; los de búsqueda/asistente siguen abiertos).
- Después: `npm run test:unit` (`tests/unit/robots.test.cjs` parsea el archivo, exige los bots de IA permitidos y los scrapers bloqueados, ningún `Disallow` sobre `/css /js /img /data /pdf /seo /va/ /.well-known`, sitemaps que genera el build y salto de línea final).

## llms.txt y llms-full.txt

- `src/llms.txt` (llmstxt.org): H1, resumen en blockquote y secciones con enlaces a las páginas clave en ES y `/va/`, los datos estructurados y los documentos. **Se mantiene a mano**; el test exige que toda página publicable aparezca en él o esté declarada en `OPCIONALES_FUERA_DE_LLMS` (galerías, posts, autorizaciones). Al añadir una página, añádela a `llms.txt`.
- `dist/llms-full.txt` lo genera el build (`scripts/seo-artifacts.cjs → buildLlmsFull`): título y descripción de las 62 páginas ES/VA leídos del HTML publicado, más `src/seo/ai-training-data.md` como contexto. No se edita.
- Están enlazados desde `robots.txt` (comentario), `ai-discovery.json`, `.well-known/api-catalog`, la skill `llms-txt` de `.well-known/agent-skills/index.json` y `seo/ai-training-data.md`.

## Caché y verificación

- `.htaccess`: `*.xml` y `*.txt` se sirven con `Cache-Control: public, max-age=0, must-revalidate`, igual que el HTML y los JSON, para que la CDN de Hostinger no retenga un sitemap o un robots anterior.
- `npm run seo:verify:production` comprueba tras el deploy que `robots.txt`, `llms.txt`, `llms-full.txt`, `indexnow.txt` y los sitemaps publicados son idénticos a `dist/` y que `/robots-ai-optimized.txt` redirige.
- Google Search Console → *Configuración → robots.txt* muestra la última versión leída y los errores de sintaxis.

Relacionado: [`seo-indexnow.md`](./seo-indexnow.md) (aviso a buscadores tras publicar), [`structured-data.md`](./structured-data.md) (JSON-LD), [`well-known-agent-readiness.md`](./well-known-agent-readiness.md).
