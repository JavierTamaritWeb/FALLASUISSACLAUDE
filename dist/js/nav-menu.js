// js/nav-menu.js

(function () {
  function isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function init() {
    const headerBars = document.querySelectorAll('.header__barra, .header-inner__barra');

    if (headerBars.length) {
      const SCROLL_THRESHOLD = 24;
      let scrollTicking = false;

      const syncHeaderScrollState = () => {
        scrollTicking = false;
        const isScrolled = window.scrollY > SCROLL_THRESHOLD;

        headerBars.forEach((bar) => {
          if (bar.classList.contains('header__barra')) {
            bar.classList.toggle('header__barra--scrolled', isScrolled);
          }

          if (bar.classList.contains('header-inner__barra')) {
            bar.classList.toggle('header-inner__barra--scrolled', isScrolled);
          }
        });
      };

      const onScroll = () => {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(syncHeaderScrollState);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      syncHeaderScrollState();
    }

    const headerBar = document.querySelector('.header__barra, .header-inner__barra');
    if (!headerBar) return;

    const nav = headerBar.querySelector('.navegacion');
    if (!nav) return;

    if (!nav.id) nav.id = 'primaryNav';

    // If the toggle already exists, don't duplicate.
    let toggle = headerBar.querySelector('.header__menu-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'header__menu-toggle';
      toggle.setAttribute('aria-controls', nav.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      toggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M4 6.5h16a1 1 0 100-2H4a1 1 0 100 2zm0 7h16a1 1 0 100-2H4a1 1 0 100 2zm0 7h16a1 1 0 100-2H4a1 1 0 100 2z"/>
        </svg>
      `;

      const botones = headerBar.querySelector('.header__botones');
      // Insertar el toggle como hermano (antes del nav) para mantener
      // el layout: botones (idioma/modo) -> notificación -> menú.
      headerBar.insertBefore(toggle, nav);
    }

    // Backdrop (solo móvil): permite cerrar al clicar fuera del panel
    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    function setOpen(open) {
      const shouldOpen = Boolean(open);
      nav.classList.toggle('is-open', shouldOpen);
      toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', shouldOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', shouldOpen);
      backdrop.classList.toggle('is-active', shouldOpen);

      if (shouldOpen) {
        const firstLink = nav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (firstLink) firstLink.focus({ preventScroll: true });
      }
    }

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    // Ensure closed on load (especially after navigation).
    setOpen(false);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isMobile()) return;
      setOpen(!isOpen());
    });

    // Close on link click (before navigation).
    nav.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a');
      if (!link) return;
      if (isMobile()) setOpen(false);
    });

    // Close on Escape.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!isOpen()) return;
      setOpen(false);
      toggle.focus({ preventScroll: true });
    });

    // Close on backdrop click.
    backdrop.addEventListener('click', () => {
      if (!isOpen()) return;
      setOpen(false);
    });

    // Keep state consistent across resize.
    window.addEventListener('resize', () => {
      if (!isMobile() && isOpen()) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
