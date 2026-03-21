// js/video-dron.js
// Reproductor de vídeo de dron con controles personalizados y lightbox fullscreen

document.addEventListener('DOMContentLoaded', () => {
  // Elementos inline
  const video = document.getElementById('videoDron');
  const posterOverlay = document.getElementById('videoDronPosterPlay');
  const btnPlay = document.getElementById('videoDronPlay');
  const btnRestart = document.getElementById('videoDronRestart');
  const btnFullscreen = document.getElementById('videoDronFullscreenBtn');

  // Elementos fullscreen
  const fullscreen = document.getElementById('videoDronFullscreen');
  const fsVideo = document.getElementById('videoDronFs');
  const fsClose = document.getElementById('videoDronFsClose');
  const fsBtnPlay = document.getElementById('videoDronFsPlay');
  const fsBtnRestart = document.getElementById('videoDronFsRestart');

  if (!video || !fullscreen) return;

  let lastFocused = null;

  // =========================================================================
  // Iconos SVG para alternar play/pausa
  // =========================================================================
  const iconPlay = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>';
  const iconPause = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/></svg>';

  // =========================================================================
  // Utilidades
  // =========================================================================

  function getTranslation(key) {
    if (window.translations) {
      const lang = localStorage.getItem('lang') || 'es';
      const keys = key.split('.');
      let val = window.translations[lang];
      for (const k of keys) {
        if (!val) return null;
        val = val[k];
      }
      return val || null;
    }
    return null;
  }

  function updatePlayButton(btn, isPlaying) {
    const svg = btn.querySelector('svg');
    const span = btn.querySelector('span');
    if (isPlaying) {
      if (svg) svg.outerHTML = iconPause;
      if (span) span.textContent = getTranslation('falla.videoDron.pause') || 'Pausar';
      btn.setAttribute('aria-label', getTranslation('falla.videoDron.pauseAria') || 'Pausar vídeo');
    } else {
      if (svg) svg.outerHTML = iconPlay;
      if (span) span.textContent = getTranslation('falla.videoDron.play') || 'Reproducir';
      btn.setAttribute('aria-label', getTranslation('falla.videoDron.playAria') || 'Reproducir vídeo');
    }
  }

  // =========================================================================
  // Reproducción inline
  // =========================================================================

  function playInline() {
    video.play();
    posterOverlay.classList.add('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, true);
  }

  function pauseInline() {
    video.pause();
    posterOverlay.classList.remove('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, false);
  }

  function toggleInline() {
    if (video.paused || video.ended) {
      playInline();
    } else {
      pauseInline();
    }
  }

  function restartInline() {
    video.currentTime = 0;
    playInline();
  }

  // Poster overlay click
  posterOverlay.addEventListener('click', playInline);

  // Botón play/pausa
  btnPlay.addEventListener('click', toggleInline);

  // Botón reiniciar
  btnRestart.addEventListener('click', restartInline);

  // Eventos del vídeo inline
  video.addEventListener('ended', () => {
    posterOverlay.classList.remove('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, false);
  });

  video.addEventListener('play', () => {
    posterOverlay.classList.add('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, true);
  });

  video.addEventListener('pause', () => {
    if (!video.ended) {
      updatePlayButton(btnPlay, false);
    }
  });

  // =========================================================================
  // Fullscreen lightbox
  // =========================================================================

  function openFullscreen() {
    lastFocused = document.activeElement;

    // Sincronizar tiempo
    fsVideo.currentTime = video.currentTime;
    video.pause();

    fullscreen.classList.add('open');
    fullscreen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    fsVideo.play();
    updatePlayButton(fsBtnPlay, true);

    requestAnimationFrame(() => {
      fsClose.focus();
    });
  }

  function closeFullscreen() {
    // Sincronizar tiempo de vuelta
    video.currentTime = fsVideo.currentTime;
    fsVideo.pause();

    fullscreen.classList.remove('open');
    fullscreen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');

    updatePlayButton(fsBtnPlay, false);

    if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function toggleFullscreen() {
    if (fsVideo.paused || fsVideo.ended) {
      fsVideo.play();
      updatePlayButton(fsBtnPlay, true);
    } else {
      fsVideo.pause();
      updatePlayButton(fsBtnPlay, false);
    }
  }

  function restartFullscreen() {
    fsVideo.currentTime = 0;
    fsVideo.play();
    updatePlayButton(fsBtnPlay, true);
  }

  // Botón abrir fullscreen
  btnFullscreen.addEventListener('click', openFullscreen);

  // Botón cerrar fullscreen
  fsClose.addEventListener('click', closeFullscreen);

  // Botones fullscreen
  fsBtnPlay.addEventListener('click', toggleFullscreen);
  fsBtnRestart.addEventListener('click', restartFullscreen);

  // Eventos del vídeo fullscreen
  fsVideo.addEventListener('ended', () => {
    updatePlayButton(fsBtnPlay, false);
  });

  fsVideo.addEventListener('play', () => {
    updatePlayButton(fsBtnPlay, true);
  });

  fsVideo.addEventListener('pause', () => {
    if (!fsVideo.ended) {
      updatePlayButton(fsBtnPlay, false);
    }
  });

  // Escape para cerrar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreen.classList.contains('open')) {
      e.preventDefault();
      closeFullscreen();
    }
  });

  // Click en backdrop para cerrar
  fullscreen.addEventListener('click', (e) => {
    if (e.target === fullscreen) {
      closeFullscreen();
    }
  });
});
