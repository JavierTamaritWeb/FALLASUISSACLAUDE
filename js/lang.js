//js/lang.es

// Variables globales para traducciones y el idioma actual
let translations = {};
let currentLang = localStorage.getItem('lang') || 'es';

// Función helper para obtener traducciones anidadas usando notación de puntos

function getNestedTranslation(key) {
  const lang = translations[currentLang] ? currentLang : 'es';
  return key.split('.').reduce((obj, k) => obj && obj[k], translations[lang]) || key;
}

// Función translate que utiliza getNestedTranslation
function translate(key) {
  return getNestedTranslation(key);
}

// Función para cargar el JSON de traducciones

function loadTranslations() {
  return fetch('data/translations.json')
    .then(response => response.json())
    .then(data => {
      translations = data;
      window.translations = data; // Esto asegura que window.translations esté definido
    })
    .catch(error => console.error('Error loading translations:', error));
}


// Función que actualiza el contenido de los elementos transables
function updateTranslations () {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const translation = getNestedTranslation(key);
    if (translation) {
      // Notas del tablón con saltos de línea (<br>)
      if (elem.classList.contains('board__note-content')) {
        elem.innerHTML = translation;        // permite HTML
      } else {
        elem.textContent = translation;      // seguro, sin HTML
      }
    }
  });

  [
    ['[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder'],
    ['[data-i18n-aria-label]', 'data-i18n-aria-label', 'aria-label']
  ].forEach(([selector, keyAttribute, targetAttribute]) => {
    document.querySelectorAll(selector).forEach(elem => {
      const key = elem.getAttribute(keyAttribute);
      const translation = getNestedTranslation(key);
      if (translation) elem.setAttribute(targetAttribute, translation);
    });
  });
}


// Función para traducir un nombre (título, descripción o categoría) de evento
function translateEventName(text, lang) {
  if (
    translations &&
    translations[lang] &&
    translations[lang].calendarioEventos
  ) {
    return translations[lang].calendarioEventos[text] || text;
  }
  return text;
}

// Configuración del selector de idioma
const langSwitcher = document.getElementById('langSwitcher');
const langOptions = document.getElementById('langOptions');

function nombreIdioma(lang) {
  switch (lang) {
    case 'es':
      return 'Español';
    case 'va':
      return 'Valencià';
    case 'en':
      return 'English';
    case 'fr':
      return 'Français';
    default:
      return lang;
  }
}

function actualizarLabelIdioma() {
  if (!langSwitcher) return;
  const idioma = nombreIdioma(currentLang);
  langSwitcher.textContent = `IDIOMA · ${idioma}`;
  langSwitcher.setAttribute('aria-label', `Cambiar idioma (actual: ${idioma})`);
}

if (langSwitcher && langOptions) {
  // Asegurar atributos ARIA consistentes incluso si el HTML de internas es más simple
  langSwitcher.setAttribute('aria-expanded', langSwitcher.getAttribute('aria-expanded') || 'false');
  if (!langOptions.id) langOptions.id = 'langOptions';
  langSwitcher.setAttribute('aria-controls', langOptions.id);
  langOptions.setAttribute('role', langOptions.getAttribute('role') || 'menu');
  langOptions.setAttribute('aria-labelledby', langOptions.getAttribute('aria-labelledby') || 'langSwitcher');

  // Mostrar/ocultar el menú al hacer clic en el botón principal
  langSwitcher.addEventListener('click', (e) => {
    e.stopPropagation();
    langOptions.classList.toggle('active');
    langSwitcher.setAttribute('aria-expanded', langOptions.classList.contains('active') ? 'true' : 'false');
  });

  // Actualizar el idioma al hacer clic en una opción y disparar el evento "langChanged"
  document.querySelectorAll('.header__lang-option').forEach(option => {
    option.addEventListener('click', (e) => {
      currentLang = option.getAttribute('data-lang');
      localStorage.setItem('lang', currentLang);
      langOptions.classList.remove('active');
      langSwitcher.setAttribute('aria-expanded', 'false');
      actualizarLabelIdioma();
      updateTranslations();

      // Disparar un evento para notificar que el idioma ha cambiado
      const event = new Event("langChanged");
      document.dispatchEvent(event);

      // Si tienes funciones que actualizan vistas dinámicas, se pueden llamar aquí.
      if (typeof actualizarVista === 'function') {
        actualizarVista();
      }
      
      // Mostrar una notificación (suponiendo que tienes la función mostrarNotificacion)
      const idioma = nombreIdioma(currentLang);
      if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion("Idioma seleccionado: " + idioma, 4000);
      }
    });
  });

  // Ocultar el menú si se hace clic fuera
  document.addEventListener('click', () => {
    langOptions.classList.remove('active');
    langSwitcher.setAttribute('aria-expanded', 'false');
  });
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Cargar las traducciones y actualizar el contenido transable
    await loadTranslations();
    updateTranslations();

    // Pintar el label del botón de idioma según el idioma actual
    actualizarLabelIdioma();
    
    // Aquí se pueden inicializar otras funciones (por ejemplo, fetchCurrentWeather, initAnimations, etc.)
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
});
