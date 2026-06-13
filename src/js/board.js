// Raíz del sitio: '/' en producción; calculada desde la ruta de la página
// para soportar servir la web desde un subdirectorio (p. ej. Live Server
// sirviendo la raíz del repo con el sitio en /dist/). Elimina el nombre de
// archivo y el segmento va/ final de la ruta actual.
window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/(?:va\/)?[^/]*$/, '');

// js/board.js
// Tablón de anuncios dinámico — multi-instancia
// Descubre todos los <div class="board"> del DOM, lee data-board-source
// (default 'data/board.json') por elemento y los renderiza independientemente.

const DEFAULT_BOARD_SOURCE = 'data/board.json';
const VALID_ADJUNTO_TYPES = new Set(['pdf', 'img']);

// Las rutas relativas (data-board-source y las url de imagen/adjuntos del
// JSON) se resuelven contra la raíz del sitio: desde las páginas /va/
// resolverían a /va/data|img|pdf, que no existen.
function resolveBoardUrl(url) {
  // Las URLs absolutas, con esquema, con ancla o ya relativas con ../ se dejan tal cual.
  if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/|\.{1,2}\/|#)/i.test(url)) {
    return url;
  }
  return window.SITE_ROOT + url;
}

// ---------------------------------------------------------------------------
// Saneamiento (defensa en profundidad)
// board.json/sports-board.json son de primer origen, pero los editan delegados
// (ver docs/gestion-tablon.md). Estas utilidades evitan que un HTML/atributo
// peligroso introducido por error o por un compromiso del repo se ejecute.
// ---------------------------------------------------------------------------

// Escapa entidades para interpolar en contexto de atributo o texto.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Acepta rutas relativas, anclas y http(s); rechaza esquemas peligrosos
// (javascript:, data:, vbscript:, etc.) aunque lleven espacios/control de por
// medio para disfrazarlos.
function isSafeUrl(url) {
  const value = String(url == null ? '' : url).trim();
  if (!value) return false;
  const scheme = value.replace(/[\u0000-\u0020]+/g, '').match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) {
    return /^https?$/i.test(scheme[1]);
  }
  return true; // relativa o ancla
}

// Conjunto mínimo de etiquetas/atributos de formato permitidos en el contenido
// de una nota (que sí admite HTML intencionado: <br>, énfasis, enlaces).
const BOARD_ALLOWED_TAGS = new Set(['BR', 'STRONG', 'EM', 'B', 'I', 'U', 'P', 'SPAN', 'A']);
const BOARD_ALLOWED_ATTRS = { A: new Set(['href', 'target', 'rel']) };

// Sanea HTML de confianza limitada usando el parser del navegador sobre un
// <template> inerte (no ejecuta scripts ni dispara onerror al parsear): conserva
// solo las etiquetas/atributos de la allowlist y descarta el resto como texto.
function sanitizeBoardHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html == null ? '' : html);

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      if (!BOARD_ALLOWED_TAGS.has(child.tagName)) {
        // Etiqueta no permitida -> se reemplaza por su texto plano.
        child.replaceWith(document.createTextNode(child.textContent || ''));
        return;
      }

      const allowed = BOARD_ALLOWED_ATTRS[child.tagName] || new Set();
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const isUnsafeAttr = !allowed.has(name) || name.startsWith('on');
        const isUnsafeHref = name === 'href' && !isSafeUrl(attr.value);
        if (isUnsafeAttr || isUnsafeHref) {
          child.removeAttribute(attr.name);
        }
      });

      if (child.tagName === 'A') {
        child.setAttribute('rel', 'noopener noreferrer');
      }

      walk(child);
    });
  };

  walk(template.content);
  return template.innerHTML;
}

// Cache de fetches (url -> Promise<data>) para no duplicar petición si
// dos tableros comparten el mismo JSON.
const boardSourceCache = new Map();

// Registro de tableros activos en la página (id -> { el, source, data }).
const boardRegistry = new Map();

