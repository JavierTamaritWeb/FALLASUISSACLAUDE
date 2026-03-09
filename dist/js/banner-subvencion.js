// Banner de subvención - se muestra en cada carga de página
// Se ejecuta directamente (sin DOMContentLoaded) porque el script se carga al final del body
(function() {
  const banner = document.getElementById('banner-subvencion');
  const sessionKey = 'bannerSubvencionMostradoSesion';
  if (!banner) return;

  // Ocultar si Playwright pre-setea la clave (solo en tests E2E)
  if (localStorage.getItem('bannerSubvencionCerrado') === 'true') {
    banner.remove();
    return;
  }

  const esRecarga = detectarRecarga();
  const yaMostradoEnPestana = leerSesion(sessionKey) === 'true';

  if (!esRecarga && yaMostradoEnPestana) {
    banner.remove();
    return;
  }

  escribirSesion(sessionKey, 'true');

  // Mostrar el banner
  banner.classList.remove('oculto');

  // Botón cerrar
  const btnCerrar = banner.querySelector('.banner-subvencion__cerrar');
  btnCerrar?.addEventListener('click', cerrarBanner);

  // Cerrar al hacer clic fuera del contenido
  banner.addEventListener('click', (e) => {
    if (e.target === banner) cerrarBanner();
  });

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !banner.classList.contains('oculto')) {
      cerrarBanner();
    }
  });

  function cerrarBanner() {
    banner.classList.add('oculto');
    setTimeout(() => banner.remove(), 300);
  }

  function detectarRecarga() {
    const navigationEntries = typeof performance.getEntriesByType === 'function'
      ? performance.getEntriesByType('navigation')
      : [];
    const navigationEntry = navigationEntries[0];

    if (navigationEntry && navigationEntry.type) {
      return navigationEntry.type === 'reload';
    }

    if (performance.navigation) {
      return performance.navigation.type === 1;
    }

    return false;
  }

  function leerSesion(clave) {
    try {
      return sessionStorage.getItem(clave);
    } catch (error) {
      return null;
    }
  }

  function escribirSesion(clave, valor) {
    try {
      sessionStorage.setItem(clave, valor);
    } catch (error) {
      // Ignorar navegadores con sessionStorage bloqueado
    }
  }
})();
