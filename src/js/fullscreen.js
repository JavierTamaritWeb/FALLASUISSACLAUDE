// js/fullscreen.js
// Visor de imágenes a pantalla completa para galerías (.notepad__page)
// Usa Fullscreen API nativa si disponible, lightbox overlay como fallback (iPhone Safari)

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // Overlay fallback (para dispositivos sin Fullscreen API, como iPhone)
  // =========================================================================
  let overlay = null;
  let overlayImg = null;

  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'fullscreen-fallback';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-label', 'Imagen ampliada');

    // Estilos inline para evitar dependencia de SCSS
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.95);display:none;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;';

    overlayImg = document.createElement('img');
    overlayImg.style.cssText = 'max-width:95vw;max-height:95vh;object-fit:contain;border-radius:0.5rem;user-select:none;-webkit-user-select:none;pointer-events:none;';
    overlayImg.alt = '';
    overlayImg.draggable = false;

    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    // Cerrar al tocar/clicar
    overlay.addEventListener('click', closeFallback);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display === 'flex') {
        closeFallback();
      }
    });
  }

  function openFallback(imgSrc, imgAlt) {
    if (!overlay) createOverlay();
    overlayImg.src = imgSrc;
    overlayImg.alt = imgAlt || '';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeFallback() {
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    overlayImg.src = '';
    document.body.style.overflow = '';
  }

  // =========================================================================
  // Click en imagen de galería
  // =========================================================================
  document.addEventListener('click', (event) => {
    if (event.target.tagName === 'IMG' && event.target.closest('.notepad__page')) {
      const img = event.target;
      // Detectar en el momento del clic (no al cargar) para que funcione con tests
      const canFullscreen = document.fullscreenEnabled || document.webkitFullscreenEnabled;

      if (canFullscreen) {
        // Fullscreen API nativa (Chrome, Firefox, Safari macOS)
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const requestFs = img.requestFullscreen || img.webkitRequestFullscreen;
          if (requestFs) {
            // webkitRequestFullscreen (Safari macOS antiguo) devuelve undefined,
            // no una promesa: un .catch directo lanzaría TypeError y anularía
            // el fallback que pretende capturar.
            const result = requestFs.call(img);
            if (result && typeof result.catch === 'function') {
              result.catch(() => {
                // Si falla la API nativa, usar fallback
                openFallback(img.currentSrc || img.src, img.alt);
              });
            }
          }
        } else {
          const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
          if (exitFs) exitFs.call(document);
        }
      } else {
        // Fallback para iPhone Safari (sin Fullscreen API)
        openFallback(img.currentSrc || img.src, img.alt);
      }
    }
  });

  // Prevenir arrastrar la imagen en modo fullscreen
  document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'IMG' && event.target.closest('.notepad__page')) {
      event.preventDefault();
    }
  });
});
