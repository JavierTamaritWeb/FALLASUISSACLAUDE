
// js/envia.js

document.addEventListener("DOMContentLoaded", function() {

  const openModalBtn = document.getElementById('open-quieres-modal');
  const closeModalBtn = document.getElementById('close-quieres-modal');
  const modal = document.getElementById('modal-quieres');

  // Configurar eventos para abrir/cerrar el modal
  if (openModalBtn && modal && closeModalBtn) {
    openModalBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      // Carga diferida del contenido del modal (lazy-loading)
      if (!modal.dataset.loaded) {
        try {
          const response = await fetch('modal-content.html');
          if (response.ok) {
            modal.innerHTML = await response.text();
            modal.dataset.loaded = true; // Marcamos que ya se cargó el contenido
            // Actualizamos las traducciones (suponiendo que updateTranslations está definida)
            if (typeof updateTranslations === 'function') {
              updateTranslations();
            }
            // Agregamos evento de cierre al botón que se carga dinámicamente
            const dynamicCloseBtn = modal.querySelector('.btn-close');
            if (dynamicCloseBtn) {
              dynamicCloseBtn.addEventListener('click', function() {
                modal.classList.remove('active');
              });
            }
          } else {
            console.error("Error al cargar el contenido del modal:", response.statusText);
          }
        } catch (error) {
          console.error("Error al cargar el contenido del modal:", error);
        }
      }
      modal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', function() {
      modal.classList.remove('active');
    });

    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
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

      emailjs.send('service_m22kcmj', 'template_mid06vz', templateParams)
        .then(function(response) {
          document.body.style.cursor = 'default';
          if (submitBtn) { submitBtn.disabled = false; }
          // Correo enviado correctamente
          modal.innerHTML = `
            <div class="modal-content">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title" data-i18n="modalexito.title"></h5>
                <button type="button" class="btn-close" id="close-success-modal" aria-label="Cerrar">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body text-center">
                <img src="img/exito.png" class="img-fluid mb-3" alt="Éxito" loading="lazy" width="150" height="150">
                <p class="lead" data-i18n="modalexito.mensaje"></p>
              </div>
            </div>
          `;
          if (typeof updateTranslations === 'function') {
            updateTranslations();
          }
          const closeSuccess = document.getElementById('close-success-modal');
          if (closeSuccess) {
            closeSuccess.addEventListener('click', function() {
              modal.classList.remove('active');
              location.reload();
            });
          }
        }, function(error) {
          document.body.style.cursor = 'default';
          if (submitBtn) { submitBtn.disabled = false; }
          console.error('Error al enviar el mensaje:', error);
          modal.innerHTML = `
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" data-i18n="modalerror.title">Error Enviando Mensaje</h5>
                <button type="button" class="btn-close" id="close-error-modal" aria-label="Cerrar">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body text-center">
                <img src="img/error.png" class="img-fluid mb-3" alt="Error" loading="lazy" width="150" height="150">
                <p class="lead" data-i18n="modalerror.mensaje">No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.</p>
              </div>
            </div>
          `;
          if (typeof updateTranslations === 'function') {
            updateTranslations();
          }
          const closeError = document.getElementById('close-error-modal');
          if (closeError) {
            closeError.addEventListener('click', function() {
              modal.classList.remove('active');
              location.reload();
            });
          }
        });
    });
  } else {
    console.error('No se encontró el formulario con id "quieres-form"');
  }

  // Configuración de traducciones cargada
});