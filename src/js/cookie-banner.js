// js/cookie-banner.js
// Banner de consentimiento de cookies (RGPD / LSSI / ePrivacy)

function initCookieBanner() {
  // Si ya hay consentimiento o localStorage está bloqueado (SecurityError Safari), lo gestionamos
  try {
    // Permite forzar el borrado de las cookies para hacer pruebas añadiendo ?resetCookies al final de la URL
    if (window.location.search.includes('resetCookies')) {
      localStorage.removeItem('cookieConsent');
      console.log('[Cookie Banner] Preferencia de cookies borrada vía parámetro URL.');
    }

    const consent = localStorage.getItem('cookieConsent');
    console.log('[Cookie Banner] Estado de consentimiento:', consent);
    if (consent) {
      return;
    }
  } catch (e) {
    console.warn('El acceso a localStorage está bloqueado por el navegador.');
  }

  // Textos bilingües (v4.29.0): antes el banner iba siempre en castellano, también
  // en /va/. Se toman de translations.json (cookieBanner.*) con el valor ES como
  // reserva y se re-aplican en translationsReady/langChanged.
  const FALLBACK = {
    aria: 'Consentimiento de cookies',
    texto: 'Este sitio web utiliza almacenamiento local y servicios de terceros para mejorar tu experiencia. Consulta nuestra',
    enlace: 'Política de Cookies',
    textoFin: 'para más información.',
    aceptar: 'Aceptar todas',
    necesarias: 'Solo necesarias'
  };

  function idioma() {
    if (window.currentLanguage === 'va' || window.currentLanguage === 'es') return window.currentLanguage;
    return document.documentElement.lang === 'ca' ? 'va' : 'es';
  }

  function t(clave) {
    const tabla = window.translations && window.translations[idioma()];
    const v = tabla && tabla.cookieBanner && tabla.cookieBanner[clave];
    return typeof v === 'string' ? v : FALLBACK[clave];
  }

  // Crear el banner dinámicamente
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', FALLBACK.aria);

  banner.innerHTML = `
    <div class="cookie-banner__content">
      <p class="cookie-banner__text">
        <span data-i18n="cookieBanner.texto">${FALLBACK.texto}</span>
        <a href="cookies.html" data-i18n="cookieBanner.enlace">${FALLBACK.enlace}</a>
        <span data-i18n="cookieBanner.textoFin">${FALLBACK.textoFin}</span>
      </p>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__btn cookie-banner__btn--accept" id="cookieAcceptAll" type="button" data-i18n="cookieBanner.aceptar">
          ${FALLBACK.aceptar}
        </button>
        <button class="cookie-banner__btn cookie-banner__btn--necessary" id="cookieNecessary" type="button" data-i18n="cookieBanner.necesarias">
          ${FALLBACK.necesarias}
        </button>
      </div>
    </div>
  `;

  function traducirBanner() {
    banner.setAttribute('aria-label', t('aria'));
    banner.querySelectorAll('[data-i18n]').forEach((el) => {
      const clave = el.getAttribute('data-i18n').replace('cookieBanner.', '');
      el.textContent = t(clave);
    });
  }
  traducirBanner();
  document.addEventListener('translationsReady', traducirBanner);
  document.addEventListener('langChanged', traducirBanner);

  // Asegurarnos de que el body está disponible (salvataje para Safari en algunas condiciones de defer)
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => initCookieBanner(), { once: true });
    return;
  }

  document.body.appendChild(banner);

  // Fallback definitivo para Safari: setTimeout obliga al navegador a recalcular el layout
  // Evita que la inserción en DOM y la clase CSS se procesen en el mismo frame
  setTimeout(() => {
    banner.classList.add('cookie-banner--visible');
  }, 50);

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
