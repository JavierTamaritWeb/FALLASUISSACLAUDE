
// js/envia.js

function getEmailJsClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  const emailClient = window.emailjs;

  if (!emailClient || typeof emailClient.init !== 'function' || typeof emailClient.send !== 'function') {
    return null;
  }

  return emailClient;
}

document.addEventListener("DOMContentLoaded", function() {
  const emailClient = getEmailJsClient();
  if (emailClient) {
    emailClient.init("2sroeCfiZ4SiH-ZyX");
  } else {
    console.warn('EmailJS no está disponible; el modal seguirá funcionando sin envío.');
  }

  const openModalBtn = document.getElementById('open-quieres-modal');
  const closeModalBtn = document.getElementById('close-quieres-modal');
  const modal = document.getElementById('modal-quieres');
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
    openModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      abrirModal();
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
    form.addEventListener('submit', function(e) {
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

      const activeEmailClient = emailClient || getEmailJsClient();
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
          imageSrc: 'img/error.png',
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
            imageSrc: 'img/exito.png',
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
            imageSrc: 'img/error.png',
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