// js/calendario.js

// ================================
// FUNCIONES AUXILIARES
// ================================

function actualizarFiltrosConCelda(celda, dia, mes, anio) {
  const diaStr = String(dia).padStart(2, "0");
  const mesStr = String(mes + 1).padStart(2, "0");
  document.getElementById('filtro-dia').value = diaStr;
  document.getElementById('filtro-mes').value = mesStr;
  document.getElementById('filtro-ano').value = String(anio);
  actualizarVista();
}

function cumpleRango(eDateStr, iniDate, finDate) {
  const [yyyy, mm, dd] = eDateStr.split('-').map(Number);
  const eDate = new Date(yyyy, mm - 1, dd);
  if (iniDate && eDate < iniDate) return false;
  if (finDate && eDate > finDate) return false;
  return true;
}

// Renderiza la lista de tarjetas de eventos.
function renderizarLista(eventosFiltrados) {
  const lista = document.getElementById('lista-anuncios');
  lista.innerHTML = '';
  if (eventosFiltrados.length === 0) {
    lista.innerHTML = `
      <p>No se han encontrado eventos que coincidan con los filtros seleccionados.</p>
      <button id="btn-reset-filtros">Borrar filtros</button>
    `;
    document.getElementById('btn-reset-filtros').addEventListener('click', resetearFiltros);
    return;
  }
  const mapping = {
    "Urgente": "#C13584",
    "Recordatorio": "#000080",
    "Informacion": "#FFD700",
    "Festivo": "#FF6F61",
    "Falla": "#00909E",
    "Evento": "#4A4A4A"
  };
  eventosFiltrados.forEach(e => {
    let claseModificador = '';
    switch(e.category) {
      case 'Festivo': claseModificador = 'calendario-eventos__item--festivo'; break;
      case 'Falla': claseModificador = 'calendario-eventos__item--falla'; break;
      case 'Evento': claseModificador = 'calendario-eventos__item--evento'; break;
      case 'Urgente': claseModificador = 'calendario-eventos__item--urgente'; break;
      case 'Informacion': claseModificador = 'calendario-eventos__item--informacion'; break;
      case 'Recordatorio': claseModificador = 'calendario-eventos__item--recordatorio'; break;
      default: claseModificador = '';
    }
    const div = document.createElement('div');
    div.className = `calendario-eventos__item ${claseModificador}`;
    const banda = document.createElement('div');
    banda.className = 'calendario-eventos__banda';
    banda.style.backgroundColor = mapping[e.category] || "#000";
    div.insertBefore(banda, div.firstChild);
    div.innerHTML += `
      <h2 class="calendario-eventos__item-titulo">${translateEventName(e.title, currentLang)}</h2>
      <p class="calendario-eventos__item-contenido">${translateEventName(e.description, currentLang)}</p>
      <div class="calendario-eventos__item-meta">
        <span>${e.date}</span>
        <span>${translateEventName(e.category, currentLang)}</span>
      </div>
    `;
    div.addEventListener('click', () => {
      const [year, m, d] = e.date.split('-').map(Number);
      const dateObj = new Date(year, m - 1, d);
      const dayName = obtenerNombreDia(dateObj);
      
      // SOLUCIÓN: traducir antes de abrirICSModal
      const eventTitleTranslated = translateEventName(e.title, currentLang);
      const eventDescTranslated  = translateEventName(e.description, currentLang);
    
      abrirICSModal({
        date: d,
        dayName: dayName,
        eventTitle: eventTitleTranslated,
        startTime: "00:00",
        endTime: "23:59",
        notes: eventDescTranslated
      });
    });
    lista.appendChild(div);
  });
}

function obtenerNombreDia(dateObj) {
  const dias = {
    es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    va: ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
  };
  return dias[currentLang][dateObj.getDay()];
}

