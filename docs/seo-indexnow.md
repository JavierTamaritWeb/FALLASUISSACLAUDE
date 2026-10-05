# 📣 IndexNow: aviso a los buscadores tras publicar

**Versión:** 4.43.0 · **Última actualización:** 5 de octubre de 2026

Desde 4.43.0 cada deploy avisa a los buscadores de las URL cuyo contenido cambió, con el protocolo [IndexNow](https://www.indexnow.org/). Un solo `POST` a `https://api.indexnow.org/indexnow` se propaga a Bing, Yandex, Seznam, Naver y Yep (y, a través de Bing, a DuckDuckGo y a la búsqueda de ChatGPT). **Google no participa**: retiró el ping de sitemaps en 2023 y descubre los cambios por la directiva `Sitemap:` de `robots.txt`, el `lastmod` de los sitemaps y Search Console.

## Piezas

| Pieza | Papel |
|---|---|
| `src/indexnow.txt` | Clave IndexNow (32 hex). Es **pública por diseño**: el buscador la descarga de `https://fallasuissa.es/indexnow.txt` (`keyLocation`) para comprobar que quien envía controla el dominio; solo sirve para URL de este host. Por eso se versiona. Para rotarla: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` > `src/indexnow.txt`, build y deploy (el primer envío con la clave nueva puede devolver 202/403 hasta que la CDN la sirva) |
| `scripts/indexnow-submit.mjs` (`npm run seo:indexnow`) | Cliente sin dependencias. `--changed [--previous <json>]` envía las URL nuevas, cambiadas (hash distinto en `src/data/seo-history.json`) y retiradas respecto al snapshot indicado (sin `--previous`, respecto a `git HEAD`; sin historial anterior, todas). `--all` envía las URL de `dist/sitemap.xml`. `--urls a b…` envía una lista. `--dry-run` imprime el payload sin red. Reintenta dos veces en 403/429/red. Códigos de salida: 0 enviado o nada que enviar · 1 error del script (400/422, clave inválida, URL de otro host) · 2 el servicio no aceptó (el deploy sigue siendo correcto) |
| `tools/deploy.sh` pasos 6-7 | Tras el `200` de producción: (6) `node scripts/verify-seo-production.mjs` (salta con `--skip-verify`; si falla, aborta sin avisar a nadie) y (7) IndexNow con `--changed --previous .cache/seo-history.deployed.json` (salta con `--no-indexnow`). El snapshot `.cache/seo-history.deployed.json` guarda el historial del último deploy (carpeta ignorada por git); sin snapshot (primer deploy con IndexNow) se envía `--all`. En `--dry-run` solo se imprime la simulación |
| `src/data/seo-history.json` | Hash y fechas (`modified`, `published`) por URL canónica; lo escribe el build y **se commitea con cada release**. Es la fuente del `lastmod` de los sitemaps, de `dateModified`/`datePublished` del JSON-LD y del diff de IndexNow |

## Respuestas del servicio

| HTTP | Significado | Qué hacer |
|---|---|---|
| 200 | URL recibidas | Nada |
| 202 | Aceptado; la clave se validará en breve | Normal en el primer envío o tras rotar la clave |
| 400 | JSON o parámetros mal formados | Error del script: revisar y relanzar |
| 403 | Clave no válida o `indexnow.txt` no accesible | ¿La CDN sirve ya `/indexnow.txt`? El script reintenta; si persiste, relanzar más tarde con `npm run seo:indexnow -- --changed --previous .cache/seo-history.deployed.json` |
| 422 | URL fuera del host o clave distinta de la publicada | Revisar `src/indexnow.txt` y el sitemap |
| 429 | Demasiadas peticiones | El script espera y reintenta |

## Comprobar que funciona

- `bash tools/deploy.sh --dry-run --skip-build` imprime el payload que se enviaría.
- Bing Webmaster Tools (alta gratuita con la verificación DNS o el archivo de Google) muestra en *IndexNow* las URL recibidas y su estado. Yandex Webmaster tiene un panel equivalente.
- Search Console no muestra nada de IndexNow: para Google, comprobar *Sitemaps* (fecha de última lectura) y *Inspección de URL*.

## Qué NO hace

- No hace ping a Google (`/ping?sitemap=` murió en junio de 2023; ahora devuelve 404).
- No envía la misma URL dos veces por deploy ni reenvía URL sin cambios: el diff es por hash de contenido, no por fecha.
- No sustituye al sitemap: IndexNow acelera el rastreo; la indexación la deciden los buscadores.

Relacionado: [`build-and-deploy.md`](./build-and-deploy.md), [`robots-configuration.md`](./robots-configuration.md).