// Compatibilidad legacy: el primer tablero cargado sigue exponiendo sus datos
// en window.boardData por si algún script externo dependía de ello.
window.boardData = null;

function getCurrentBoardLang() {
  if (typeof currentLang === 'string' && currentLang) {
    return currentLang;
  }

  try {
    return localStorage.getItem('lang') || window.currentLanguage || 'es';
  } catch (e) {
    // Safari con localStorage bloqueado lanza SecurityError.
    return window.currentLanguage || 'es';
  }
}

function getBoardTranslation(key, fallback) {
  if (typeof translate === 'function') {
    const translation = translate(key);
    if (translation && translation !== key) {
      return translation;
    }
  }

  return fallback;
}

function refreshBoardReveal(root) {
  if (window.scrollReveal && typeof window.scrollReveal.refresh === 'function') {
    window.scrollReveal.refresh(root);
  }
}

function getAdjuntoNombre(adj, lang) {
  if (typeof adj.nombre === 'object' && adj.nombre !== null) {
    return (adj.nombre[lang] || adj.nombre.es || '').trim();
  }

  return typeof adj.nombre === 'string' ? adj.nombre.trim() : '';
}

function renderImagen(imagen, lang) {
  if (!imagen || typeof imagen !== 'object') {
    return '';
  }

  const url = typeof imagen.url === 'string' ? imagen.url.trim() : '';
  if (!url || !isSafeUrl(url)) {
    return '';
  }

  let alt = '';
  if (typeof imagen.alt === 'object' && imagen.alt !== null) {
    alt = (imagen.alt[lang] || imagen.alt.es || '').trim();
  } else if (typeof imagen.alt === 'string') {
    alt = imagen.alt.trim();
  }

  return `
    <figure class="board__figure">
      <img class="board__image" src="${escapeHtml(resolveBoardUrl(url))}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">
    </figure>`;
}

function getAdjuntosValidos(adjuntos, lang) {
  if (!Array.isArray(adjuntos)) {
    return [];
  }

  return adjuntos
    .map((adj) => {
      if (!adj || typeof adj !== 'object') {
        return null;
      }

      const tipo = typeof adj.tipo === 'string' ? adj.tipo.trim().toLowerCase() : '';
      const url = typeof adj.url === 'string' ? adj.url.trim() : '';
      const nombre = getAdjuntoNombre(adj, lang);

      if (!VALID_ADJUNTO_TYPES.has(tipo) || !url || !nombre || !isSafeUrl(url)) {
        return null;
      }

      return { tipo, url: resolveBoardUrl(url), nombre };
    })
    .filter(Boolean);
}

/**
 * Carga (con cache) datos de un JSON-fuente del tablón.
 * @param {string} url
 * @returns {Promise<Object>}
 */
function fetchBoardSource(url) {
  if (!boardSourceCache.has(url)) {
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        console.error(`Error cargando ${url}:`, error);
        return { notas: [] };
      });
    boardSourceCache.set(url, promise);
  }
  return boardSourceCache.get(url);
}

/**
 * Genera HTML para un adjunto (con nombre traducible).
 */
function renderAdjunto(adj, isMultiple) {
  const iconText = escapeHtml(adj.tipo.toUpperCase());
  const nombre = escapeHtml(adj.nombre);
  const actionLabel = adj.tipo === 'pdf'
    ? getBoardTranslation('board.downloadFile', 'Descargar')
    : getBoardTranslation('board.viewImage', 'Ver imagen');

  const ariaLabel = escapeHtml(`${actionLabel}: ${adj.nombre}`);
  const safeUrl = escapeHtml(adj.url);

  const linkHTML = `
    <a href="${safeUrl}" class="board__file-link"
       target="_blank" rel="noopener noreferrer"
       aria-label="${ariaLabel}">
      <svg class="board__file-icon board__file-icon--${adj.tipo}"
           xmlns="http://www.w3.org/2000/svg" width="50" height="50"
           viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path d="M3 1h14l4 4v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
        <polygon points="17 1 21 5 17 5" fill="#ffffff" opacity="0.9"/>
        <text x="12" y="15" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700" fill="#fff">${iconText}</text>
      </svg>
      <span class="board__file-name">${nombre}</span>
    </a>`;

  return isMultiple ? `<li class="board__file">${linkHTML}</li>` : linkHTML;
}

