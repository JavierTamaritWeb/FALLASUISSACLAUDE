// Raíz del sitio: '/' en producción; calculada desde la ruta de la página
// para soportar servir la web desde un subdirectorio (p. ej. Live Server
// sirviendo la raíz del repo con el sitio en /dist/). Elimina el nombre de
// archivo y el segmento va/ final de la ruta actual.
window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/(?:va\/)?[^/]*$/, '');


// js/envia.js

const EMAILJS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
const EMAILJS_SCRIPT_SELECTOR = 'script[data-emailjs-script="true"]';
const EMAILJS_PUBLIC_KEY = '2sroeCfiZ4SiH-ZyX';

let emailJsPromise = null;
let emailJsInitialized = false;

function initEmailJsClient(emailClient) {
  if (!emailClient || emailJsInitialized) {
    return emailClient;
  }

  emailClient.init(EMAILJS_PUBLIC_KEY);
  emailJsInitialized = true;
  return emailClient;
}

function getEmailJsClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  const emailClient = window.emailjs;

  if (!emailClient || typeof emailClient.init !== 'function' || typeof emailClient.send !== 'function') {
    return null;
  }

  return initEmailJsClient(emailClient);
}

function loadEmailJs() {
  const emailClient = getEmailJsClient();
  if (emailClient) {
    return Promise.resolve(emailClient);
  }

  if (emailJsPromise) {
    return emailJsPromise;
  }

  emailJsPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(EMAILJS_SCRIPT_SELECTOR);

    const handleLoad = () => {
      if (script) {
        script.dataset.loaded = 'true';
      }

      const loadedClient = getEmailJsClient();
      if (loadedClient) {
        resolve(loadedClient);
        return;
      }

      emailJsPromise = null;
      reject(new Error('EmailJS se ha cargado pero no está disponible en window.emailjs.'));
    };

    const handleError = () => {
      emailJsPromise = null;
      reject(new Error('No se pudo cargar EmailJS.'));
    };

    if (!script) {
      script = document.createElement('script');
      script.src = EMAILJS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.emailjsScript = 'true';
      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
  });

  return emailJsPromise;
}

document.addEventListener("DOMContentLoaded", function() {
  const openModalBtn = document.getElementById('open-quieres-modal');
  const closeModalBtn = document.getElementById('close-quieres-modal');
  const modal = document.getElementById('modal-quieres');
  const primeEmailJs = () => {
    loadEmailJs().catch(error => {
      console.warn('No se pudo precargar EmailJS:', error);
    });
  };
  const abrirModal = () => {
    modal.classList.add('active');
  };
  const cerrarModal = () => {
    modal.classList.remove('active');
  };

  const actualizarTraducciones = () => {
    if (typeof updateTranslations === 'function') {
      updateTranslations();
    }
  };

  const registrarCierreYRecarga = (buttonId) => {
    const closeButton = document.getElementById(buttonId);
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        cerrarModal();
        location.reload();
      });
    }
  };

  const renderizarModalResultado = ({
    headerClass,
    titleKey,
    titleFallback,
    messageKey,
    messageFallback,
    imageSrc,
    imageAlt,
    closeId,
  }) => {
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header ${headerClass} text-white">
          <h5 class="modal-title" data-i18n="${titleKey}">${titleFallback}</h5>
          <button type="button" class="btn-close" id="${closeId}" aria-label="Cerrar">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body text-center">
          <img src="${imageSrc}" class="img-fluid mb-3" alt="${imageAlt}" loading="lazy" width="150" height="150">
          <p class="lead" data-i18n="${messageKey}">${messageFallback}</p>
        </div>
      </div>
    `;

    actualizarTraducciones();
    registrarCierreYRecarga(closeId);
  };

  // Configurar eventos para abrir/cerrar el modal
  if (openModalBtn && modal && closeModalBtn) {
    openModalBtn.addEventListener('pointerenter', primeEmailJs, { once: true });
    openModalBtn.addEventListener('focus', primeEmailJs, { once: true });

    openModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      abrirModal();
      primeEmailJs();
    });

    closeModalBtn.addEventListener('click', function() {
      cerrarModal();
    });

    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        cerrarModal();
      }
    });
  } else {
    console.warn("No se encontró el botón de apertura, el cierre o el modal.");
  }

  // Manejo del envío del formulario con EmailJS
  const form = document.getElementById('quieres-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button.boton-modal');
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      document.body.style.cursor = 'wait';

      const templateParams = {
        nombre: document.getElementById('quieres-nombre') ? document.getElementById('quieres-nombre').value : '',
        email: document.getElementById('quieres-email').value,
        telefono: document.getElementById('quieres-telefono').value,
        mensaje: document.getElementById('quieres-mensaje').value
      };

      let activeEmailClient = getEmailJsClient();
      if (!activeEmailClient) {
        try {
          activeEmailClient = await loadEmailJs();
        } catch (error) {
          document.body.style.cursor = 'default';
          if (submitBtn) { submitBtn.disabled = false; }
          console.error('EmailJS no está disponible', error);
          renderizarModalResultado({
            headerClass: 'bg-danger',
            titleKey: 'modalerror.title',
            titleFallback: 'Error Enviando Mensaje',
            messageKey: 'modalerror.mensaje',
            messageFallback: 'No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.',
            imageSrc: window.SITE_ROOT + 'img/error.png',
            imageAlt: 'Error',
            closeId: 'close-error-modal',
          });
          return;
        }
      }

      if (!activeEmailClient) {
        document.body.style.cursor = 'default';
        if (submitBtn) { submitBtn.disabled = false; }
        console.error('EmailJS no está disponible');
        renderizarModalResultado({
          headerClass: 'bg-danger',
          titleKey: 'modalerror.title',
          titleFallback: 'Error Enviando Mensaje',
          messageKey: 'modalerror.mensaje',
          messageFallback: 'No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.',
          imageSrc: window.SITE_ROOT + 'img/error.png',
          imageAlt: 'Error',
          closeId: 'close-error-modal',
        });
        return;
      }

      activeEmailClient.send('service_m22kcmj', 'template_mid06vz', templateParams)
        .then(function(response) {
          document.body.style.cursor = 'default';
          if (submitBtn) { submitBtn.disabled = false; }
          renderizarModalResultado({
            headerClass: 'bg-success',
            titleKey: 'modalexito.title',
            titleFallback: 'Mensaje enviado',
            messageKey: 'modalexito.mensaje',
            messageFallback: 'Tu mensaje se ha enviado correctamente.',
            imageSrc: window.SITE_ROOT + 'img/exito.png',
            imageAlt: 'Éxito',
            closeId: 'close-success-modal',
          });
        }, function(error) {
          document.body.style.cursor = 'default';
          if (submitBtn) { submitBtn.disabled = false; }
          console.error('Error al enviar el mensaje:', error);
          renderizarModalResultado({
            headerClass: 'bg-danger',
            titleKey: 'modalerror.title',
            titleFallback: 'Error Enviando Mensaje',
            messageKey: 'modalerror.mensaje',
            messageFallback: 'No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.',
            imageSrc: window.SITE_ROOT + 'img/error.png',
            imageAlt: 'Error',
            closeId: 'close-error-modal',
          });
        });
    });
  } else {
    console.error('No se encontró el formulario con id "quieres-form"');
  }

  // Configuración de traducciones cargada
});