// js/initTranslations.js


// Definir el idioma actual (puede ser 'es', 'va', 'en', 'fr', etc.)
window.currentLanguage = 'es';

// Cargar las traducciones desde el archivo JSON
fetch('data/translations.json')
  .then(response => response.json())
  .then(data => {
    window.translations = data;
    // Traducciones cargadas correctamente
  })
  .catch(error => {
    console.error('Error al cargar las traducciones:', error);
  });