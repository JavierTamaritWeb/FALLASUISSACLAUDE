// js/ dark.js

// js/dark.js

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
      document.body.classList.add('modo-oscuro');
      document.documentElement.classList.add('modo-oscuro');
      document.body.classList.remove('modo-claro');
      document.documentElement.classList.remove('modo-claro');
    } else {
      document.documentElement.classList.remove('modo-oscuro');
      document.body.classList.add('modo-claro');
      document.documentElement.classList.add('modo-claro');
    }
    
    // Detectar navegador y aplicar configuración específica
    detectarNavegadorYConfigurar();
    
    actualizarThemeColor();
    actualizarIcono();
    // fetchCurrentWeather();
    // fetchForecast();
    // initAnimations();
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
});

/**
 * Detecta el navegador y aplica configuraciones específicas para iOS.
 */
function detectarNavegadorYConfigurar() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|Firefox/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  
  if (isIOS) {
    // Configuración específica para iOS
    document.documentElement.classList.add('ios-device');
    
    if (isSafari) {
      document.documentElement.classList.add('ios-safari');
    } else if (isChrome) {
      document.documentElement.classList.add('ios-chrome');
    } else if (isFirefox) {
      document.documentElement.classList.add('ios-firefox');
    }
    
    // Forzar actualización inicial del tema para iOS
    setTimeout(() => {
      forzarActualizacionTemaIOS();
    }, 500);
  }
}

/**
 * Actualización específica para iOS que funciona en todos los navegadores.
 */
function forzarActualizacionTemaIOS() {
  const isDarkMode = document.body.classList.contains('modo-oscuro');
  const colorActual = isDarkMode ? '#333333' : '#0a4b8d';
  
  // Método 1: Actualizar múltiples meta tags
  const metaTags = [
    'meta[name="theme-color"]:not([media])',
    'meta[name="msapplication-navbutton-color"]',
    'meta[name="msapplication-TileColor"]'
  ];
  
  metaTags.forEach(selector => {
    const meta = document.querySelector(selector);
    if (meta) {
      meta.content = colorActual;
    }
  });
  
  // Método 2: Para navegadores que necesitan un empujón extra
  if (document.documentElement.classList.contains('ios-chrome') || 
      document.documentElement.classList.contains('ios-firefox')) {
    
    // Crear y remover un meta tag temporal
    const tempMeta = document.createElement('meta');
    tempMeta.name = 'theme-color';
    tempMeta.content = colorActual;
    document.head.appendChild(tempMeta);
    
    setTimeout(() => {
      if (tempMeta.parentNode) {
        tempMeta.parentNode.removeChild(tempMeta);
      }
    }, 100);
    
    // Forzar reflow/repaint sin aplicar transforms (evita romper position: fixed en Safari/iOS)
    void document.body.offsetHeight;
  }
}

const botonModoOscuro = document.getElementById('botonModoOscuro');
botonModoOscuro.setAttribute('aria-label', 'Alternar modo oscuro');

let transicionAClaroTimeoutId;

/**
 * Actualiza el meta theme-color según el modo actual.
 * Funciona en Safari, Chrome y Firefox en iOS.
 */
function actualizarThemeColor() {
  const isDarkMode = document.body.classList.contains('modo-oscuro');
  const colorClaro = '#0a4b8d';
  const colorOscuro = '#333333';
  const colorActual = isDarkMode ? colorOscuro : colorClaro;
  
  // Actualizar theme-color principal
  let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colorActual);
  }
  
  // Actualizar meta tags específicos para compatibilidad
  let metaNavButton = document.querySelector('meta[name="msapplication-navbutton-color"]');
  if (metaNavButton) {
    metaNavButton.setAttribute('content', colorActual);
  }
  
  let metaTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
  if (metaTileColor) {
    metaTileColor.setAttribute('content', colorActual);
  }
  
  // Para iOS Safari - actualizar el viewport si es necesario
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && isDarkMode) {
    // Forzar repaint en iOS
    viewport.content = viewport.content;
  }
}

/**
 * Icono del Sol
 * Relleno #FF6F61 y borde/rayos blancos
 */
function getSunIcon() {
  return `
    <svg 
      width="32" height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="#fff"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="8" fill="#FF6F61" />
      <line x1="16" y1="2"  x2="16" y2="6"  />
      <line x1="16" y1="26" x2="16" y2="30" />
      <line x1="2"  y1="16" x2="6"  y2="16" />
      <line x1="26" y1="16" x2="30" y2="16" />
      <line x1="5"  y1="5"  x2="8"  y2="8"  />
      <line x1="24" y1="24" x2="27" y2="27" />
      <line x1="24" y1="8"  x2="27" y2="5"  />
      <line x1="5"  y1="27" x2="8"  y2="24" />
    </svg>
  `;
}

