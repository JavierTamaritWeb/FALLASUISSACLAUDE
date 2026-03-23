// js/cookie-banner.js
// Banner de consentimiento de cookies (RGPD / LSSI / ePrivacy)

document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay consentimiento, no mostrar el banner
  if (localStorage.getItem('cookieConsent')) return;

  // Crear el banner dinámicamente
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentimiento de cookies');

  banner.innerHTML = `
    <div class="cookie-banner__content">
      <p class="cookie-banner__text">
        Este sitio web utiliza almacenamiento local y servicios de terceros para mejorar tu experiencia.
        Consulta nuestra <a href="cookies.html">Política de Cookies</a> para más información.
      </p>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__btn cookie-banner__btn--accept" id="cookieAcceptAll" type="button">
          Aceptar todas
        </button>
        <button class="cookie-banner__btn cookie-banner__btn--necessary" id="cookieNecessary" type="button">
          Solo necesarias
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Mostrar con animación
  requestAnimationFrame(() => {
    banner.classList.add('cookie-banner--visible');
  });

  function closeBanner(consent) {
    localStorage.setItem('cookieConsent', consent);
    banner.classList.remove('cookie-banner--visible');
    banner.addEventListener('transitionend', () => {
      banner.remove();
    }, { once: true });
  }

  document.getElementById('cookieAcceptAll').addEventListener('click', () => {
    closeBanner('all');
  });

  document.getElementById('cookieNecessary').addEventListener('click', () => {
    closeBanner('necessary');
  });
});