function getPriorityColorForEvents(eventsArray) {
  const categoryPriority = {
    "Urgente": 1,
    "Recordatorio": 2,
    "Informacion": 3,
    "Festivo": 4,
    "Falla": 5,
    "Evento": 6
  };
  const mapping = {
    "Urgente": "#C13584",
    "Recordatorio": "#000080",
    "Informacion": "#FFD700",
    "Festivo": "#FF6F61",
    "Falla": "#00909E",
    "Evento": "#4A4A4A"
  };
  let bestPriority = Infinity;
  let bestColor = "";
  eventsArray.forEach(ev => {
    const prio = categoryPriority[ev.category] || Infinity;
    if (prio < bestPriority) {
      bestPriority = prio;
      bestColor = mapping[ev.category];
    }
  });
  return bestColor;
}

function getPriorityEvent(eventsArray) {
  const categoryPriority = {
    "Urgente": 1,
    "Recordatorio": 2,
    "Informacion": 3,
    "Festivo": 4,
    "Falla": 5,
    "Evento": 6
  };
  let selectedEvent = eventsArray[0];
  eventsArray.forEach(ev => {
    if (categoryPriority[ev.category] < categoryPriority[selectedEvent.category]) {
      selectedEvent = ev;
    }
  });
  return selectedEvent;
}

// ================================
// RENDERIZACIÓN DEL CALENDARIO
// ================================

function renderCalendarDetails(lang) {
  const container = document.getElementById('descripcion-eventos-mes');
  if (!container) return;
  if (!window.translations || !window.translations[lang]) {
    console.error("Las traducciones no están definidas para el idioma:", lang);
    return;
  }
  const year = "2025";
  const monthIndex = 3; // Abril
  const monthName = (window.calendarData && window.calendarData[year] && window.calendarData[year].monthNames)
                      ? window.calendarData[year].monthNames[monthIndex]
                      : (window.MESES ? window.MESES[monthIndex] : "Abril");
  let headerTemplate = window.translations[lang].calendario.eventosMes;
  headerTemplate = headerTemplate.replace('{month}', monthName).replace('{year}', year);
  container.innerHTML = `<h2>${headerTemplate}</h2>`;
}

function renderCalendarEvents(lang) {
  const container = document.getElementById('lista-anuncios');
  if (!container) return;
  container.innerHTML = '';
  window.eventos.forEach(event => {
    const item = document.createElement('div');
    item.classList.add('calendario-eventos__item');
    item.classList.add(`calendario-eventos__item--${event.category.toLowerCase()}`);
    const banda = document.createElement('div');
    banda.classList.add('calendario-eventos__banda');
    item.appendChild(banda);
    const titleEl = document.createElement('h2');
    titleEl.classList.add('calendario-eventos__item-titulo');
    titleEl.textContent = translateEventName(event.title, lang);
    item.appendChild(titleEl);
    const contentEl = document.createElement('p');
    contentEl.classList.add('calendario-eventos__item-contenido');
    contentEl.textContent = translateEventName(event.description, lang);
    item.appendChild(contentEl);
    const metaEl = document.createElement('div');
    metaEl.classList.add('calendario-eventos__item-meta');
    const dateSpan = document.createElement('span');
    dateSpan.textContent = event.date;
    metaEl.appendChild(dateSpan);
    const catSpan = document.createElement('span');
    catSpan.textContent = translateEventName(event.category, lang);
    metaEl.appendChild(catSpan);
    item.appendChild(metaEl);
    item.addEventListener('click', () => {
      const [year, m, d] = event.date.split('-').map(Number);
      const dateObj = new Date(year, m - 1, d);
      const dayName = obtenerNombreDia(dateObj);
      abrirICSModal({
        date: d,
        dayName: dayName,
        eventTitle: event.title,
        startTime: "00:00",
        endTime: "23:59",
        notes: event.description
      });
    });
    container.appendChild(item);
  });
}

function renderCalendarContent(lang) {
  renderCalendarDetails(lang);
  renderCalendarEvents(lang);
}

// ================================
// FUNCIONES DEL MINI CALENDARIO
// ================================

// --- NUEVA IMPLEMENTACIÓN DE LAS ABREVIATURAS DE LOS DÍAS ---
// Definición de las abreviaturas según idioma.
const diasSemanaTranslations = {
  es: ["L", "M", "X", "J", "V", "S", "D"],
  va: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
  en: ["M", "Tu", "W", "Th", "F", "St", "Sn"],
  fr: ["L", "Ma", "Me", "J", "V", "S", "D"]
};

