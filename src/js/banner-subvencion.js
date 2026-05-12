// Banner de subvención - tarjeta flotante mostrada en cada carga de la home
// Se ejecuta directamente (sin DOMContentLoaded) porque el script se carga al final del body
(function() {
  const banner = document.getElementById('banner-subvencion');
  const legacySessionCookie = 'bannerSubvencionSesion';
  const esNavegadorAutomatizado = window.navigator.webdriver === true;
  const urlActual = new URL(window.location.href);
  const resetearBannerDesdeUrl = urlActual.searchParams.get('resetBanner') === '1';
  const forzarBannerDesdeUrl = urlActual.searchParams.get('forzarBanner') === '1';
  const resetearEstadoDesdeUrl = resetearBannerDesdeUrl || forzarBannerDesdeUrl;
  if (!banner) return;

  // Limpiamos cualquier cookie legado de la versión anterior por sesión.
  borrarCookie(legacySessionCookie);

  if (resetearEstadoDesdeUrl) {
    localStorage.removeItem('bannerSubvencionCerrado');

    urlActual.searchParams.delete('resetBanner');
    urlActual.searchParams.delete('forzarBanner');
    window.history.replaceState({}, document.title, `${urlActual.pathname}${urlActual.search}${urlActual.hash}`);
  }

  // La clave de localStorage solo existe para Playwright.
  // Si se queda persistida en un navegador real, la limpiamos para no ocultar el banner.
  if (!esNavegadorAutomatizado && localStorage.getItem('bannerSubvencionCerrado') === 'true') {
    localStorage.removeItem('bannerSubvencionCerrado');
  }

  // Ocultar si Playwright pre-setea la clave durante tests E2E.
  if (esNavegadorAutomatizado && localStorage.getItem('bannerSubvencionCerrado') === 'true') {
    banner.remove();
    return;
  }

  // Mostrar el banner
  banner.removeAttribute('inert');
  banner.classList.remove('oculto');
  banner.setAttribute('aria-hidden', 'false');

  if (forzarBannerDesdeUrl) {
    banner.classList.add('banner-subvencion--forzado');
  }

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
    banner.classList.remove('banner-subvencion--forzado');
    banner.setAttribute('inert', '');
    banner.setAttribute('aria-hidden', 'true');
    setTimeout(() => banner.remove(), 300);
  }

  function borrarCookie(clave) {
    document.cookie = `${encodeURIComponent(clave)}=; Max-Age=0; path=/; SameSite=Lax`;
  }
})();
