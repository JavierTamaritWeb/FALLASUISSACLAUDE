// Banner de subvención - tarjeta flotante mostrada una sola vez por sesión del navegador
// Se ejecuta directamente (sin DOMContentLoaded) porque el script se carga al final del body
(function() {
  const banner = document.getElementById('banner-subvencion');
  const sessionCookie = 'bannerSubvencionSesion';
  if (!banner) return;

  // Ocultar si Playwright pre-setea la clave (solo en tests E2E)
  if (localStorage.getItem('bannerSubvencionCerrado') === 'true') {
    banner.remove();
    return;
  }

  if (leerCookie(sessionCookie) === '1') {
    banner.remove();
    return;
  }

  escribirCookieSesion(sessionCookie, '1');

  // Mostrar el banner
  banner.removeAttribute('inert');
  banner.classList.remove('oculto');
  banner.setAttribute('aria-hidden', 'false');

  // Botón cerrar
  const btnCerrar = banner.querySelector('.banner-subvencion__cerrar');
  btnCerrar?.addEventListener('click', cerrarBanner);

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !banner.classList.contains('oculto')) {
      cerrarBanner();
    }
  });

  function cerrarBanner() {
    const elementoActivo = document.activeElement;

    if (elementoActivo instanceof HTMLElement && banner.contains(elementoActivo)) {
      elementoActivo.blur();
    }

    banner.classList.add('oculto');
    banner.setAttribute('inert', '');
    banner.setAttribute('aria-hidden', 'true');
    setTimeout(() => banner.remove(), 300);
  }

  function leerCookie(clave) {
    const prefijo = `${encodeURIComponent(clave)}=`;
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const cookie = cookies.find((entrada) => entrada.startsWith(prefijo));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(prefijo.length));
  }

  function escribirCookieSesion(clave, valor) {
    document.cookie = `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}; path=/; SameSite=Lax`;
  }
})();
