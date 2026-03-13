# 🧩 Datos Estructurados y SEO Técnico

Esta guía documenta el JSON-LD que vive dentro de las páginas HTML, los artefactos de apoyo de la carpeta `seo/` y la validación técnica que protege la colaboración con HOPE-INCLIVA.

## 🎯 Alcance

Esta guía cubre:

- los bloques inline `application/ld+json` de `index.html` y `colaboraciones.html`
- los JSON de apoyo en `seo/schema-organization.json` y `seo/advanced-schema-graph.json`
- la coherencia entre metadatos `<meta>`, Open Graph y JSON-LD
- la validación automatizada en `tests/hope-seo.e2e.spec.js`

## 📍 Fuentes de verdad actuales

| Archivo | Papel |
| -------- | ------- |
| `index.html` | grafo principal de la home y referencia técnica a HOPE-INCLIVA |
| `colaboraciones.html` | página específica de colaboración con `mainEntity` enlazando el nodo HOPE |
| `seo/schema-organization.json` | asset de referencia para la organización |
| `seo/advanced-schema-graph.json` | grafo extendido con organización, HOPE, evento y location |
| `tests/hope-seo.e2e.spec.js` | regresión del SEO técnico de HOPE |

## 🧱 Patrón actual por página

### Home: `index.html`

La home utiliza un `@graph` con estos nodos principales:

- `Organization` con `@id` `https://fallasuissa.es/#organization`
- `WebSite` con `@id` `https://fallasuissa.es/#website`
- `WebPage` con `@id` `https://fallasuissa.es/#webpage`
- `WebSite` externo con `@id` `https://hope-incliva.com/#website`

Reglas importantes:

- la descripción y el Open Graph de la home mencionan HOPE-INCLIVA
- la `WebPage` referencia HOPE en `about`
- la `WebPage` también lo mantiene en `mentions`

### Página de colaboraciones: `colaboraciones.html`

La página dedicada usa también `@graph`, pero con una entidad principal específica:

- `Organization` de Falla Suïssa
- `WebSite` del sitio
- `WebPage` con `@id` `https://fallasuissa.es/colaboraciones.html#webpage`
- `CreativeWork` con `@id` `https://fallasuissa.es/colaboraciones.html#hope-collaboration`
- `WebSite` externo de HOPE

Reglas importantes:

- `WebPage.mainEntity` debe apuntar al nodo `#hope-collaboration`
- el `CreativeWork` debe seguir mencionando tanto a la organización como a HOPE
- el título, la descripción y los metadatos OG/Twitter deben estar alineados con la colaboración real, no solo con la galería visual

## 🤝 Regla específica de HOPE-INCLIVA

Para evitar romper el SEO técnico que ya está testado, mantén siempre estas condiciones:

1. El nodo externo de HOPE conserva el `@id` exacto `https://hope-incliva.com/#website`.
2. La home sigue hablando de HOPE como colaboración dentro del contexto general del sitio.
3. `colaboraciones.html` sigue usando un nodo principal propio con `mainEntity`.
4. Si cambias el copy de metadatos, actualiza también el JSON-LD y viceversa.
5. Si añades otro bloque JSON-LD en estas páginas, no desplaces el bloque principal sin revisar los tests y la lectura de crawlers.

## 🗂 Assets de apoyo en `seo/`

Los archivos JSON de `seo/` no sustituyen al JSON-LD inline de las páginas: sirven como referencia técnica y como parte del material SEO distribuido con el build.

### `seo/schema-organization.json`

Útil para centralizar los datos base de la organización:

- identidad de la comisión
- contacto
- redes sociales
- datos fundacionales
- relación con HOPE y subjectOf

### `seo/advanced-schema-graph.json`

Amplía el modelo con:

- organización
- website
- nodo externo de HOPE
- `CreativeWork` de colaboración
- evento cultural
- location y breadcrumbs

Si cambias datos base de la organización, la colaboración HOPE o la localización, revisa los dos assets además de los scripts inline de HTML.

## ✍️ Checklist de edición segura

Antes de cerrar un cambio de SEO técnico o Schema.org:

1. Mantén estables los `@id` que ya están enlazados entre nodos.
2. Alinea `title`, `meta description`, OG y Twitter con el foco de la página.
3. Revisa `canonical` y `hreflang` si cambia la URL o el tipo de página.
4. No dupliques la misma relación HOPE con IDs distintos.
5. Si tocas la colaboración, revisa home y `colaboraciones.html` como un conjunto.
6. Si cambias campos compartidos de organización, revisa también `seo/schema-organization.json` y `seo/advanced-schema-graph.json`.

## ✅ Validación recomendada

```bash
# Regenerar dist/
npm run build

# Validar solo HOPE SEO
npx playwright test tests/hope-seo.e2e.spec.js
```

Ejecuta además `npm run test:e2e:full` si el cambio también toca navegación, OG global, snapshots, meteo o layout compartido.

## 🧪 Qué valida hoy `tests/hope-seo.e2e.spec.js`

- que `index.html` menciona HOPE-INCLIVA en descripción y Open Graph
- que la home contiene un `@graph` válido
- que la `WebPage` de la home referencia `https://hope-incliva.com/#website`
- que `colaboraciones.html` dedica su SEO técnico a HOPE-INCLIVA
- que la página de colaboraciones mantiene `mainEntity` apuntando al nodo `#hope-collaboration`

## 🔗 Relacionado

- [`e2e-testing.md`](./e2e-testing.md): estrategia de validación Playwright
- [`open-graph-whatsapp.md`](./open-graph-whatsapp.md): `og-share.png` y cache-buster
- [`../index.html`](../index.html)
- [`../colaboraciones.html`](../colaboraciones.html)

---

Última actualización: 13 de marzo de 2026 - v4.2.16
