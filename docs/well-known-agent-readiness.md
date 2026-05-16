# 🤖 `.well-known/` y Agent-Readiness

Guía canónica de la carpeta `.well-known/` del proyecto, qué archivos contiene, cómo se mantiene en el build y qué reglas críticas hay que respetar.

> **TL;DR.** `.well-known/` es la "fachada legible por máquina" del sitio: un directorio estándar (RFC 8615) donde cualquier cliente automatizado — crawlers, asistentes IA, agentes autónomos — encuentra metadatos verificables y capacidades expuestas sin tener que parsear HTML. En este repo convierte a fallasuissa.es en un sitio cultural **+ API descubrible por agentes IA**.

---

## 🧭 ¿Qué es `.well-known/`?

`.well-known/` es una **convención estándar de la web** definida por el **RFC 8615** ("Well-Known URIs", IETF 2014). La regla es simple:

> Si un cliente (navegador, crawler, agente IA, servicio externo) quiere descubrir algo "oficial" de un dominio, lo busca en una ubicación predecible:
>
> ```
> https://tudominio.com/.well-known/<recurso-conocido>
> ```

…sin adivinar rutas, sin leer HTML, sin scraping. Es el equivalente moderno y estandarizado del antiguo `robots.txt`: un lugar **fijo, predecible y machine-readable** donde publicar declaraciones.

El nombre empieza por punto (`.well-known`) por convención Unix de archivos "ocultos", aunque en web es perfectamente público y servido normalmente por el servidor.

### Ejemplos famosos (no inventos del proyecto)

| Recurso | Propósito | Estándar |
|---------|-----------|----------|
| `/.well-known/security.txt` | Contacto de seguridad para reportar vulnerabilidades | RFC 9116 |
| `/.well-known/openid-configuration` | Descubrimiento OAuth/OIDC (Google, Microsoft, Auth0…) | OpenID Connect |
| `/.well-known/acme-challenge/` | Verificación de dominio para Let's Encrypt | RFC 8555 |
| `/.well-known/apple-app-site-association` | Universal Links de iOS | Apple |
| `/.well-known/assetlinks.json` | App Links de Android | Google |
| `/.well-known/host-meta` | Descubrimiento WebFinger (Mastodon, ActivityPub…) | RFC 6415 |
| `/.well-known/api-catalog` | Catálogo de APIs de una organización | **RFC 9727** (2025) |
| `/.well-known/agent-skills/index.json` | Catálogo de "skills" para agentes IA | **Agent Skills v0.2** |

Los dos últimos los estrenamos en **v4.7.1** ("Agent-readiness pass").

---

## 🎯 Por qué este proyecto la tiene

Cuando se publica un sitio web cultural moderno (2025-2026), no basta con que lo vean **humanos** y **Googlebot**. También lo visitan:

- **ChatGPT/Claude/Gemini con herramientas web** que rastrean para responder preguntas.
- **Crawlers de modelos LLM** entrenando o construyendo índices.
- **Agentes autónomos** que ejecutan tareas (reservar, consultar, enriquecer datos).
- **Asistentes de voz** (Alexa, Siri, Google Assistant).

Esos clientes funcionan mejor si pueden **descubrir capacidades estructuradas** sin parsear HTML. La carpeta `.well-known/` es la puerta principal de ese descubrimiento.

Resumen del cambio v4.7.1 en `CLAUDE.md`:

> "Cinco mejoras coordinadas para que el sitio se publique correctamente ante agentes IA y crawlers que siguen los nuevos estándares (RFC 8288, RFC 9727, Agent Skills v0.2, contentsignals.org, negociación markdown)."

---

## 📂 Qué contiene la carpeta en este proyecto

### Estructura

Source (`src/.well-known/`) → copiada a `dist/.well-known/` por el build:

```
.well-known/
├── api-catalog                       ← RFC 9727 — catálogo de endpoints JSON
└── agent-skills/
    └── index.json                    ← Agent Skills Discovery v0.2.0 (generado en build)
```

### 1. `api-catalog` (sin extensión)

Fichero **`application/linkset+json`** (Link Set Format, RFC 9264) que lista los endpoints de datos del sitio con metadatos: dónde encontrarlos, qué documentación tienen, cómo consumirlos.

Hoy referencia: `board.json`, `eventos.json`, `calendarData.json`, `translations.json`, `sitemap-index.xml`, etc., cada uno con su `service-doc` y `service-desc`.

