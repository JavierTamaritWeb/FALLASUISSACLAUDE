// js/cookie-banner.js
// Banner de consentimiento de cookies (RGPD / LSSI / ePrivacy)

function initCookieBanner() {
  // Si ya hay consentimiento o localStorage está bloqueado (SecurityError Safari), lo gestionamos
  try {
    if (localStorage.getItem('cookieConsent')) return;
  } catch (e) {
    console.warn('El acceso a localStorage está bloqueado por el navegador.');
  }

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

  // Forzar reflow para Safari macOS (evita que se salte la transición CSS)
  void banner.offsetWidth;

  // Mostrar con clase
  banner.classList.add('cookie-banner--visible');

  function closeBanner(consent) {
    try {
      localStorage.setItem('cookieConsent', consent);
    } catch (e) {
      console.warn('No se pudo guardar el consentimiento debido a las restricciones del navegador.');
    }
    
    banner.classList.remove('cookie-banner--visible');
    
    // Fallback por si transitionend falla en Safari
    const removeTimeout = setTimeout(() => {
      if (document.getElementById('cookie-banner')) banner.remove();
    }, 500);

    banner.addEventListener('transitionend', () => {
      clearTimeout(removeTimeout);
      banner.remove();
    }, { once: true });
  }

  document.getElementById('cookieAcceptAll').addEventListener('click', () => {
    closeBanner('all');
  });

  document.getElementById('cookieNecessary').addEventListener('click', () => {
    closeBanner('necessary');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieBanner, { once: true });
} else {
  initCookieBanner();
}
