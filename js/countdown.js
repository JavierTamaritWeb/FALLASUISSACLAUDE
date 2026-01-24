/**
 *js/countdown.js
 *
 * Este script calcula de forma dinámica las fechas de inicio y fin de las Fallas para cualquier año,
 * sin depender de un JSON externo. La lógica es:
 *
 * 1. El inicio de Fallas (La Crida) se calcula como el último domingo de febrero a las 20:00.
 *    - Se toma el último día de febrero y se retrocede hasta encontrar un domingo.
 *
 * 2. El fin de Fallas es fijo: el 20 de marzo a las 00:00 del mismo año.
 *
 * Comportamiento del countdown:
 *   - Si la fecha actual (now) es anterior al inicio del ciclo de Fallas para el año actual,
 *     se muestra la cuenta regresiva hasta esa fecha (La Crida).
 *   - Si now está entre el inicio y el fin de Fallas (es decir, durante el evento),
 *     se muestra el mensaje "¡Fallas en curso!".
 *   - Si now es posterior al fin del ciclo (después del 20 de marzo a las 00:00),
 *     se calcula el ciclo para el año siguiente y se muestra la cuenta regresiva
 *     hasta el inicio del siguiente año (reinicio automático).
 *
 * Para comprobar que la cuenta atrás funcione correctamente:
 *   - Abre la consola del navegador (F12) y añade console.log() dentro de la función de cálculo
 *     para ver qué fechas se están generando.
 *   - Puedes cambiar temporalmente la fecha actual (por ejemplo, modificando la variable now)
 *     para simular distintos escenarios.
 */

 document.addEventListener("DOMContentLoaded", function () {
  // Seleccionamos los elementos del DOM donde se mostrará la cuenta atrás.
  const countdownMessage = document.querySelector('.countdown__message');
  const clock = document.querySelector('.countdown__clock');
  const fallasMessage = document.querySelector('.countdown__fallas-message');
  
  // Seleccionamos los elementos donde se mostrarán los días, horas, minutos y segundos.
  const daysSpan = clock.querySelector('[data-time="days"]');
  const hoursSpan = clock.querySelector('[data-time="hours"]');
  const minutesSpan = clock.querySelector('[data-time="minutes"]');
  const secondsSpan = clock.querySelector('[data-time="seconds"]');

  /**
   * getLastSundayOfFebruary(year)
   * Calcula el último domingo de febrero para el año dado.
   *
   * Se crea una fecha para el último día de febrero usando:
   *    new Date(year, 2, 0)
   * (recordando que los meses son 0-indexados: 0 = enero, 1 = febrero, 2 = marzo).
   * Luego se retrocede día a día hasta encontrar un domingo (getDay() === 0).
   *
   * @param {number} year - Año (ej. 2026)
   * @returns {Date} - Fecha del último domingo de febrero para ese año.
   */
  function getLastSundayOfFebruary(year) {
    // new Date(year, 2, 0) devuelve el último día de febrero.
    let lastDay = new Date(year, 2, 0);
    while (lastDay.getDay() !== 0) { // 0 = domingo
      lastDay.setDate(lastDay.getDate() - 1);
    }
    return lastDay;
  }

  /**
   * getCycleDates(year)
   * Calcula las fechas de inicio y fin del ciclo de Fallas para el año dado.
   *
   * - La fecha de inicio (La Crida) se calcula como el último domingo de febrero a las 20:00.
   * - La fecha de fin se fija en el 20 de marzo del mismo año a las 00:00.
   *
   * @param {number} year - Año para el que calcular el ciclo.
   * @returns {Object} - Objeto con propiedades "start" y "end", ambas de tipo Date.
   */
  function getCycleDates(year) {
    // La Crida: último domingo de febrero a las 20:00
    const start = getLastSundayOfFebruary(year);
    start.setHours(20, 0, 0, 0);

    const end = new Date(year, 2, 20, 0, 0, 0); // 20 de marzo a las 00:00 (mes 2 = marzo)
    return { start, end };
  }

  /**
   * getTargetDates()
   * Determina cuál es la fecha objetivo para la cuenta atrás y el estado del ciclo, basado en la fecha actual.
   *
   * Lógica:
   *   - Obtiene el ciclo para el año actual.
   *   - Si la fecha actual es anterior al ciclo de inicio (start), el estado es "upcoming" y el objetivo es start.
   *   - Si la fecha actual está entre start y end, el estado es "ongoing" (Fallas en curso) y no hay cuenta atrás.
   *   - Si la fecha actual es posterior a end, se obtiene el ciclo del siguiente año y se cuenta regresivamente
   *     hasta el start del siguiente ciclo.
   *
   * @returns {Object} - Objeto con:
   *    target: {Date|null} -> La fecha objetivo para la cuenta regresiva (o null si el evento está en curso).
   *    status: {string} -> "upcoming", "ongoing" o "upcoming-next"
   */
  function getTargetDates() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentCycle = getCycleDates(currentYear);

    if (now < currentCycle.start) {
      // Aún no han comenzado las Fallas del año actual.
      return { target: currentCycle.start, status: "upcoming" };
    } else if (now >= currentCycle.start && now < currentCycle.end) {
      // Estamos en el período de Fallas (entre inicio y fin).
      return { target: null, status: "ongoing" };
    } else {
      // Ya ha finalizado el ciclo del año actual, se usa el ciclo del año siguiente.
      const nextCycle = getCycleDates(currentYear + 1);
      return { target: nextCycle.start, status: "upcoming-next" };
    }
  }

  /**
   * updateCountdown()
   * Calcula la diferencia entre la fecha actual y la fecha objetivo (si procede) y actualiza el DOM.
   *
   * - Si el estado es "upcoming" o "upcoming-next", se muestra la cuenta atrás hasta el inicio de Fallas.
   * - Si el estado es "ongoing", se muestra el mensaje "¡Fallas en curso!".
   * - Si el tiempo restante es ≤ 0, se muestra "¡El ciclo ha finalizado!".
   */
  function updateCountdown() {
    const { target, status } = getTargetDates();
    const now = new Date();
    
    // Obtenemos la traducción deseada para el mensaje
    const translatedMessage = getNestedTranslation("countdown.message");
  
    if (status === "ongoing") {
      // Si ya estamos en Fallas, forzamos la traducción (podrías dejarlo sin actualizar si ya está correcto)
      if (countdownMessage.textContent !== translatedMessage) {
        countdownMessage.textContent = translatedMessage;
      }
      if (clock) clock.style.display = "none";
      if (fallasMessage) fallasMessage.style.display = "block";
      return;
    } else if (target) {
      // Solo actualizamos el mensaje si no coincide ya
      if (countdownMessage.textContent !== translatedMessage) {
        countdownMessage.textContent = translatedMessage;
      }
      if (clock) clock.style.display = "flex";
      if (fallasMessage) fallasMessage.style.display = "none";
  
      const diff = target - now;
      if (diff <= 0) {
        countdownMessage.textContent = "¡El ciclo ha finalizado!";
        if (clock) clock.style.display = "none";
        if (fallasMessage) fallasMessage.style.display = "block";
      } else {
        // Cálculo del tiempo restante.
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
        daysSpan.textContent = days;
        hoursSpan.textContent = hours;
        minutesSpan.textContent = minutes;
        secondsSpan.textContent = seconds;
      }
    } else {
      countdownMessage.textContent = "Fechas no configuradas";
      if (clock) clock.style.display = "none";
      if (fallasMessage) fallasMessage.style.display = "none";
    }
  }

  // Actualiza la cuenta atrás cada segundo.
  setInterval(updateCountdown, 1000);
});