> ⚠️ El archivo **NO tiene extensión** (`api-catalog`, no `api-catalog.json`). Es así por especificación RFC 9727. Como Apache no sabe inferir el MIME type sin extensión, el `src/.htaccess` tiene un bloque especial:
>
> ```apache
> <Files "api-catalog">
>   ForceType application/linkset+json
> </Files>
> ```
>
> Sin esa línea, Apache lo serviría como `text/html` y los agentes lo descartarían como inválido.

### 2. `agent-skills/index.json`

Catálogo de **"skills"** (capacidades públicas read-only) que un agente IA puede consumir, según el estándar **Agent Skills Discovery v0.2.0** (agentskills.io).

Lista actual (7 skills, ver array `skills` en `wellKnownTask` dentro de `gulpfile.js`):

| name | type | apunta a | qué contiene |
|------|------|----------|--------------|
| `falla-discovery` | data | `/ai-discovery.json` | Metadata de descubrimiento (idiomas, branding, social, ubicación) |
| `ai-context` | document | `/seo/ai-training-data.md` | Guía de contexto en Markdown para LLMs |
| `events-board` | data | `/data/board.json` | Tablón de citas/eventos vigentes |
| `sports-board` | data | `/data/sports-board.json` | Tablón JCF deportivo (añadido en v4.7.2) |
| `events-list` | data | `/data/eventos.json` | Listado de eventos del ejercicio fallero |
| `calendar-data` | data | `/data/calendarData.json` | Datos del calendario anual |
| `structured-data` | data | `/seo/ai-enhanced-schema.json` | Grafo Schema.org enriquecido |

Cada entrada incluye su **`sha256`** recalculado en cada build, lo que permite a un agente verificar integridad:

- Hash sin cambios → el agente sabe que no hace falta volver a descargar.
- Hash modificado → el contenido se actualizó y el agente sabe que debe recargar.

---

## 🔗 Cómo lo descubre un agente

Flujo canónico de descubrimiento:

1. **Agente entra en `https://fallasuissa.es/`** (página principal).
2. El servidor (vía `src/.htaccess`) responde con un **header HTTP `Link:`** (RFC 8288) apuntando a los recursos `.well-known/`:
   ```http
   Link: </.well-known/api-catalog>; rel="api-catalog",
         </.well-known/agent-skills/index.json>; rel="agent-skills",
         </ai-discovery.json>; rel="describedby"
   ```
3. El agente sigue esos `Link:` headers y **descarga directamente los JSON estructurados**, sin scraping del HTML.
4. Desde `agent-skills/index.json` itera las skills y descarga cada recurso usando el `sha256` como caché.

Resultado: en **3 requests HTTP** (`/`, `agent-skills/index.json`, recursos) un agente tiene todo el sitio modelado sin parsear una línea de HTML.

---

## 🔧 Cómo se mantiene en este proyecto

### Pipeline automático (`gulpfile.js → wellKnownTask`)

En cada `npm run build`:

1. **Copia verbatim** `src/.well-known/**` → `dist/.well-known/`.
2. **Genera desde cero** `dist/.well-known/agent-skills/index.json`:
   - Itera el array `skills` codificado en `gulpfile.js` (líneas ~706-755).
   - Para cada entrada, **lee el archivo real en `dist/`** y calcula su SHA-256.
   - Escribe el índice con `updated: <fecha de hoy>` y los `sha256` recalculados.
3. Si un archivo referenciado falta, **omite esa skill con un warning** (`[agent-skills] omitida skill "X": ... no existe todavía`) y NO rompe el build.

### Orden crítico en el build series

`wellKnownTask` se ejecuta **después** de `dataTask`, `rootFilesTask` y `seoTask`. Razón: necesita que los archivos referenciados ya existan en `dist/` para poder hashearlos. Si lo mueves antes, los `sha256` se calcularían sobre archivos inexistentes y todas las skills se omitirían en silencio.

### Qué se actualiza solo y qué no

🟢 **Automático en cada build:**
- `sha256` de cada skill (cambia si cambia el contenido del recurso).
- Fecha `updated` del índice.
- Copia de cualquier archivo nuevo añadido a `src/.well-known/`.

🔴 **Manual (requiere editar `gulpfile.js`):**
- Añadir/quitar/renombrar una skill en el catálogo (no hay autodescubrimiento; las skills están enumeradas explícitamente en el array `skills`).
- Cambiar `description`, `url`, `type` o `contentType` de una skill existente.

🔴 **Manual (requiere editar `src/.htaccess`):**
- Cambiar el `Link:` header si añades nuevas relaciones (`mcp-server`, etc.).

🔴 **Manual (editar `src/.well-known/api-catalog`):**
- Añadir un nuevo endpoint JSON al catálogo de APIs.

