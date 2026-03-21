// js/timeline.js
// Timeline de navegación lateral - Indicador de progreso entre secciones
// Solo visible en desktop (≥768px), se oculta cuando el hero es visible

document.addEventListener('DOMContentLoaded', function () {
  // Solo desktop
  if (window.innerWidth < 768) return;

  var secciones = document.querySelectorAll('[data-index]');
  if (!secciones.length) return;

  var hero = document.querySelector('[data-index="0"]');
  // Secciones con data-index 1 en adelante (las que generan dots)
  var seccionesDots = [];
  secciones.forEach(function (sec) {
    if (sec.getAttribute('data-index') !== '0') {
      seccionesDots.push(sec);
    }
  });

  if (!seccionesDots.length) return;

  // Crear el nav del timeline
  var nav = document.createElement('nav');
  nav.className = 'timeline';
  nav.setAttribute('aria-label', 'Navegación por secciones');

  seccionesDots.forEach(function (sec, i) {
    // Línea conectora antes de cada dot excepto el primero
    if (i > 0) {
      var linea = document.createElement('span');
      linea.className = 'timeline__line';
      linea.setAttribute('aria-hidden', 'true');
      nav.appendChild(linea);
    }

    var dot = document.createElement('button');
    dot.className = 'timeline__dot';
    dot.setAttribute('type', 'button');
    dot.setAttribute('aria-label', 'Ir a sección ' + (i + 1));
    dot.setAttribute('data-target', sec.getAttribute('data-index'));
    nav.appendChild(dot);
  });

  document.body.appendChild(nav);

  var dots = nav.querySelectorAll('.timeline__dot');

  // --- Click y teclado ---
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var targetIndex = dot.getAttribute('data-target');
      var target = document.querySelector('[data-index="' + targetIndex + '"]');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    dot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dot.click();
      }
    });
  });

  // --- Observer 1: Mostrar/ocultar timeline según hero ---
  if (hero) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          nav.classList.remove('is-visible');
        } else {
          nav.classList.add('is-visible');
        }
      });
    }, { threshold: 0.3 });

    revealObserver.observe(hero);
  } else {
    // Sin hero, siempre visible
    nav.classList.add('is-visible');
  }

  // --- Observer 2: Rastrear sección activa ---
  var dotTracker = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx = entry.target.getAttribute('data-index');
        // Buscar el dot correspondiente
        dots.forEach(function (d) {
          if (d.getAttribute('data-target') === idx) {
            d.classList.add('is-active');
          } else {
            d.classList.remove('is-active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  seccionesDots.forEach(function (sec) {
    dotTracker.observe(sec);
  });
});
