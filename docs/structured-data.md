# 🧩 Datos Estructurados (JSON-LD) y SEO Técnico

Esta guía documenta cómo se genera el `application/ld+json` de las 31 páginas publicables (62 URL: ES y `/va/`), qué parte vive en cada `src/*.html`, qué añade el build y cómo se valida.

## 🎯 Resumen

Desde v4.28.0 el JSON-LD lo **completa el build** (`gulpfile.js → processJsonLd`), igual que el `canonical`/`hreflang`:

- **Organization y WebSite** salen de una **única fuente**: `src/seo/schema-organization.json` (nodos `organization` y `website`). Se inyectan en el `@graph` de todas las páginas. NO se escriben inline.
- Cada `src/*.html` lleva **solo sus nodos propios** dentro de `{"@context":"https://schema.org","@graph":[…]}`: el nodo de página (`WebPage`, `AboutPage`, `CollectionPage`, `ImageGallery`…) y, si los tiene, `BlogPosting`, `VideoObject`, `CreativeWork`, `Blog`, `ItemList`, `WebPageElement`.
- El build **completa** el nodo de página (`name` = `<title>`, `description` = meta description, `primaryImageOfPage` = `og:image`, `isPartOf`, `inLanguage`), añade el **`BreadcrumbList`**, rellena las **galerías** (un `ImageObject` por foto de `dataPagesN.json`), la **lista de galerías** de `galerias.html`, fusiona los **`Event` del tablón** (`board.json`, en `index`/`eventos`) y, en `/va/`, reescribe las URL de página a `/va/…` e `inLanguage` a `ca-ES`.
- Siempre queda **un solo** `<script type="application/ld+json">` por página.
- **v4.43.0**: la Organization lleva `legalName`, `taxID`, `identifier` (nº 396), `additionalType` NGO, `knowsLanguage`, `areaServed`; el WebSite `copyrightYear`, `about` y un `SearchAction` (`?q=` abre el buscador; en `/va/` apunta a `/va/?q=`). Los textos de la fuente pueden ser `{ "es": "…", "ca": "…" }` y el build los resuelve por idioma (`resolveLang`): descripción de Organization y WebSite, `caption` del logo, nombre del casal, `contactType`, `areaServed`. El nodo de página lleva `dateModified`/`datePublished` (del historial `src/data/seo-history.json`, o del `BlogPosting` en los posts), toda página tiene `primaryImageOfPage` (las legales y autorizaciones ganaron `og:image`) y todo `ImageObject` propio lleva `width`/`height`/`encodingFormat` leídos del original de `src/img` con `sharp` (fotos de galería, imagen principal, imágenes de los posts). En `/va/` también se localizan `relatedLink`/`significantLink`, `ItemList.name`, los `headline` de `Blog.blogPost`, el `CreativeWork` HOPE (`seo.colaboraciones.hopeName/hopeDescription`) y el nombre del `DigitalDocument` de las autorizaciones.

## 📍 Fuentes de verdad

| Archivo | Papel |
| -------- | ------- |
| `src/seo/schema-organization.json` | Organization (`#organization`, con `legalName`, `taxID`, `identifier` 396, `founder`, `member` = directiva y delegados vigentes, `address` (solo calle: el piso del domicilio social no se publica en el schema), `location` `#place`, `logo` `#logo`, `sameAs` ≥ 3 con Facebook/Instagram/TikTok obligatorios, `memberOf` JCF, `areaServed`, `knowsLanguage`) y WebSite (`#website`, con `SearchAction`). Textos traducibles como `{es, ca}`. No convertir `@type` en array: `scripts/seo-artifacts.cjs` filtra la Organization por igualdad estricta al construir el sitemap de imágenes; usa `additionalType` |
| `src/data/seo-history.json` | hash, `modified` y `published` por URL canónica → `dateModified`/`datePublished` del nodo de página y `lastmod` de los sitemaps (lo escribe el build; se commitea) |
| `src/*.html` | nodos propios de cada página (ver tabla) |
| `src/data/dataPagesN.json` | fotos (`src`, `alt`) → `ImageObject` de `galeria_N.html` |
| `src/data/translations.json` | nombres del breadcrumb (`nav.*`, `galeria.galeriaN`, `blog.*.cardTitle`) y de la lista de galerías, en ES y VA |
| `src/data/board.json` | notas del tablón → `Event` (`getSchemaEvents`) |
| `src/seo/ai-enhanced-schema.json` | copia en inglés para agentes de IA (enlazada por `ai-info.html`, `ai-discovery.json` y `/.well-known/api-catalog`); debe coincidir con la fuente en `name`, `url`, `sameAs`, `address` y `geo` |
| `gulpfile.js` | `loadBaseSchema`, `loadGalleryImages`, `processJsonLd` y auxiliares |

