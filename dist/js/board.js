// js/board.js
// Tablón de anuncios dinámico
// Carga notas desde data/board.json y las renderiza en el contenedor #notesBoard

let boardData = null;
window.boardData = null;

/**
 * Carga datos del JSON
 * @returns {Promise<Object>} Datos del tablón
 */
async function loadBoardData() {
  try {
    const response = await fetch('data/board.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    window.boardData = data;
    boardData = data;
    return data;
  } catch (error) {
    console.error('Error cargando board.json:', error);
    window.boardData = { notas: [] };
    boardData = { notas: [] };
    return { notas: [] };
  }
}

/**
 * Genera HTML para un adjunto (con nombre traducible)
 * @param {Object} adj - Datos del adjunto
 * @param {boolean} isMultiple - Si hay múltiples adjuntos
 * @returns {string} HTML del adjunto
 */
function renderAdjunto(adj, isMultiple) {
  const lang = window.currentLang || 'es';
  const iconText = adj.tipo.toUpperCase();

  // Nombre traducible
  const nombre = typeof adj.nombre === 'object'
    ? (adj.nombre[lang] || adj.nombre.es)
    : adj.nombre;

  const ariaLabel = adj.tipo === 'pdf'
    ? `Descargar: ${nombre}`
    : `Ver imagen: ${nombre}`;

  const linkHTML = `
    <a href="${adj.url}" class="board__file-link"
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
 * Genera HTML para una nota
 * @param {Object} nota - Datos de la nota
 * @returns {string} HTML de la nota
 */
function renderNota(nota) {
  const lang = window.currentLang || 'es';
  const contenido = nota.contenido[lang] || nota.contenido.es;
  const hasAdjuntos = nota.adjuntos && nota.adjuntos.length > 0;

  if (!hasAdjuntos) {
    // Nota sin adjuntos - article directo con clase board__note
    return `
      <article class="board__note" role="article">
        <div class="clamp-screw" aria-hidden="true"></div>
        <div class="clamp-spring" aria-hidden="true"></div>
        <p class="board__note-content">${contenido}</p>
      </article>`;
  }

  const isMultiple = nota.adjuntos.length > 1;
  const adjuntosHTML = nota.adjuntos.map(adj => renderAdjunto(adj, isMultiple)).join('');

  // Nota con adjuntos - envuelta en board__card
  return `
    <article class="board__card" role="article">
      <div class="board__note">
        <div class="clamp-screw" aria-hidden="true"></div>
        <div class="clamp-spring" aria-hidden="true"></div>
        <p class="board__note-content">${contenido}</p>
      </div>
      ${isMultiple
        ? `<ul class="board__attachments">${adjuntosHTML}</ul>`
        : `<div class="board__file">${adjuntosHTML}</div>`}
    </article>`;
}

/**
 * Renderiza el tablón completo
 */
function renderBoard() {
  const container = document.getElementById('notesBoard');
  if (!container) {
    console.warn('Contenedor #notesBoard no encontrado');
    return;
  }

  if (!boardData?.notas) {
    console.warn('No hay datos de notas cargados');
    return;
  }

  const notasActivas = boardData.notas.filter(nota => nota.activo !== false);

  if (notasActivas.length === 0) {
    container.innerHTML = '<p class="board__empty">No hay anuncios en este momento.</p>';
    return;
  }

  container.innerHTML = notasActivas.map(renderNota).join('');
}

/**
 * Inicialización del tablón
 */
async function initBoard() {
  await loadBoardData();
  renderBoard();
}

// Re-renderizar cuando cambia el idioma
document.addEventListener('langChanged', renderBoard);

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initBoard);
