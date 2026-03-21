// js/video-dron.js
// Reproductor de vídeo de dron con controles personalizados y lightbox fullscreen

document.addEventListener('DOMContentLoaded', () => {
  // Elementos inline
  const video = document.getElementById('videoDron');
  const posterOverlay = document.getElementById('videoDronPosterPlay');
  const btnPlay = document.getElementById('videoDronPlay');
  const btnRestart = document.getElementById('videoDronRestart');
  const btnFullscreen = document.getElementById('videoDronFullscreenBtn');
  const btnMute = document.getElementById('videoDronMute');
  const volumeSlider = document.getElementById('videoDronVolume');
  const progressBar = document.getElementById('videoDronProgress');

  // Elementos fullscreen
  const fullscreen = document.getElementById('videoDronFullscreen');
  const fsVideo = document.getElementById('videoDronFs');
  const fsClose = document.getElementById('videoDronFsClose');
  const fsBtnPlay = document.getElementById('videoDronFsPlay');
  const fsBtnRestart = document.getElementById('videoDronFsRestart');
  const fsBtnMute = document.getElementById('videoDronFsMute');
  const fsVolumeSlider = document.getElementById('videoDronFsVolume');
  const fsProgressBar = document.getElementById('videoDronFsProgress');

  if (!video || !fullscreen) return;

  let lastFocused = null;

  // =========================================================================
  // Iconos SVG para alternar play/pausa
  // =========================================================================
  const iconPlay = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>';
  const iconPause = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/></svg>';

  // Iconos SVG para alternar silencio/sonido
  const iconVolume = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L4 5H1v6h3l4 4V1z"/><path d="M11 5.5c.7.7.7 2.3 0 3M12.8 3.5c1.4 1.4 1.4 4.6 0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const iconMuted = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1L4 5H1v6h3l4 4V1z" fill="currentColor"/><line x1="11" y1="5" x2="15" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="15" y1="5" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

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

  function updateMuteButton(btn, isMuted) {
    const svg = btn.querySelector('svg');
    const span = btn.querySelector('span');
    if (isMuted) {
      if (svg) svg.outerHTML = iconMuted;
      if (span) span.textContent = getTranslation('falla.videoDron.unmute') || 'Activar sonido';
      btn.setAttribute('aria-label', getTranslation('falla.videoDron.unmuteAria') || 'Activar sonido del vídeo');
    } else {
      if (svg) svg.outerHTML = iconVolume;
      if (span) span.textContent = getTranslation('falla.videoDron.mute') || 'Silenciar';
      btn.setAttribute('aria-label', getTranslation('falla.videoDron.muteAria') || 'Silenciar vídeo');
    }
  }

  // Actualiza la barra de progreso con el tiempo actual del vídeo
  function updateProgress(videoEl, progressEl) {
    if (videoEl.duration && isFinite(videoEl.duration)) {
      const pct = (videoEl.currentTime / videoEl.duration) * 100;
      progressEl.value = pct;
      progressEl.style.setProperty('--progress', pct + '%');
    }
  }

  // Alternar silencio/sonido sincronizando slider
  function toggleMute(videoEl, btn, slider) {
    videoEl.muted = !videoEl.muted;
    updateMuteButton(btn, videoEl.muted);
    if (videoEl.muted) {
      slider.value = 0;
      slider.style.setProperty('--volume', '0%');
    } else {
      slider.value = videoEl.volume * 100;
      slider.style.setProperty('--volume', (videoEl.volume * 100) + '%');
    }
  }

  // Cambiar volumen desde el slider
  function changeVolume(videoEl, btn, value) {
    videoEl.volume = value / 100;
    videoEl.muted = value === 0;
    updateMuteButton(btn, videoEl.muted);
  }

  // Buscar en el vídeo al hacer clic/arrastrar la barra de progreso
  function seekVideo(videoEl, value) {
    if (videoEl.duration && isFinite(videoEl.duration)) {
      videoEl.currentTime = (value / 100) * videoEl.duration;
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

  // Barra de progreso inline
  video.addEventListener('timeupdate', () => {
    updateProgress(video, progressBar);
  });

  progressBar.addEventListener('input', () => {
    seekVideo(video, progressBar.value);
    progressBar.style.setProperty('--progress', progressBar.value + '%');
  });

  // Botón silenciar inline
  btnMute.addEventListener('click', () => {
    toggleMute(video, btnMute, volumeSlider);
  });

  // Slider de volumen inline
  volumeSlider.addEventListener('input', () => {
    const val = Number(volumeSlider.value);
    changeVolume(video, btnMute, val);
    volumeSlider.style.setProperty('--volume', val + '%');
  });

  // Inicializar sliders
  volumeSlider.style.setProperty('--volume', '100%');
  progressBar.style.setProperty('--progress', '0%');

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

    // Sincronizar volumen y estado de silencio
    fsVideo.volume = video.volume;
    fsVideo.muted = video.muted;
    fsVolumeSlider.value = video.muted ? 0 : video.volume * 100;
    fsVolumeSlider.style.setProperty('--volume', (fsVideo.muted ? 0 : fsVideo.volume * 100) + '%');
    updateMuteButton(fsBtnMute, fsVideo.muted);

    requestAnimationFrame(() => {
      fsClose.focus();
    });
  }

  function closeFullscreen() {
    // Sincronizar tiempo de vuelta
    video.currentTime = fsVideo.currentTime;
    fsVideo.pause();

    // Sincronizar volumen de vuelta
    video.volume = fsVideo.volume;
    video.muted = fsVideo.muted;
    volumeSlider.value = fsVideo.muted ? 0 : fsVideo.volume * 100;
    volumeSlider.style.setProperty('--volume', (video.muted ? 0 : video.volume * 100) + '%');
    updateMuteButton(btnMute, video.muted);

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

  // Barra de progreso fullscreen
  fsVideo.addEventListener('timeupdate', () => {
    updateProgress(fsVideo, fsProgressBar);
  });

  fsProgressBar.addEventListener('input', () => {
    seekVideo(fsVideo, fsProgressBar.value);
    fsProgressBar.style.setProperty('--progress', fsProgressBar.value + '%');
  });

  // Botón silenciar fullscreen
  fsBtnMute.addEventListener('click', () => {
    toggleMute(fsVideo, fsBtnMute, fsVolumeSlider);
  });

  // Slider de volumen fullscreen
  fsVolumeSlider.addEventListener('input', () => {
    const val = Number(fsVolumeSlider.value);
    changeVolume(fsVideo, fsBtnMute, val);
    fsVolumeSlider.style.setProperty('--volume', val + '%');
  });

  // Inicializar sliders fullscreen
  fsVolumeSlider.style.setProperty('--volume', '100%');
  fsProgressBar.style.setProperty('--progress', '0%');

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
