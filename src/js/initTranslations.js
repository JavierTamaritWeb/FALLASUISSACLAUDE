// Raíz del sitio: '/' en producción; calculada desde la ruta de la página
// para soportar servir la web desde un subdirectorio (p. ej. Live Server
// sirviendo la raíz del repo con el sitio en /dist/). Elimina el nombre de
// archivo y el segmento va/ final de la ruta actual.
window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/(?:va\/)?[^/]*$/, '');

// js/initTranslations.js

window.currentLanguage = (() => {
  // try/catch obligatorio: Safari lanza SecurityError con localStorage bloqueado.
  try {
    return localStorage.getItem('lang');
  } catch (e) {
    console.warn('El acceso a localStorage está bloqueado por el navegador.');
    return null;
  }
})() || window.currentLanguage || (document.documentElement.lang === 'ca' ? 'va' : 'es');

if (typeof window.loadTranslations === 'function') {
  window.loadTranslations().catch(error => {
    console.error('Error al reutilizar las traducciones:', error);
  });
} else if (!window.translations) {
  fetch(window.SITE_ROOT + 'data/translations.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    })
    .then(data => {
      window.translations = data;
    })
    .catch(error => {
      console.error('Error al cargar las traducciones:', error);
    });
}