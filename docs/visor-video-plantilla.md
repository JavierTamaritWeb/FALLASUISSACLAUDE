# Visor de vídeo — plantilla reutilizable

> Desde la **v4.17.0** el visor "Vista Aérea" (vídeo del dron) ya **no se muestra** en `index.html` ni en `lafalla.html`. Su código se conserva íntegro como **modelo** para montar un visor de vídeo en cualquier página. Este documento es la plantilla: copia el markup, apunta al vídeo y carga el script.

## Qué queda en el repo (sin cambios)

| Pieza | Ruta | Estado |
| --- | --- | --- |
| Lógica del reproductor | `src/js/video-dron.js` | Intacta. Busca los ids `videoDron*`; si no existen hace `return` sin error. |
| Estilos (`.video-dron__*`) | `src/scss/components/_video-dron.scss` (+ modo oscuro en `_modo-oscuro.scss`) | Intactos y compilados. Desde v4.19.0 (retirada del visor de Ofrenda) ninguna página los usa; se conservan como parte de la plantilla. |
| Traducciones | `src/data/translations.json` → `falla.videoDron.{play,restart,fullscreen,mute,playAria,restartAria,fullscreenAria,muteAria,closeAria,videoAria,progressAria,volumeAria}` (ES/VA) | Intactas, reutilizables tal cual. |
| Vídeo | `src/img/dron/dron-001-2026.mp4` | Sigue en uso: botón de descarga del panel *Historia/Archivos/Monumentos 2025-26*. |
| Carga diferida en la home | `src/js/home-deferred.js` | La línea `loadOnVisible('#videoDron', …)` queda **comentada**; descoméntala si vuelves a poner el visor en `index.html`. |

El visor de **Ofrenda** (`src/js/ofrenda-video.js`, ids `videoOfrenda*`, claves `ofrenda.{play,pause,restart,fullscreen,mute,unmute,…}`) era una copia de este mismo patrón; se retiró de `ofrenda.html` e `index.html` en v4.19.0 (sustituido por la figura "Próxima Ofrenda") y su JS se conserva como segunda plantilla. El vídeo de la Ofrenda 2026 se reproduce ahora con `<video controls>` nativo en *Historia/Archivos/Ofrendas*.

## Cómo montar un visor nuevo

1. **Markup inline** (dentro de la página, donde deba verse el vídeo). Cambia `src`, `aria-label`/`data-i18n-aria-label` y, si quieres ids propios, sustituye `videoDron` por otro prefijo en TODOS los ids (inline + overlay) y en el JS.
2. **Overlay de pantalla completa** justo antes de los `<script>` (fuera de `<main>`). El script sincroniza play/pausa, progreso, volumen y mute entre el vídeo inline y el del overlay.
3. **Script**: `<script src="js/video-dron.js"></script>` (tag estático, como hacía `lafalla.html`) o, en la home, descomentar `loadOnVisible('#videoDron', …)` en `home-deferred.js` (carga cuando la sección se acerca al viewport).
4. **Rutas**: usa rutas relativas sin `/` inicial (`img/...`); el build las reescribe a `../img/...` en la variante `/va/`.
5. `npm run build` y, como toca CSS/JS visible, `npm run test:e2e:full` (los snapshots visuales de la página cambiarán → regenerar).

### 1. Sección inline (copiada de `index.html` v4.16.1)

```html
<!-- Sección Vídeo (visor) -->
<section class="video-dron reveal reveal--soft" aria-label="Vista Aérea">
  <div class="video-dron__frame">
    <div class="video-dron__video-wrapper">
      <video id="videoDron" class="video-dron__video" width="1920" height="1080"
        src="img/dron/dron-001-2026.mp4" preload="metadata" playsinline
        aria-label="Vídeo aéreo de la Falla Suïssa grabado con dron"
        data-i18n-aria-label="falla.videoDron.videoAria">
      </video>
      <button class="video-dron__poster-overlay" id="videoDronPosterPlay"
        aria-label="Reproducir vídeo"
        data-i18n-aria-label="falla.videoDron.playAria">
        <svg class="video-dron__play-icon" viewBox="0 0 70 70" aria-hidden="true">
          <circle cx="35" cy="35" r="34" fill="rgba(4,18,35,0.76)" stroke="rgba(255,255,255,0.22)"/>
          <polygon points="28,20 28,50 52,35" fill="#fff"/>
        </svg>
      </button>
    </div>
    <!-- Barra de progreso -->
    <div class="video-dron__progress-container">
      <input type="range" class="video-dron__progress" id="videoDronProgress"
        min="0" max="100" value="0" step="0.1"
        aria-label="Progreso del vídeo"
        data-i18n-aria-label="falla.videoDron.progressAria">
    </div>
    <div class="video-dron__controls" role="group" aria-label="Controles de vídeo">
      <button class="video-dron__btn" id="videoDronPlay"
        aria-label="Reproducir vídeo" data-i18n-aria-label="falla.videoDron.playAria">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>
        <span data-i18n="falla.videoDron.play">Reproducir</span>
      </button>
      <button class="video-dron__btn" id="videoDronRestart"
        aria-label="Reiniciar vídeo desde el principio" data-i18n-aria-label="falla.videoDron.restartAria">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V0L3 4l5 4V5a3 3 0 0 1 0 6"/></svg>
        <span data-i18n="falla.videoDron.restart">Reiniciar</span>
      </button>
      <button class="video-dron__btn" id="videoDronFullscreenBtn"
        aria-label="Ver vídeo en pantalla completa" data-i18n-aria-label="falla.videoDron.fullscreenAria">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1 1h5V0H0v6h1V1zm14 0h-5V0h6v6h-1V1zM1 15h5v1H0v-6h1v5zm14 0h-5v1h6v-6h-1v5z"/></svg>
        <span data-i18n="falla.videoDron.fullscreen">Ampliar</span>
      </button>
      <button class="video-dron__btn" id="videoDronMute"
        aria-label="Silenciar vídeo" data-i18n-aria-label="falla.videoDron.muteAria">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L4 5H1v6h3l4 4V1z"/><path d="M11 5.5c.7.7.7 2.3 0 3M12.8 3.5c1.4 1.4 1.4 4.6 0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span data-i18n="falla.videoDron.mute">Silenciar</span>
      </button>
      <div class="video-dron__volume-wrapper">
        <input type="range" class="video-dron__volume" id="videoDronVolume"
          min="0" max="100" value="100" step="1"
          aria-label="Volumen del vídeo"
          data-i18n-aria-label="falla.videoDron.volumeAria">
      </div>
    </div>
  </div>
</section>
```