function obtenerDiasSemana() {
  return diasSemanaTranslations[currentLang] || diasSemanaTranslations.es;
}

// Construye el encabezado del mini-calendario con las abreviaturas de días traducidas.
function construirEncabezadoDias() {
  const fragment = document.createDocumentFragment();
  const diasSemana = obtenerDiasSemana();
  diasSemana.forEach(dia => {
    const celda = document.createElement('div');
    celda.className = 'calendario-eventos__mini-encabezado';
    celda.textContent = dia;
    fragment.appendChild(celda);
  });
  return fragment;
}

function calcularOffset(mes, anio) {
  const primerDia = new Date(anio, mes, 1).getDay();
  return (primerDia === 0) ? 6 : primerDia - 1;
}

function resaltarCeldaSeleccionada(celda) {
  document.querySelectorAll('.calendario-eventos__mini-dia').forEach(el => {
    el.classList.remove('seleccionado');
  });
  celda.classList.add('seleccionado');
  setTimeout(() => {
    celda.classList.remove('seleccionado');
  }, 500);
}

function crearCeldaDia(d, mes, anio, eventosDelDia) {
  const celda = document.createElement('div');
  celda.className = 'calendario-eventos__mini-dia';
  celda.textContent = d;
  const dayOfWeek = new Date(anio, mes, d).getDay();
  if (dayOfWeek === 6) {
    celda.classList.add('sabado');
  } else if (dayOfWeek === 0) {
    celda.classList.add('domingo');
  }
  if (eventosDelDia.length > 0) {
    const dot = document.createElement('span');
    dot.className = 'calendario-eventos__mini-indicador';
    dot.style.backgroundColor = getPriorityColorForEvents(eventosDelDia);
    celda.appendChild(dot);
  }
  if (eventosDelDia.length > 1) {
    const banda = document.createElement('div');
    banda.className = 'calendario-eventos__mini-banda';
    banda.style.backgroundColor = getPriorityColorForEvents(eventosDelDia);
    celda.appendChild(banda);
  }
  if (eventosDelDia.length > 0) {
    const tooltip = document.createElement('div');
    tooltip.className = 'calendario-eventos__tooltip';
    tooltip.textContent = eventosDelDia.map(e => e.title).join(", ");
    celda.appendChild(tooltip);
  }
  celda.addEventListener('click', () => {
    actualizarFiltrosConCelda(celda, d, mes, anio);
    resaltarCeldaSeleccionada(celda);
    const dateObj = new Date(anio, mes, d);
    const dayName = obtenerNombreDia(dateObj);
    let prefillEvent = { eventTitle: "", notes: "" };
    if (eventosDelDia.length > 0) {
      const priorityEvent = getPriorityEvent(eventosDelDia);
      // prefillEvent.eventTitle = priorityEvent.title;
      // prefillEvent.notes = priorityEvent.description;
      prefillEvent.eventTitle = translateEventName(priorityEvent.title, currentLang);
      prefillEvent.notes = translateEventName(priorityEvent.description, currentLang);
    }
    abrirICSModal({
      date: d,
      dayName: dayName,
      eventTitle: prefillEvent.eventTitle,
      startTime: "00:00",
      endTime: "23:59",
      notes: prefillEvent.notes
    });
  });
  return celda;
}

function construirCuadricula(mes, anio, eventosFiltrados) {
  const fragment = document.createDocumentFragment();
  // Agrega el encabezado con los días traducidos
  fragment.appendChild(construirEncabezadoDias());
  const offset = calcularOffset(mes, anio);
  for (let i = 0; i < offset; i++) {
    const vacio = document.createElement('div');
    vacio.className = 'calendario-eventos__mini-dia';
    fragment.appendChild(vacio);
  }
  const numDias = new Date(anio, mes + 1, 0).getDate();
  for (let d = 1; d <= numDias; d++) {
    const fechaCelda = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const eventosDelDia = filtradosPorFecha(eventosFiltrados, fechaCelda);
    const celdaDia = crearCeldaDia(d, mes, anio, eventosDelDia);
    const hoy = new Date();
    if (anio === hoy.getFullYear() && mes === hoy.getMonth() && d === hoy.getDate()) {
      celdaDia.classList.add('hoy');
    }
    fragment.appendChild(celdaDia);
  }
  return fragment;
}

