// js/acc.js
// Acordeones del sitio. Desde v4.23.1 el alto de apertura lo calcula este
// script (scrollHeight) en lugar de un tope fijo `max-height: 100rem` en CSS:
// ese tope recortaba cualquier panel más alto de 1000 px (HOPE en
// colaboraciones.html, Organigrama y Plana Mayor en móvil). Tras la
// transición se fija `max-height: none` para que el panel siga creciendo solo
// (imágenes lazy, cambio de idioma, redimensionado).

function initAccordion() {
  const headers = document.querySelectorAll('.accordion__titular');
  // Duración de la transición CSS (0.5s) más un margen, por si `transitionend`
  // no llega (p. ej. con prefers-reduced-motion la transición no existe).
  const RESPALDO_MS = 600;

  function getContent(section) {
    return section ? section.querySelector(':scope > .accordion__content') : null;
  }

  // Cancela el temporizador de respaldo y el listener pendientes de un panel.
  function limpiarPendientes(content) {
    if (content._accTimer) {
      clearTimeout(content._accTimer);
      content._accTimer = null;
    }
    if (content._accOnEnd) {
      content.removeEventListener('transitionend', content._accOnEnd);
      content._accOnEnd = null;
    }
  }

  function abrirPanel(section) {
    const content = getContent(section);
    if (!content) return;
    limpiarPendientes(content);
    content.style.maxHeight = content.scrollHeight + 'px';

    const fijarLibre = function () {
      limpiarPendientes(content);
      // Solo si la sección sigue abierta (podría haberse cerrado a medias)
      if (section.classList.contains('active')) {
        content.style.maxHeight = 'none';
      }
    };
    content._accOnEnd = function (e) {
      if (e.target === content && e.propertyName === 'max-height') fijarLibre();
    };
    content.addEventListener('transitionend', content._accOnEnd);
    content._accTimer = setTimeout(fijarLibre, RESPALDO_MS);
  }

  function cerrarPanel(section) {
    const content = getContent(section);
    if (!content) return;
    limpiarPendientes(content);
    // Desde `none` no hay transición posible: partir del alto real, forzar
    // reflow y dejar que gobierne el `max-height: 0` del CSS.
    content.style.maxHeight = content.scrollHeight + 'px';
    void content.offsetHeight;
    content.style.maxHeight = '';
  }

  // Si el titular tiene aria-expanded, lo sincronizamos con el estado abierto/cerrado.
  // Los acordeones antiguos sin ese atributo no se ven afectados.
  function setExpanded(titular, isOpen) {
    if (titular && titular.hasAttribute('aria-expanded')) {
      titular.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  // Función para resetear la clase activa de todos los íconos
  function resetIcons() {
    const icons = document.querySelectorAll('.accordion__icon');
    icons.forEach(function(icon) {
      icon.classList.remove('accordion__icon--active');
    });
  }

  // Añade el evento click a cada encabezado
  headers.forEach(function(header) {
    // Los titulares antiguos son <div>: sin esto no reciben foco ni responden
    // a Enter/Espacio (los <button> ya lo hacen de forma nativa).
    if (header.tagName !== 'BUTTON') {
      if (!header.hasAttribute('role')) header.setAttribute('role', 'button');
      if (!header.hasAttribute('tabindex')) header.setAttribute('tabindex', '0');
      if (!header.hasAttribute('aria-expanded')) header.setAttribute('aria-expanded', 'false');
      header.addEventListener('keydown', function(e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.defaultPrevented) {
          e.preventDefault();
          header.click();
        }
      });
    }
    header.addEventListener('click', function() {
      const section = this.parentElement; // La sección actual

      // Si la sección ya está activa, la cerramos y removemos la clase del ícono
      if (section.classList.contains('active')) {
        cerrarPanel(section);
        section.classList.remove('active');
        const icon = this.querySelector('.accordion__icon');
        if (icon) {
          icon.classList.remove('accordion__icon--active');
        }
        setExpanded(this, false);
        return;
      }

      // Cierra todas las secciones y resetea todos los íconos
      const sections = document.querySelectorAll('.accordion__section');
      sections.forEach(function(sec) {
        if (sec.classList.contains('active')) {
          cerrarPanel(sec);
          sec.classList.remove('active');
          const otroTitular = sec.querySelector('.accordion__titular');
          setExpanded(otroTitular, false);
        }
      });
      resetIcons();

      // Abre la sección clicada
      section.classList.add('active');
      abrirPanel(section);
      const icon = this.querySelector('.accordion__icon');
      if (icon) {
        icon.classList.add('accordion__icon--active');
      }
      setExpanded(this, true);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccordion, { once: true });
} else {
  initAccordion();
}
