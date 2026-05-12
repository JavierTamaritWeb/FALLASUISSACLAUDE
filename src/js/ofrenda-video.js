// js/ofrenda-video.js
// Reproductor de vídeo de la Ofrenda Floral con controles personalizados y lightbox fullscreen

function initOfrendaVideo() {
  // Elementos inline
  const video = document.getElementById('videoOfrenda');
  const posterOverlay = document.getElementById('videoOfrendaPosterPlay');
  const btnPlay = document.getElementById('videoOfrendaPlay');
  const btnRestart = document.getElementById('videoOfrendaRestart');
  const btnFullscreen = document.getElementById('videoOfrendaFullscreenBtn');
  const btnMute = document.getElementById('videoOfrendaMute');
  const volumeSlider = document.getElementById('videoOfrendaVolume');
  const progressBar = document.getElementById('videoOfrendaProgress');
  const inlineStatus = document.getElementById('videoOfrendaStatus');

  // Elementos fullscreen
  const fullscreen = document.getElementById('videoOfrendaFullscreen');
  const fsVideo = document.getElementById('videoOfrendaFs');
  const fsClose = document.getElementById('videoOfrendaFsClose');
  const fsBtnPlay = document.getElementById('videoOfrendaFsPlay');
  const fsBtnRestart = document.getElementById('videoOfrendaFsRestart');
  const fsBtnMute = document.getElementById('videoOfrendaFsMute');
  const fsVolumeSlider = document.getElementById('videoOfrendaFsVolume');
  const fsProgressBar = document.getElementById('videoOfrendaFsProgress');
  const fullscreenStatus = document.getElementById('videoOfrendaFsStatus');

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

  function getStatusMessage() {
    return getTranslation('ofrenda.loadError') || 'No se ha podido cargar el vídeo. Vuelve a intentarlo.';
  }

  function showStatus(statusEl) {
    if (!statusEl) return;
    statusEl.textContent = getStatusMessage();
    statusEl.hidden = false;
  }

  function hideStatus(statusEl) {
    if (!statusEl) return;
    statusEl.hidden = true;
  }

  function prepareVideo(videoEl) {
    if (!videoEl) return;

    if (
      videoEl.error
      || videoEl.networkState === HTMLMediaElement.NETWORK_EMPTY
      || videoEl.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
    ) {
      videoEl.load();
    }
  }

  function syncVideoTime(videoEl, time) {
    if (!videoEl || !Number.isFinite(time) || time <= 0) return;

    const applyTime = () => {
      try {
        videoEl.currentTime = time;
      } catch (error) {
        console.warn('No se pudo sincronizar el tiempo del vídeo de la Ofrenda.', error);
      }
    };

    if (videoEl.readyState >= 1) {
      applyTime();
      return;
    }

    videoEl.addEventListener('loadedmetadata', applyTime, { once: true });
  }

  async function playVideo(videoEl, statusEl, buttonEl) {
    hideStatus(statusEl);
    prepareVideo(videoEl);

    try {
      await videoEl.play();
      return true;
    } catch (error) {
      console.error('No se pudo reproducir el vídeo de la Ofrenda.', error);
      showStatus(statusEl);
      if (buttonEl) {
        updatePlayButton(buttonEl, false);
      }
      return false;
    }
  }

  function primeInlineVideo() {
    hideStatus(inlineStatus);
    prepareVideo(video);
  }

  function primeFullscreenVideo() {
    hideStatus(fullscreenStatus);
    prepareVideo(fsVideo);
  }

  function updatePlayButton(btn, isPlaying) {
    const svg = btn.querySelector('svg');
    const span = btn.querySelector('span');
    if (isPlaying) {
      if (svg) svg.outerHTML = iconPause;
      if (span) span.textContent = getTranslation('ofrenda.pause') || 'Pausar';
      btn.setAttribute('aria-label', getTranslation('ofrenda.pauseAria') || 'Pausar vídeo');
    } else {
      if (svg) svg.outerHTML = iconPlay;
      if (span) span.textContent = getTranslation('ofrenda.play') || 'Reproducir';
      btn.setAttribute('aria-label', getTranslation('ofrenda.playAria') || 'Reproducir vídeo');
    }
  }

  function updateMuteButton(btn, isMuted) {
    const svg = btn.querySelector('svg');
    const span = btn.querySelector('span');
    if (isMuted) {
      if (svg) svg.outerHTML = iconMuted;
      if (span) span.textContent = getTranslation('ofrenda.unmute') || 'Activar sonido';
      btn.setAttribute('aria-label', getTranslation('ofrenda.unmuteAria') || 'Activar sonido del vídeo');
    } else {
      if (svg) svg.outerHTML = iconVolume;
      if (span) span.textContent = getTranslation('ofrenda.mute') || 'Silenciar';
      btn.setAttribute('aria-label', getTranslation('ofrenda.muteAria') || 'Silenciar vídeo');
    }
  }

  function updateProgress(videoEl, progressEl) {
    if (videoEl.duration && isFinite(videoEl.duration)) {
      const pct = (videoEl.currentTime / videoEl.duration) * 100;
      progressEl.value = pct;
      progressEl.style.setProperty('--progress', pct + '%');
    }
  }

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

  function changeVolume(videoEl, btn, value) {
    videoEl.volume = value / 100;
    videoEl.muted = value === 0;
    updateMuteButton(btn, videoEl.muted);
  }

  function seekVideo(videoEl, value) {
    if (videoEl.duration && isFinite(videoEl.duration)) {
      videoEl.currentTime = (value / 100) * videoEl.duration;
    }
  }

  // =========================================================================
  // Reproducción inline
  // =========================================================================

  async function playInline() {
    const started = await playVideo(video, inlineStatus, btnPlay);
    if (!started) {
      posterOverlay.classList.remove('video-dron__poster-overlay--hidden');
      return;
    }

    posterOverlay.classList.add('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, true);
  }

  function pauseInline() {
    video.pause();
    posterOverlay.classList.remove('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, false);
  }

  async function toggleInline() {
    if (video.paused || video.ended) {
      await playInline();
    } else {
      pauseInline();
    }
  }

  async function restartInline() {
    video.currentTime = 0;
    await playInline();
  }

  posterOverlay.addEventListener('pointerenter', primeInlineVideo, { once: true });
  posterOverlay.addEventListener('focus', primeInlineVideo, { once: true });
  btnPlay.addEventListener('pointerenter', primeInlineVideo, { once: true });
  btnPlay.addEventListener('focus', primeInlineVideo, { once: true });
  btnFullscreen.addEventListener('pointerenter', primeFullscreenVideo, { once: true });
  btnFullscreen.addEventListener('focus', primeFullscreenVideo, { once: true });

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
    hideStatus(inlineStatus);
    posterOverlay.classList.add('video-dron__poster-overlay--hidden');
    updatePlayButton(btnPlay, true);
  });

  video.addEventListener('loadeddata', () => {
    hideStatus(inlineStatus);
  });

  video.addEventListener('canplay', () => {
    hideStatus(inlineStatus);
  });

  video.addEventListener('pause', () => {
    if (!video.ended) {
      updatePlayButton(btnPlay, false);
    }
  });

  video.addEventListener('stalled', () => {
    showStatus(inlineStatus);
  });

  video.addEventListener('error', () => {
    posterOverlay.classList.remove('video-dron__poster-overlay--hidden');
    showStatus(inlineStatus);
    updatePlayButton(btnPlay, false);
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

  async function openFullscreen() {
    lastFocused = document.activeElement;

    const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;

    hideStatus(fullscreenStatus);
    primeFullscreenVideo();
    syncVideoTime(fsVideo, currentTime);

    fsVideo.volume = video.volume;
    fsVideo.muted = video.muted;
    fsVolumeSlider.value = video.muted ? 0 : video.volume * 100;
    fsVolumeSlider.style.setProperty('--volume', (fsVideo.muted ? 0 : fsVideo.volume * 100) + '%');
    updateMuteButton(fsBtnMute, fsVideo.muted);

    video.pause();

    fullscreen.classList.add('open');
    fullscreen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    const started = await playVideo(fsVideo, fullscreenStatus, fsBtnPlay);
    updatePlayButton(fsBtnPlay, started);

    requestAnimationFrame(() => {
      fsClose.focus();
    });
  }

  function closeFullscreen() {
    // Sincronizar tiempo de vuelta
    primeInlineVideo();
    syncVideoTime(video, fsVideo.currentTime);
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

  async function toggleFullscreen() {
    if (fsVideo.paused || fsVideo.ended) {
      const started = await playVideo(fsVideo, fullscreenStatus, fsBtnPlay);
      updatePlayButton(fsBtnPlay, started);
    } else {
      fsVideo.pause();
      updatePlayButton(fsBtnPlay, false);
    }
  }

  async function restartFullscreen() {
    fsVideo.currentTime = 0;
    const started = await playVideo(fsVideo, fullscreenStatus, fsBtnPlay);
    updatePlayButton(fsBtnPlay, started);
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
    hideStatus(fullscreenStatus);
    updatePlayButton(fsBtnPlay, true);
  });

  fsVideo.addEventListener('loadeddata', () => {
    hideStatus(fullscreenStatus);
  });

  fsVideo.addEventListener('canplay', () => {
    hideStatus(fullscreenStatus);
  });

  fsVideo.addEventListener('pause', () => {
    if (!fsVideo.ended) {
      updatePlayButton(fsBtnPlay, false);
    }
  });

  fsVideo.addEventListener('stalled', () => {
    showStatus(fullscreenStatus);
  });

  fsVideo.addEventListener('error', () => {
    showStatus(fullscreenStatus);
    updatePlayButton(fsBtnPlay, false);
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOfrendaVideo, { once: true });
} else {
  initOfrendaVideo();
}