function filtradosPorFecha(eventos, fecha) {
  return eventos.filter(e => e.date === fecha);
}

function generarMiniCalendario(mes, anio, eventosFiltrados) {
  const contenedor = document.getElementById('mini-calendario');
  contenedor.style.opacity = 0;
  setTimeout(() => {
    const fragment = construirCuadricula(mes, anio, eventosFiltrados);
    contenedor.innerHTML = "";
    contenedor.appendChild(fragment);
    contenedor.style.opacity = 1;
  }, 100);
}

// ================================
// ACTUALIZACIÓN DE VISTA
// ================================



  
function filtrarEventos() {
  const busqueda     = document.getElementById('filtro-busqueda').value.trim().toLowerCase();
  const categoria    = document.getElementById('filtro-categoria').value.trim();
  const fechaPuntual = document.getElementById('filtro-fecha').value.trim();
  const diaFiltro    = document.getElementById('filtro-dia').value.trim();
  const mesFiltro    = document.getElementById('filtro-mes').value.trim();
  const anoFiltro    = document.getElementById('filtro-ano').value.trim();
  const rangoStr     = document.getElementById('filtro-rango-fecha').value.trim();

  // Si no se aplican filtros, mostrar solo los eventos del mes actual
  if (!busqueda && !categoria && !fechaPuntual && !diaFiltro && !mesFiltro && !anoFiltro && !rangoStr) {
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
    return (window.eventos || []).filter(e =>
      e.date.startsWith(currentYear) && e.date.substring(5, 7) === currentMonth
    );
  }
  
  let filtrados = window.eventos || [];
  
  if (busqueda) {
    filtrados = filtrados.filter(e => {
      const titulo = e.title.toLowerCase();
      const desc = e.description.toLowerCase();
      return titulo.includes(busqueda) || desc.includes(busqueda);
    });
  }
  
  if (anoFiltro) {
    filtrados = filtrados.filter(e => e.date.startsWith(anoFiltro));
  }
  
  if (diaFiltro) {
    filtrados = filtrados.filter(e => e.date.substring(8, 10) === diaFiltro.padStart(2, "0"));
  }
  
  if (categoria) {
    filtrados = filtrados.filter(e => e.category === categoria);
  }
  
  if (fechaPuntual) {
    filtrados = filtrados.filter(e => e.date === fechaPuntual);
  }
  
  if (mesFiltro) {
    filtrados = filtrados.filter(e => e.date.substring(5, 7) === mesFiltro.padStart(2, "0"));
  }
  
  const fp = document.getElementById('filtro-rango-fecha')._flatpickr;
  if (fp && fp.selectedDates.length === 2) {
    const fechaInicio = fp.selectedDates[0];
    const fechaFin = fp.selectedDates[1];
    filtrados = filtrados.filter(e => cumpleRango(e.date, fechaInicio, fechaFin));
  }
  
  return filtrados;
}

function actualizarVista() {
  const filtrados = filtrarEventos();
  renderizarLista(filtrados);
  let mes = new Date().getMonth();
  let anio = new Date().getFullYear();
  const mesFiltro = document.getElementById('filtro-mes').value.trim();
  const anoFiltro = document.getElementById('filtro-ano').value.trim();
  if (mesFiltro) mes = parseInt(mesFiltro) - 1;
  if (anoFiltro) anio = parseInt(anoFiltro);
  actualizarLeyenda(mes, anio);
  const eventosEsteMes = filtrados.filter(e => {
    const yearE = parseInt(e.date.substring(0, 4));
    const monthE = parseInt(e.date.substring(5, 7));
    return (yearE === anio && monthE === (mes + 1));
  });
  mostrarDescripcionMes(eventosEsteMes, mes, anio);
  generarMiniCalendario(mes, anio, filtrados);
}

// ================================
// CONTROLES Y ATAJOS
// ================================