Los antiguos `ld-json-enhanced.json` y `advanced-schema-graph.json` se **eliminaron** en v4.28.0 (contenían directiva, reseñas, premios y un buscador inventados). No los recrees.

## 🧱 Qué lleva cada página (inline en `src/`)

| Página | Nodo de página | Nodos propios |
|---|---|---|
| `index.html` | `WebPage` `https://fallasuissa.es/#webpage` | `about`/`mentions` → HOPE; nodo `WebSite` externo `https://hope-incliva.com/#website` (sin breadcrumb) |
| `colaboraciones.html` | `WebPage` | `CreativeWork` `#hope-collaboration` (`mainEntity`), WebSite HOPE |
| `lafalla.html` | `AboutPage` (`mainEntity` → `#organization`) | `VideoObject` `#video-ofrenda-2026` (vídeo de Archivos/Ofrendas) |
| `organigrama.html` | `AboutPage` (`mainEntity` → `#organization`) | — (las personas viven en `member` de la fuente) |
| `eventos.html` | `WebPage` (`mainEntity` → `#organization`) | `Event` del tablón (los añade el build) |
| `galerias.html` | `CollectionPage` | `ItemList` `#lista` (lo rellena el build con todas las galerías) |
| `galeria_1..10.html` | `ImageGallery` (`name`/`description` = `galeria.galeriaN`/`-texto`) | `associatedMedia: []` (lo rellena el build); `galeria_9` además `VideoObject` `#video` |
| `blog.html` | `CollectionPage` | `Blog` `#blog` con `blogPost` (resumen de cada post) |
| `blog-*.html` | `WebPage` (`mainEntity` → `#article`) | `BlogPosting` `#article` completo (`headline`, `description`, `image`, `datePublished`, `dateModified`, `inLanguage`, `articleSection`, `author`, `publisher` → ref) |
| `mapa.html` | `WebPage` (`mainEntity` → `#place`) | — |
| `llibret_2026.html` | `WebPage` (`inLanguage` multi) | `["CreativeWork","Book"]` `#llibre` + 10 `WebPageElement` |
| `calendario.html` | `WebPage` | `significantLink` → `eventos.html` |
| `deportes.html` | `WebPage` | `mentions` Junta Central Fallera (anidado, sin `@id`) |
| `ofrenda.html` | `WebPage` | `keywords` + `significantLink` al panel Ofrenda 2026 de Archivos (sin `Event`: solo `board.json` los genera) |
| legales (`aviso-legal`, `privacidad`, `cookies`) | `WebPage` | `genre`, `publisher` → ref, `isAccessibleForFree` |
| `autorizacion-imagen*.html` | `WebPage` (`mainEntity` → `#documento`) | `DigitalDocument` `#documento` (`encodingFormat text/html`, `audience`, `publisher`; `name` del idioma vía `nuevosFalleros.form*.titulo`) |
| resto (`meteo`, `nuevos-falleros`) | `WebPage` | `about` → `#organization`; `relatedLink` en Nuevos Falleros |

Convenciones:

