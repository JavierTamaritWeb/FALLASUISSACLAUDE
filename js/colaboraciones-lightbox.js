// js/colaboraciones-lightbox.js
// Lightbox accesible para las imágenes de HOPE

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('colaboracionesLightbox');
  const closeButton = lightbox?.querySelector('.colaboraciones-lightbox__close');
  const lightboxImage = lightbox?.querySelector('.colaboraciones-lightbox__image');
  const lightboxCaption = lightbox?.querySelector('.colaboraciones-lightbox__caption');

  if (!lightbox || !closeButton || !lightboxImage || !lightboxCaption) {
    return;
  }

  let lastTrigger = null;

  function openLightbox(trigger) {
    const targetImage = trigger.querySelector('img');

    if (!targetImage) {
      return;
    }

    lastTrigger = trigger;
    lightboxImage.src = targetImage.currentSrc || targetImage.src;
    lightboxImage.alt = targetImage.alt || '';
    lightboxCaption.textContent = targetImage.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    requestAnimationFrame(() => {
      closeButton.focus();
    });
  }

  function closeLightbox() {
    const shouldRestoreFocus = document.body.classList.contains('lightbox-open') || lightbox.classList.contains('open');

    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
    lightboxImage.alt = '';
    lightboxCaption.textContent = '';

    if (shouldRestoreFocus && lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.colaboraciones-mosaic__trigger');

    if (trigger) {
      event.preventDefault();
      openLightbox(trigger);
      return;
    }

    if (event.target.closest('.colaboraciones-lightbox__close')) {
      event.preventDefault();
      closeLightbox();
      return;
    }

    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
      event.preventDefault();
      closeLightbox();
    }
  });
});