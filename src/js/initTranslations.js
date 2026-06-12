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
  fetch('/data/translations.json')
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