- `@id` del nodo de página = `<url canónica>#webpage` (home: `https://fallasuissa.es/#webpage`). Los demás `@id` propios cuelgan de la misma URL (`#article`, `#video`, `#lista`, `#img-001`…).
- Referencias a la organización/web siempre como `{ "@id": "https://fallasuissa.es/#organization" }` / `…/#website`. Si escribes un Organization o WebSite propio inline, el build lo descarta con el aviso `[schema] <página>: nodo … inline descartado`.
- `name`/`description` del nodo de página pueden omitirse: el build los toma de `<title>` y `<meta name="description">`.
- Assets (`img/`, `pdf/`…) con URL **absoluta** `https://fallasuissa.es/img/...` (no `../`, no `?v=`).
- `Event` solo desde `board.json`. NO se generan `Event` desde `eventos.json` (festivos genéricos, entradas de prueba y fechas pasadas: sería dato engañoso).

## ⚙️ Cómo trabaja el build

`modifyHtmlStream` (gulpfile) ejecuta `processJsonLd` **después** del pre-render VA y de `rewriteAssetUrlsToRoot` (ninguno toca el JSON) y **antes** de inyectar el `canonical`:

1. `extractFirstJsonLd`: lee el primer `<script ld+json>` (nodo suelto, array o `@graph`). JSON inválido en `src` → el build falla.
2. `normalizeGraph`: descarta Organization/WebSite propios y convierte `publisher`/`isPartOf`/`creator`… inline en `{ "@id" }`.
3. `ensurePageNode`: localiza o crea el nodo de página y lo completa; `applyPageDates` añade `dateModified`/`datePublished` del historial (clave `/va/…` en la variante VA) o del `BlogPosting` principal; la imagen principal recibe `width`/`height`/`encodingFormat` (`imageMeta`, memoizado, precargado por `collectSchemaImagePaths` al inicio de `htmlTask`).
   - **Segunda pasada**: el historial lo escribe `generateSeoArtifacts` después del HTML, así que `seoArtifactsTask` compara el archivo antes/después y, si cambió (URL nueva o contenido nuevo), repite `htmlTask`. Es idempotente porque `contentHash` elimina las claves `dateModified`/`datePublished` antes de calcular el hash (una página recién entrada en el historial da el mismo hash con y sin fechas). Comprobación: dos `npm run build` seguidos dejan `src/data/seo-history.json` sin cambios.
4. `buildBreadcrumb` (todas menos la home): Inicio › [Galería | Blog | Nuevos Falleros | La Falla] › página, con nombres de `translations.json` en el idioma de la variante.
5. `fillImageGallery` / `fillGaleriasList`: galerías (solo entradas de `dataPagesN.json` con `src` bajo `img/`; `contentUrl` apunta al JPEG/PNG original si existe en `src/img/`).
6. `mergeEventNodes`: `Event` del tablón en `index.html` y `eventos.html`.
7. `localizeGraph` (solo `/va/`): `@id`/`url`/`item`/`mainEntityOfPage` de página → `/va/`; `inLanguage` `es-ES` → `ca-ES`. No cambian `#organization`, `#website`, `#place`, `#logo`, los assets ni los nodos de `hope-incliva.com`.
8. `toJsonLdScript`: `@graph = [Organization, WebSite, …nodos]`, con `<` y U+2028/2029 escapados. Si la página no tenía ld+json, el script se añade junto al `canonical`.

`loadBaseSchema` valida la fuente al arrancar (`@id`, nombre canónico, 3 `sameAs`, `member` con el Presidente) y rompe el build si no cumple. Kill-switch: `DISABLE_SCHEMA_INJECT=1 npm run build` deja los bloques inline tal cual.

## 📏 Reglas

