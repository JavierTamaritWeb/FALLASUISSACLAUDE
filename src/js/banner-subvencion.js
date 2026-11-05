// Banner de subvención - tarjeta flotante que se muestra una vez por sesión del
// navegador (v4.44.3, decisión del usuario): una cookie de sesión, sin caducidad,
// recuerda que ya se vio y se borra al cerrar el navegador
// Se ejecuta directamente (sin DOMContentLoaded) porque el script se carga justo después del HTML del banner
(function() {
  const banner = document.getElementById('banner-subvencion');
  const cookieSesion = 'bannerSubvencionSesion';
  const esNavegadorAutomatizado = window.navigator.webdriver === true;
  const urlActual = new URL(window.location.href);
  const resetearBannerDesdeUrl = urlActual.searchParams.get('resetBanner') === '1';
  const forzarBannerDesdeUrl = urlActual.searchParams.get('forzarBanner') === '1';
  const resetearEstadoDesdeUrl = resetearBannerDesdeUrl || forzarBannerDesdeUrl;
  if (!banner) return;

  if (resetearEstadoDesdeUrl) {
    limpiarBannerCerrado();
    borrarCookie(cookieSesion);

    urlActual.searchParams.delete('resetBanner');
    urlActual.searchParams.delete('forzarBanner');
    window.history.replaceState({}, document.title, `${urlActual.pathname}${urlActual.search}${urlActual.hash}`);
  }

  // La clave de localStorage solo existe para Playwright.
  // Si se queda persistida en un navegador real, la limpiamos para no ocultar el banner.
  if (!esNavegadorAutomatizado && leerBannerCerrado()) {
    limpiarBannerCerrado();
  }

  // Ocultar si Playwright pre-setea la clave durante tests E2E.
  if (esNavegadorAutomatizado && leerBannerCerrado()) {
    banner.remove();
    return;
  }

  // Ya se mostró en esta sesión del navegador: no vuelve a salir
  if (leerCookie(cookieSesion) === '1') {
    banner.remove();
    return;
  }

  // Mostrar el banner y recordarlo para el resto de la sesión
  escribirCookieSesion(cookieSesion);
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

  function leerCookie(clave) {
    const nombre = `${encodeURIComponent(clave)}=`;
    const par = document.cookie.split('; ').find((c) => c.startsWith(nombre));
    return par ? decodeURIComponent(par.slice(nombre.length)) : null;
  }

  // Sin Max-Age ni Expires: cookie de sesión
  function escribirCookieSesion(clave) {
    document.cookie = `${encodeURIComponent(clave)}=1; path=/; SameSite=Lax`;
  }

  function borrarCookie(clave) {
    document.cookie = `${encodeURIComponent(clave)}=; Max-Age=0; path=/; SameSite=Lax`;
  }

  // try/catch obligatorio: Safari lanza SecurityError con localStorage bloqueado
  // y sin él el IIFE abortaría antes de mostrar el banner.
  function leerBannerCerrado() {
    try {
      return localStorage.getItem('bannerSubvencionCerrado') === 'true';
    } catch (e) {
      console.warn('El acceso a localStorage está bloqueado por el navegador.');
      return false;
    }
  }

  function limpiarBannerCerrado() {
    try {
      localStorage.removeItem('bannerSubvencionCerrado');
    } catch (e) {
      // localStorage bloqueado: no hay nada persistido que limpiar.
    }
  }
})();
