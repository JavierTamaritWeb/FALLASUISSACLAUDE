// js/accessibility.js
// Funcionalidades de accesibilidad para WEBFALLASUISSA

document.addEventListener('DOMContentLoaded', function() {
  
  /* ===================================
     KEYBOARD NAVIGATION
     =================================== */
  
  // Manejar navegación por teclado en elementos interactivos
  function initKeyboardNavigation() {
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, select, [tabindex="0"]');
    
    interactiveElements.forEach(element => {
      element.addEventListener('keydown', function(e) {
        // Enter y Espacio para activar elementos
        if (e.key === 'Enter' || e.key === ' ') {
          if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
            e.preventDefault();
            element.click();
          }
        }
        
        // Escape para cerrar dropdowns y modales
        if (e.key === 'Escape') {
          closeDropdowns();
          closeModals();
        }
      });
    });
  }
  
  /* ===================================
     DROPDOWN ACCESSIBILITY
     =================================== */
  
  function initDropdownAccessibility() {
    const langSwitcher = document.getElementById('langSwitcher');
    const langOptions = document.getElementById('langOptions');
    
    if (langSwitcher && langOptions) {
      langSwitcher.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        toggleDropdown(!isExpanded);
      });
      
      langSwitcher.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          toggleDropdown(true);
          focusFirstOption();
        }
      });
      
      // Navegación con flechas en el dropdown
      langOptions.addEventListener('keydown', function(e) {
        const options = this.querySelectorAll('.header__lang-option');
        const currentIndex = Array.from(options).indexOf(document.activeElement);
        
        switch(e.key) {
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % options.length;
            options[nextIndex].focus();
            break;
            
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            options[prevIndex].focus();
            break;
            
          case 'Escape':
            e.preventDefault();
            toggleDropdown(false);
            langSwitcher.focus();
            break;
        }
      });
    }
  }
  
  function toggleDropdown(show) {
    const langSwitcher = document.getElementById('langSwitcher');
    const langOptions = document.getElementById('langOptions');
    
    if (langSwitcher && langOptions) {
      langSwitcher.setAttribute('aria-expanded', show);
      langOptions.style.display = show ? 'block' : 'none';
      
      if (show) {
        // Establecer tabindex para opciones
        const options = langOptions.querySelectorAll('.header__lang-option');
        options.forEach((option, index) => {
          option.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
      }
    }
  }
  
  function focusFirstOption() {
    const firstOption = document.querySelector('.header__lang-option');
    if (firstOption) {
      firstOption.focus();
    }
  }
  
  function closeDropdowns() {
    toggleDropdown(false);
  }
  
  /* ===================================
     DARK MODE ACCESSIBILITY
     =================================== */
  
  function initDarkModeAccessibility() {
    const darkModeButton = document.getElementById('botonModoOscuro');
    
    if (darkModeButton) {
      // Actualizar aria-pressed cuando cambie el modo
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const isDark = document.body.classList.contains('modo-oscuro');
            darkModeButton.setAttribute('aria-pressed', isDark);
            darkModeButton.setAttribute('aria-label', 
              isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            );
          }
        });
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Estado inicial
      const isDark = document.body.classList.contains('modo-oscuro');
      darkModeButton.setAttribute('aria-pressed', isDark);
    }
  }
  
  /* ===================================
     LAZY LOADING ACCESSIBILITY
     =================================== */
  
  function initLazyLoadingAccessibility() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    // Fallback para navegadores que no soportan lazy loading nativo
    if ('loading' in HTMLImageElement.prototype) {
      // El navegador soporta lazy loading nativo
      lazyImages.forEach(img => {
        img.addEventListener('load', function() {
          this.classList.add('loaded');
        });
      });
    } else {
      // Fallback con Intersection Observer
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  /* ===================================
     FOCUS MANAGEMENT
     =================================== */
  
  function initFocusManagement() {
    // Añadir skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar al contenido principal';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Añadir ID al contenido principal si no existe
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content';
    }
    
    // Focus trap para modales (si existen)
    const modals = document.querySelectorAll('.modal, [role="dialog"]');
    modals.forEach(modal => {
      modal.addEventListener('keydown', trapFocus);
    });
  }
  
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    
    const modal = e.currentTarget;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /* ===================================
     LIVE REGIONS
     =================================== */
  
  function initLiveRegions() {
    // Crear función global para anunciar mensajes
    window.announceToScreenReader = function(message, priority = 'polite') {
      const liveRegion = document.getElementById('notificacion');
      if (liveRegion) {
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.textContent = message;
        
        // Limpiar después de 4 segundos
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 4000);
      }
    };
  }
  
  /* ===================================
     MODAL UTILITIES
     =================================== */
  
  function closeModals() {
    const openModals = document.querySelectorAll('.modal.open, [role="dialog"][aria-hidden="false"]');
    openModals.forEach(modal => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
  }
  
  /* ===================================
     CLICK OUTSIDE TO CLOSE
     =================================== */
  
  function initClickOutside() {
    document.addEventListener('click', function(e) {
      const langSwitcher = document.getElementById('langSwitcher');
      const langOptions = document.getElementById('langOptions');
      
      if (langSwitcher && langOptions) {
        if (!langSwitcher.contains(e.target) && !langOptions.contains(e.target)) {
          toggleDropdown(false);
        }
      }
    });
  }
  
  /* ===================================
     INITIALIZATION
     =================================== */
  
  // Inicializar todas las funcionalidades
  initKeyboardNavigation();
  initDropdownAccessibility();
  initDarkModeAccessibility();
  initLazyLoadingAccessibility();
  initFocusManagement();
  initLiveRegions();
  initClickOutside();
  
  // Anunciar que las mejoras de accesibilidad están cargadas
  setTimeout(() => {
    if (window.announceToScreenReader) {
      window.announceToScreenReader('Mejoras de accesibilidad cargadas');
    }
  }, 1000);
  
});