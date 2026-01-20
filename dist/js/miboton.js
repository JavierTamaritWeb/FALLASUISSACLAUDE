// js/miboton.js

document.addEventListener('DOMContentLoaded', () => {
    const miBoton = document.querySelector('.boton'); // Asegúrate de que el id o selector sea correcto
    const colorOriginal = window.getComputedStyle(miBoton).backgroundColor;
  
    // Cambiar el color cuando se presiona el botón
    miBoton.addEventListener('mousedown', () => {
      miBoton.style.backgroundColor = '#ff6f61'; // Color activado
    });
  
    // Volver al color original cuando se suelta el botón
    miBoton.addEventListener('mouseup', () => {
      miBoton.style.backgroundColor = colorOriginal;
    });
  
    // Si el usuario sale del botón manteniendo pulsado el mouse, restablecer el color
    miBoton.addEventListener('mouseleave', () => {
      miBoton.style.backgroundColor = colorOriginal;
    });
  
    // Para dispositivos táctiles, escucha los eventos touchstart y touchend
    miBoton.addEventListener('touchstart', () => {
      miBoton.style.backgroundColor = '#ff6f61';
    });
    miBoton.addEventListener('touchend', () => {
      miBoton.style.backgroundColor = colorOriginal;
    });
});