/**
 * Genera HTML para una nota.
 */
function renderNota(nota) {
  const lang = getCurrentBoardLang();
  // El contenido admite HTML de formato intencionado (<br>, énfasis, enlaces),
  // por eso se sanea con allowlist en vez de escaparse por completo.
  const contenido = sanitizeBoardHtml(nota.contenido[lang] || nota.contenido.es);
  const adjuntosValidos = getAdjuntosValidos(nota.adjuntos, lang);
  const hasAdjuntos = adjuntosValidos.length > 0;
  const imagenHTML = renderImagen(nota.imagen, lang);
  const hasImagen = imagenHTML !== '';
  const hasExtras = hasAdjuntos || hasImagen;

  if (!hasExtras) {
    return `
      <article class="board__note reveal reveal--soft" role="article">
        <div class="clamp-screw" aria-hidden="true"></div>
        <div class="clamp-spring" aria-hidden="true"></div>
        <p class="board__note-content">${contenido}</p>
      </article>`;
  }

  const isMultiple = adjuntosValidos.length > 1;
  const adjuntosHTML = hasAdjuntos
    ? adjuntosValidos.map(adj => renderAdjunto(adj, isMultiple)).join('')
    : '';
  const adjuntosBloque = hasAdjuntos
    ? (isMultiple
        ? `<ul class="board__attachments">${adjuntosHTML}</ul>`
        : `<div class="board__file">${adjuntosHTML}</div>`)
    : '';

  return `
    <article class="board__card reveal reveal--soft" role="article">
      <div class="board__note">
        <div class="clamp-screw" aria-hidden="true"></div>
        <div class="clamp-spring" aria-hidden="true"></div>
        <p class="board__note-content">${contenido}</p>
      </div>
      ${imagenHTML}
      ${adjuntosBloque}
    </article>`;
}

/**
 * Renderiza un tablón concreto a partir de sus datos.
 */
function renderBoardInto(el, data) {
  if (!data || !Array.isArray(data.notas)) {
    return;
  }

  const notasActivas = data.notas.filter(nota => nota.activo !== false);

  if (notasActivas.length === 0) {
    const emptyMessage = getBoardTranslation('board.empty', 'No hay anuncios en este momento.');
    el.innerHTML = `<p class="board__empty reveal reveal--soft">${emptyMessage}</p>`;
    refreshBoardReveal(el);
    return;
  }

  el.innerHTML = notasActivas.map(renderNota).join('');
  refreshBoardReveal(el);
}

/**
 * Re-renderiza todos los tableros registrados (al cambiar idioma).
 */
function renderAllBoards() {
  boardRegistry.forEach(({ el, data }) => renderBoardInto(el, data));
}

/**
 * Inicializa un único tablero: carga su JSON-fuente y lo renderiza.
 */
async function initBoardEl(el, index) {
  const id = el.id || `board-${index}`;
  if (!el.id) {
    el.id = id;
  }

  const source = resolveBoardUrl((el.dataset.boardSource || DEFAULT_BOARD_SOURCE).trim());
  const data = await fetchBoardSource(source);

  boardRegistry.set(id, { el, source, data });

  if (window.boardData === null) {
    window.boardData = data;
  }

  renderBoardInto(el, data);
}

/**
 * Descubre todos los tableros del DOM y los inicializa.
 */
async function initAllBoards() {
  const boards = document.querySelectorAll('div.board');

  if (boards.length === 0) {
    return;
  }

  await Promise.all(Array.from(boards).map((el, i) => initBoardEl(el, i)));

  document.addEventListener('translationsReady', renderAllBoards, { once: true });
}

document.addEventListener('langChanged', renderAllBoards);
document.addEventListener('DOMContentLoaded', initAllBoards);