function resetearFiltros() {
  document.getElementById('filtro-busqueda').value = '';
  document.getElementById('filtro-categoria').value = '';
  if (document.getElementById('filtro-rango-fecha')._flatpickr) {
    document.getElementById('filtro-rango-fecha')._flatpickr.clear();
  }
  document.getElementById('filtro-fecha').value = '';
  document.getElementById('filtro-dia').value = '';
  document.getElementById('filtro-mes').value = '';
  document.getElementById('filtro-ano').value = '';
  actualizarVista();
}

function toggleModo() {
  const contenedor = document.getElementById('calendarioContenedor');
  const boton = document.getElementById('botonModo');
  if (contenedor.classList.contains('modo-sencillo')) {
    contenedor.classList.remove('modo-sencillo');
    contenedor.classList.add('modo-avanzado');
    boton.textContent = "Cambiar a Modo Sencillo";
  } else {
    contenedor.classList.remove('modo-avanzado');
    contenedor.classList.add('modo-sencillo');
    boton.textContent = "Cambiar a Modo Avanzado";
  }
}

function manejarAtajos(e) {
  if (e.altKey && e.key.toLowerCase() === 'r') {
    resetearFiltros();
  }
}

// ================================
// TRADUCCIÓN Y FECHAS
// ================================

function actualizarLeyenda(mes, anio) {
  const infoMes = document.getElementById('info-mes');
  const rawLeyenda = translate("calendarioLeyenda");
  const monthName = getMonthName(mes);
  infoMes.textContent = rawLeyenda.replace("{mes}", monthName).replace("{anio}", anio);
}

function getMonthName(index) {
  const months = {
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    va: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
  };
  return months[currentLang][index];
}