---

## ⚠️ Reglas críticas (resumen de `CLAUDE.md → Architecture Decisions & Constraints`)

1. **Coordinación tripartita**: el `Link:` header del `.htaccess`, los archivos de `.well-known/` y el `ai-discovery.json` deben coincidir. Si añades una relación nueva al header, publica el recurso al mismo tiempo.
2. **`api-catalog` sin extensión**: NO renombrar a `api-catalog.json` ni borrar el bloque `<Files "api-catalog">` del `.htaccess`.
3. **Orden del build**: NO mover `wellKnownTask` antes de `dataTask`/`rootFilesTask`/`seoTask`.
4. **Skills se editan en gulpfile**: NO editar a mano `dist/.well-known/agent-skills/index.json` — el build lo sobrescribe.
5. **Negociación Markdown** (`/` con `Accept: text/markdown` → `seo/ai-training-data.md`) es complementaria pero independiente.
6. **`Content-Signal: yes/yes/yes`** en `src/robots.txt` declara que el sitio acepta indexación, AI training y AI input (sitio cultural público que busca exposición). Si en algún momento se quisiera bloquear training, edita esa línea sin tocar el resto.

---

## ➕ Cómo añadir una skill nueva

Ejemplo: exponer un nuevo `data/casal-board.json` como skill `casal-board`.

1. Asegúrate de que el archivo origen existe (`src/data/casal-board.json`) y se copia a `dist/data/` (el `dataTask` lo hace automáticamente con cualquier `*.json` en `src/data/`).
2. Abre `gulpfile.js`, localiza el array `skills` dentro de `wellKnownTask` (línea ~706).
3. Añade una entrada nueva siguiendo el shape:

   ```js
   {
     name: 'casal-board',
     type: 'data',
     description: 'Tablón del Casal: avisos internos y comunicados.',
     url: `${SITE_BASE}/data/casal-board.json`,
     distPath: 'dist/data/casal-board.json',
     contentType: 'application/json'
   }
   ```

4. `npm run build`.
5. Verifica:

   ```bash
   cat dist/.well-known/agent-skills/index.json | jq '.skills[] | select(.name=="casal-board")'
   ```

   Debe aparecer con `sha256` propio. Si ves un warning `[agent-skills] omitida skill "casal-board"`, el `distPath` no existe — revisa el path.

6. (Opcional) Si la skill expone un nuevo tipo de recurso al que apunta también el `Link:` header de respuestas HTML, actualiza el bloque `Header set Link` en `src/.htaccess`.

---

## 🧪 Verificación end-to-end

```bash
# 1) Build
npm run build

# 2) Inspecciona el índice
cat dist/.well-known/agent-skills/index.json | jq

# 3) Sirve dist/ localmente
node scripts/serve-dist.mjs

# 4) Comprueba que el Link: header se emite en respuestas HTML
curl -sI http://127.0.0.1:4173/ | grep -i '^link:'

# 5) Descarga el catálogo de APIs (sin extensión, debe llegar como application/linkset+json)
curl -sI http://127.0.0.1:4173/.well-known/api-catalog | grep -i '^content-type:'
```

Resultado esperado:

- `index.json` lista las 7 skills (o las que correspondan) con `sha256` y `updated` actual.
- `curl -I /` incluye `Link: </.well-known/api-catalog>; rel="api-catalog", ...`.
- `curl -I /.well-known/api-catalog` devuelve `Content-Type: application/linkset+json` (NO `text/html`).

> ⚠️ **Nota sobre servidor local**: `scripts/serve-dist.mjs` no aplica reglas de `.htaccess` (eso solo lo hace Apache en producción). Los headers `Link:` y `ForceType` solo se verán reales contra el dominio en producción o un Apache local. Para validar localmente, basta con confirmar que los archivos están en `dist/` y que el `index.json` se generó correctamente.

---

## 🔗 Relacionado

- [`structured-data.md`](./structured-data.md): JSON-LD inline, grafos Schema.org y `seo/ai-enhanced-schema.json` (la skill `structured-data`).
- [`robots-configuration.md`](./robots-configuration.md): `robots.txt`, `Content-Signal` y relación con bots/agentes.
- [`gestion-tablon.md`](./gestion-tablon.md): cómo se nutren las skills `events-board` y `sports-board` desde los JSON del tablón.
- [`i18n-translations.md`](./i18n-translations.md): el sistema de traducciones, base para los `ai-discovery.json` multilingües.

---

Última actualización: 16 de mayo de 2026 - v4.7.2
