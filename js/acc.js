// js/acc.js



document.addEventListener('DOMContentLoaded', function() {
  const headers = document.querySelectorAll('.accordion__titular');

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
        return;
      }

      // Cierra todas las secciones y resetea todos los íconos
      const sections = document.querySelectorAll('.accordion__section');
      sections.forEach(function(sec) {
        sec.classList.remove('active');
      });
      resetIcons();

      // Abre la sección clicada
      section.classList.add('active');
      const icon = this.querySelector('.accordion__icon');
      if (icon) {
        icon.classList.add('accordion__icon--active');
      }
    });
  });
});