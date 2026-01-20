
//js/fullscreen.js


document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (event) => {
    // Verifica si se hizo click en una imagen dentro de .notepad__page
    if (event.target.tagName === 'IMG' && event.target.closest('.notepad__page')) {
      if (!document.fullscreenElement) {
        // Solicita pantalla completa para la imagen clicada
        event.target.requestFullscreen().catch(err => {
          console.error('Error al entrar en pantalla completa: ', err);
        });
      } else {
        // Sale del modo pantalla completa
        document.exitFullscreen().catch(err => {
          console.error('Error al salir de pantalla completa: ', err);
        });
      }
    }
  });

  // Prevenir arrastrar la imagen en modo fullscreen
  document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'IMG' && event.target.closest('.notepad__page')) {
      event.preventDefault();
    }
  });
});