1. **Cada cambio de contenido revisa su JSON-LD** (regla del usuario, 11-sep-2026): nombres/cargos, fechas, páginas nuevas, imágenes, vídeos, textos con `datePublished`. En el checklist de commit va junto a la revisión de sitemaps.
2. **Relevo de cargos**: editar `member`/`founder` en `src/seo/schema-organization.json` **y** el organigrama (`index.html`, `lafalla.html`, `organigrama.html`). Ningún HTML lleva ya `Person` inline.
3. **Nunca** Organization/WebSite inline; nunca un segundo `<script ld+json>`.
4. **Página nueva**: bloque mínimo `{"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":"https://fallasuissa.es/<file>#webpage","url":"https://fallasuissa.es/<file>","inLanguage":"es-ES","about":{"@id":"https://fallasuissa.es/#organization"}}]}`; el build hace el resto. Si necesita padre en el breadcrumb, añadirlo a `BREADCRUMB_PARENT`/`BREADCRUMB_NAV_KEY` del gulpfile.
5. **Post nuevo**: `WebPage` + `BlogPosting` `#article` con todos los campos, y su resumen en `blogPost` de `blog.html`; `article:published_time`/`modified_time` en el `<head>`.
6. **Galería nueva**: `ImageGallery` con `associatedMedia: []`; las fotos salen de `dataPagesN.json`.
7. Al editar un post o un vídeo, actualiza `dateModified` / `uploadDate`.
8. El `@id` de HOPE es exactamente `https://hope-incliva.com/#website`; no dupliques la relación con otros ids.
9. Si cambian datos de la organización, sincroniza `src/seo/ai-enhanced-schema.json` (el test lo compara con la fuente).

## ✅ Validación

```bash
npm run build
npm run seo:schema-report          # informe de las 60 páginas (ES + /va/): scripts, tipos, inLanguage, refs sin resolver, nº ImageObject
npx playwright test tests/schema-jsonld.e2e.spec.js tests/hope-seo.e2e.spec.js tests/event-schema.e2e.spec.js
```

`tests/schema-jsonld.e2e.spec.js` (smoke) comprueba en las 60 páginas: un solo script, JSON válido, `#organization`/`#website` de la fuente (nombre, redes, miembros vigentes, sin `employee`), nodo de página con `url` = canonical e `inLanguage` según ruta, breadcrumb, `@id` únicos, referencias resueltas, ausencia de datos obsoletos (`Quiles`, `Marta Soriano`…) y de la URL de Facebook inválida en el HTML; galerías con un `ImageObject` por foto, `VideoObject` de `galeria_9`, `ItemList` de galerías, `Blog`/`BlogPosting`, llibret sin `Event`, y `ai-enhanced-schema.json` alineado con la fuente. `tests/hope-seo.e2e.spec.js` cubre la relación HOPE (ES y `/va/`); `tests/event-schema.e2e.spec.js`, los `Event` del tablón.

Validación externa opcional: pegar el `<script ld+json>` de `dist/<página>.html` en el validador de Schema.org o en la prueba de resultados enriquecidos de Google.

## Metadatos de licencia de imagen (Search Console, v4.33.0)

Search Console avisaba de que los `ImageObject` no llevaban `creator`, `copyrightNotice`, `license` ni `acquireLicensePage`. El build (`gulpfile.js → completeImageObjects`) recorre el `@graph` completo de cada página y completa esos campos (más `creditText`) en todo `ImageObject` que no los defina: logo de la Organization, `primaryImageOfPage`, las fotos de las 9 galerías y las imágenes de los posts. Valores: `creator` = Organization con el nombre de la Falla, `copyrightNotice` = `© <año del build> Falla Suïssa - L'Alqueria del Favero`, `license` y `acquireLicensePage` = `aviso-legal.html#propiedad-intelectual` (en `/va/`, la versión valenciana). Si una imagen tiene otro autor o licencia, escribe esos campos en el HTML y el build los respeta. `npm run seo:schema-report` marca como problema cualquier `ImageObject` incompleto y `tests/schema-jsonld.e2e.spec.js` lo comprueba en las galerías.

---

Última actualización: 5 de octubre de 2026 - v4.43.0

## Actualización SEO v4.30.21

`readHeadMeta` admite atributos en `<title>`. Los nombres y descripciones de página y blog proceden del head traducido; los artículos localizan headline y sección, y las galerías utilizan `galleryAlts` en sus ImageObject. El endpoint histórico `seo/ai-enhanced-schema.json` se genera desde `schema-organization.json`, sin cargos duplicados ni premios institucionales no acreditados.

Los sitemaps se generan desde este inventario de páginas. Ver [`build-and-deploy.md`](./build-and-deploy.md) para noticias y seguimiento de lastmod por contenido. Pasar `seo:schema-report` acredita las reglas internas, no garantiza un resultado enriquecido ni la indexación en Google.