/**
 * Ícono de la Luna (nueva versión)
 * - Relleno: #FF6F61
 * - Borde: 2px en #fff
 * - Forma de media luna estilizada
 */
function getMoonIcon() {
  return `
    <svg width="32" height="32" viewBox="0 0 32 32"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(0, -4)">
        <defs>
          <mask id="crescentMask">
            <rect width="32" height="32" fill="white"/>
            <circle cx="24" cy="18" r="9.5" fill="black"/>
          </mask>
        </defs>
        <circle cx="18" cy="20" r="11"
                fill="#FF6F61" stroke="#fff" stroke-width="2"
                mask="url(#crescentMask)"/>
      </g>  
    </svg>
  `;
}

/**
 * Actualiza el icono del botón según el modo.
 */
function actualizarIcono() {
  if (document.body.classList.contains('modo-oscuro')) {
    // Modo oscuro => icono del sol
    botonModoOscuro.innerHTML = getSunIcon();
    mostrarNotificacion("Modo oscuro activado");
    botonModoOscuro.setAttribute('aria-label', 'Alternar modo claro');
  } else {
    // Modo claro => icono de la luna
    botonModoOscuro.innerHTML = getMoonIcon();
    mostrarNotificacion("Modo claro activado");
    botonModoOscuro.setAttribute('aria-label', 'Alternar modo oscuro');
  }
}

botonModoOscuro.addEventListener('click', () => {
  const wasDark = document.body.classList.contains('modo-oscuro');

  // Si vamos de oscuro -> claro, forzamos una transición extra suave sin afectar claro -> oscuro
  if (wasDark) {
    document.body.classList.add('transicion-a-claro');
    document.documentElement.classList.add('transicion-a-claro');
    if (transicionAClaroTimeoutId) {
      clearTimeout(transicionAClaroTimeoutId);
    }
  }

  // Añadir efecto de presionado
  botonModoOscuro.classList.add('pressed');
  
  // Cambiar el modo
  document.body.classList.toggle('modo-oscuro');
  document.documentElement.classList.toggle('modo-oscuro', document.body.classList.contains('modo-oscuro'));
  if (document.body.classList.contains('modo-oscuro')) {
    document.body.classList.remove('modo-claro');
    document.documentElement.classList.remove('modo-claro');
  } else {
    document.body.classList.add('modo-claro');
    document.documentElement.classList.add('modo-claro');
  }
  localStorage.setItem('darkMode', document.body.classList.contains('modo-oscuro'));
  actualizarThemeColor();
  actualizarIcono();
  
  // Forzar actualización específica para iOS
  if (document.documentElement.classList.contains('ios-device')) {
    setTimeout(() => {
      forzarActualizacionTemaIOS();
    }, 50);
  } else {
    // Forzar actualización en navegadores que no responden inmediatamente
    setTimeout(() => {
      forzarActualizacionTema();
    }, 100);
  }
  
  // Remover la clase pressed después de la animación
  setTimeout(() => {
    botonModoOscuro.classList.remove('pressed');
  }, 300);

  // Limpiar la clase temporal cuando termine la transición a claro (2.4s + margen)
  if (wasDark) {
    transicionAClaroTimeoutId = setTimeout(() => {
      document.body.classList.remove('transicion-a-claro');
      document.documentElement.classList.remove('transicion-a-claro');
      transicionAClaroTimeoutId = undefined;
    }, 2800);
  }
});

/**
 * Fuerza la actualización del tema en navegadores difíciles.
 * Especialmente útil para Chrome y Firefox en iOS.
 */
function forzarActualizacionTema() {
  const isDarkMode = document.body.classList.contains('modo-oscuro');
  const colorActual = isDarkMode ? '#333333' : '#0a4b8d';
  
  // Crear un nuevo meta tag temporalmente para forzar actualización
  const tempMeta = document.createElement('meta');
  tempMeta.name = 'theme-color';
  tempMeta.content = colorActual;
  document.head.appendChild(tempMeta);
  
  // Remover el temporal después de un momento
  setTimeout(() => {
    if (tempMeta.parentNode) {
      tempMeta.parentNode.removeChild(tempMeta);
    }
  }, 50);
}

/**
 * Muestra una notificación temporal.
 */
function mostrarNotificacion(mensaje, duracion = 4000) {
  const notificacion = document.getElementById('notificacion');
  notificacion.textContent = mensaje;
  notificacion.classList.add('mostrar');
  setTimeout(() => {
    notificacion.classList.remove('mostrar');
  }, duracion);
}
