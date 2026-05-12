// js/initTranslations.js

window.currentLanguage = localStorage.getItem('lang') || window.currentLanguage || 'es';

if (typeof window.loadTranslations === 'function') {
  window.loadTranslations().catch(error => {
    console.error('Error al reutilizar las traducciones:', error);
  });
} else if (!window.translations) {
  fetch('data/translations.json')
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