### 2. Overlay de pantalla completa (copiado de `index.html` v4.16.1)

```html
<!-- Overlay Fullscreen Vídeo -->
<div class="video-dron__fullscreen" id="videoDronFullscreen"
  role="dialog" aria-modal="true" aria-hidden="true"
  aria-label="Vídeo en pantalla completa"
  data-i18n-aria-label="falla.videoDron.fullscreenAria">
  <button class="video-dron__fullscreen-close" id="videoDronFsClose"
    aria-label="Cerrar pantalla completa" data-i18n-aria-label="falla.videoDron.closeAria">&times;</button>
  <div class="video-dron__fullscreen-wrapper">
    <video id="videoDronFs" class="video-dron__fullscreen-video"
      src="img/dron/dron-001-2026.mp4" preload="none" playsinline
      aria-label="Vídeo aéreo de la Falla Suïssa grabado con dron"
      data-i18n-aria-label="falla.videoDron.videoAria">
    </video>
  </div>
  <!-- Barra de progreso fullscreen -->
  <div class="video-dron__progress-container video-dron__progress-container--fs">
    <input type="range" class="video-dron__progress" id="videoDronFsProgress"
      min="0" max="100" value="0" step="0.1"
      aria-label="Progreso del vídeo"
      data-i18n-aria-label="falla.videoDron.progressAria">
  </div>
  <div class="video-dron__fullscreen-controls" role="group" aria-label="Controles de vídeo">
    <button class="video-dron__btn" id="videoDronFsPlay"
      aria-label="Reproducir vídeo" data-i18n-aria-label="falla.videoDron.playAria">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>
      <span data-i18n="falla.videoDron.play">Reproducir</span>
    </button>
    <button class="video-dron__btn" id="videoDronFsRestart"
      aria-label="Reiniciar vídeo desde el principio" data-i18n-aria-label="falla.videoDron.restartAria">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V0L3 4l5 4V5a3 3 0 0 1 0 6"/></svg>
      <span data-i18n="falla.videoDron.restart">Reiniciar</span>
    </button>
    <button class="video-dron__btn" id="videoDronFsMute"
      aria-label="Silenciar vídeo" data-i18n-aria-label="falla.videoDron.muteAria">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1L4 5H1v6h3l4 4V1z"/><path d="M11 5.5c.7.7.7 2.3 0 3M12.8 3.5c1.4 1.4 1.4 4.6 0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span data-i18n="falla.videoDron.mute">Silenciar</span>
    </button>
    <div class="video-dron__volume-wrapper">
      <input type="range" class="video-dron__volume" id="videoDronFsVolume"
        min="0" max="100" value="100" step="1"
        aria-label="Volumen del vídeo"
        data-i18n-aria-label="falla.videoDron.volumeAria">
    </div>
  </div>
```

## Notas de comportamiento (`video-dron.js`)

- `initVideoDron()` sale sin hacer nada si faltan `#videoDron` o `#videoDronFullscreen`.
- `safePlay()` controla la promesa de `play()` (autoplay bloqueado no rompe nada).
- El overlay se abre con `aria-hidden="false"` + foco en el botón de cerrar, cierra con Escape o el botón y devuelve el foco al elemento que lo abrió.
- Los textos de los botones (`Reproducir`/`Pausar`, `Silenciar`/`Sonido`) se leen de `falla.videoDron.*` vía `window.translations`; el HTML lleva el texto ES como fallback.
- Todos los accesos a `localStorage` van en `try/catch` (Safari con storage bloqueado).

## Por qué se retiró de la home (v4.17.0)

Decisión de contenido: el vídeo del dron era del ejercicio 2025-26 y ya se ofrece como descarga en el panel *Monumentos 2025-26* de Archivos. Retirarlo del flujo principal deja "El Monumento" (bocetos 2026-27) seguido directamente de "Nosotros".

---

_Última actualización: v4.23.6 (10 de septiembre de 2026)._