function mostrarDescripcionMes(eventosDelMes, mes, anio) {
  const contenedor = document.getElementById('descripcion-eventos-mes');
  contenedor.innerHTML = '';
  const nombreMes = (window.calendarData && window.calendarData["2025"] && window.calendarData["2025"].monthNames)
                      ? window.calendarData["2025"].monthNames[mes]
                      : (window.MESES ? window.MESES[mes] : "Mes");
  const titulo = document.createElement('h2');
  titulo.textContent = translate("calendario.eventosMes").replace("{month}", nombreMes).replace("{year}", anio);
  contenedor.appendChild(titulo);
  if (eventosDelMes.length === 0) {
    const p = document.createElement('p');
    p.textContent = "No hay eventos para este mes.";
    contenedor.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  eventosDelMes.forEach(ev => {
    const li = document.createElement('li');
    li.textContent = `${translateEventName(ev.title, currentLang)} (${ev.date}): ${translateEventName(ev.description, currentLang)}`;
    ul.appendChild(li);
  });
  contenedor.appendChild(ul);
}

// ================================
// MODAL ICS
// ================================

const icsModal = document.getElementById('icsModal');
const icsCerrarBtn = document.getElementById('icsCerrarBtn');
const icsAceptarBtn = document.getElementById('icsAceptarBtn');
const icsModalTitulo = document.getElementById('icsModalTitulo');
const icsEventoInput = document.getElementById('icsEvento');
const icsHoraInicio = document.getElementById('icsHoraInicio');
const icsHoraFin = document.getElementById('icsHoraFin');
const icsNotas = document.getElementById('icsNotas');

function abrirICSModal({ date, dayName, eventTitle, startTime, endTime, notes }) {
  const rawTitulo = translate("icsModal.titulo");
  const tituloModal = rawTitulo.replace("{date}", date).replace("{dayName}", dayName);
  icsModalTitulo.textContent = tituloModal;
  icsEventoInput.value = eventTitle || "";
  icsHoraInicio.value = startTime || "00:00";
  icsHoraFin.value = endTime || "23:59";
  icsNotas.value = notes || "";
  icsModal.classList.remove('oculto');
}

function cerrarICSModal() {
  icsModal.classList.add('oculto');
}
icsCerrarBtn.addEventListener('click', cerrarICSModal);
icsAceptarBtn.addEventListener('click', () => {
  const titulo = icsModalTitulo.textContent;
  const [ , rawDay ] = titulo.split(" ");
  const eventTitle = icsEventoInput.value;
  const startTime = icsHoraInicio.value;
  const endTime = icsHoraFin.value;
  const notes = icsNotas.value;
  const icsData = generarICS({
    dayLabel: rawDay,
    eventTitle,
    startTime,
    endTime,
    notes
  });
  const blob = new Blob([icsData], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'evento.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  cerrarICSModal();
  mostrarNotificacion("Archivo ICS descargado con éxito", 4000);
});

function generarICS({ dayLabel, eventTitle, startTime, endTime, notes }) {
  const fakeDate = new Date(2025, 2, 18);
  const dtStamp = formatearFechaICS(new Date());
  const dtStart = formatearFechaICS(combinarFechaHora(fakeDate, startTime));
  const dtEnd   = formatearFechaICS(combinarFechaHora(fakeDate, endTime));
  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Falla Suïssa
BEGIN:VEVENT
UID:${Date.now()}-falla-suissa
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${limpiarICS(eventTitle)}
DESCRIPTION:${limpiarICS(notes)}
END:VEVENT
END:VCALENDAR
  `.trim();
}

function formatearFechaICS(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function combinarFechaHora(dateObj, hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const newDate = new Date(dateObj);
  newDate.setHours(hh || 0, mm || 0, 0, 0);
  return newDate;
}

function limpiarICS(str) {
  return (str || "")
    .replace(/(\r\n|\r|\n)/g, "\\n")
    .replace(/,/g, "\\,");
}

// ================================
// INICIALIZACIÓN Y CONFIGURACIÓN
// ================================

document.addEventListener('DOMContentLoaded', function() {
  flatpickr("#filtro-rango-fecha", {
    inline: false, 
    mode: "range",
    dateFormat: "d/m/Y",
    rangeSeparator: " a "
  });
  
  Promise.all([
    fetch('data/eventos.json').then(response => response.json()),
    fetch('data/calendarData.json').then(response => response.json())
  ])
  .then(([eventData, calData]) => {
    window.eventos = eventData.eventos;
    window.MESES = eventData.MESES;
    window.calendarData = calData;
    iniciar();
  })
  .catch(err => {
    console.error('Error loading JSON files:', err);
    window.eventos = [];
    window.MESES = [];
    window.calendarData = {};
    iniciar();
  });
});

function iniciar() {
  asignarEventos();
  actualizarVista();
  if (typeof actualizarIcono === "function") {
    actualizarIcono();
  }
}

function asignarEventos() {
  const controles = document.querySelectorAll(
    '#filtro-busqueda, #filtro-categoria, #filtro-fecha, #filtro-dia, #filtro-mes, #filtro-ano'
  );
  controles.forEach(ctrl => {
    ctrl.addEventListener('change', actualizarVista);
    ctrl.addEventListener('input', actualizarVista);
  });
  document.getElementById('borrar-rango-fecha').addEventListener('click', () => {
    if (document.getElementById('filtro-rango-fecha')._flatpickr) {
      document.getElementById('filtro-rango-fecha')._flatpickr.clear();
    }
    actualizarVista();
  });
  document.getElementById('borrar-fecha').addEventListener('click', () => {
    document.getElementById('filtro-fecha').value = '';
    actualizarVista();
  });
  document.getElementById('borrar-dia').addEventListener('click', () => {
    document.getElementById('filtro-dia').value = '';
    actualizarVista();
  });
  document.getElementById('borrar-mes').addEventListener('click', () => {
    document.getElementById('filtro-mes').value = '';
    actualizarVista();
  });
  document.getElementById('borrar-ano').addEventListener('click', () => {
    document.getElementById('filtro-ano').value = '';
    actualizarVista();
  });
  document.getElementById('botonQuitarFiltros').addEventListener('click', resetearFiltros);
  document.getElementById('botonModo').addEventListener('click', toggleModo);
  document.addEventListener('keydown', manejarAtajos);
}

// Función updateLanguage, se asume que se invoca desde lang.js.
function updateLanguage(newLang) {
  currentLang = newLang;
  localStorage.setItem('lang', currentLang);
  updateTranslations();
  renderCalendarContent(currentLang);
  const event = new Event("langChanged");
  document.dispatchEvent(event);
  if (typeof actualizarVista === 'function') {
    actualizarVista();
  }
}

// Suscribirse al evento "langChanged" para actualizar la interfaz
document.addEventListener("langChanged", function() {
  renderCalendarContent(currentLang);
});