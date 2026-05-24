// js/acc.js

function initAccordion() {
  const headers = document.querySelectorAll('.accordion__titular');

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
    header.addEventListener('click', function() {
      const section = this.parentElement; // La sección actual

      // Si la sección ya está activa, la cerramos y removemos la clase del ícono
      if (section.classList.contains('active')) {
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
          sec.classList.remove('active');
          const otroTitular = sec.querySelector('.accordion__titular');
          setExpanded(otroTitular, false);
        }
      });
      resetIcons();

      // Abre la sección clicada
      section.classList.add('active');
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
