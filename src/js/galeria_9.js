// Raíz del sitio: '/' en producción; calculada desde la ruta de la página
// para soportar servir la web desde un subdirectorio (p. ej. Live Server
// sirviendo la raíz del repo con el sitio en /dist/). Elimina el nombre de
// archivo y el segmento va/ final de la ruta actual.
window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/[^/]*$/, '').replace(/(^|\/)va\/$/, '$1');

// js/galeria_9.js — Fallera Mayor Infantil 2026-27
//
// Mismo bloc de notas que galeria_1-8 con un MODO ÁLBUM (v4.24.0): a partir
// de 1200px (.notepad--album) se muestran DOS páginas a la vez, izquierda y
// derecha, como un álbum de fotos abierto; los botones pasan de dos en dos y
// el indicador usa la clave notepad.indicadorRango. Por debajo de 1200px el
// comportamiento es idéntico al de las demás galerías (una página).
// Cada foto sigue siendo un <article class="notepad__page"> con su <img>:
// es el contrato que espera fullscreen.js para ampliarlas.

// Selección de elementos
const notepad = document.querySelector(".notepad");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const indicator = document.querySelector(".notepad__indicator");

// Media query del modo álbum (debe coincidir con el breakpoint de _visor.scss)
const mqAlbum = window.matchMedia("(min-width: 1200px)");

// Variables de estado
let currentPage = 0;
let isAnimating = false;
let pages = []; // Almacenará los <article> generados

// Páginas visibles a la vez: 2 en modo álbum, 1 en el resto
function porVista() {
  return notepad && notepad.classList.contains("notepad--album") && mqAlbum.matches ? 2 : 1;
}

// Primera página de la vista que contiene el índice dado (par en modo álbum)
function alinear(index) {
  const n = porVista();
  return Math.max(0, Math.min(pages.length - 1, index - (index % n)));
}

// 1. Cargar JSON y crear páginas
async function loadPages() {
  try {
    const response = await fetch(window.SITE_ROOT + "data/dataPages9.json");
    if (!response.ok) throw new Error("No se pudo cargar dataPages9.json");
    const data = await response.json();
    createPages(data);
    updateUI();
    // Actualizamos las traducciones en los elementos recién creados
    updateTranslations();
  } catch (error) {
    console.error(error);
  }
}

// Resuelve las rutas de imagen del JSON (relativas a la raíz del sitio, tipo
// "img/...") con SITE_ROOT: en /va/ una ruta relativa cruda apuntaba a
// va/img/... (404 en local, 301 en producción por la regla A2 del .htaccess).
function resolveImageUrl(url) {
  if (!url || /^(?:[a-z]+:|\/|\.\.?\/|#)/i.test(url)) return url;
  return window.SITE_ROOT + url;
}

// 2. Generar las páginas en el DOM a partir del array "data"
function createPages(dataPages) {
  const navigation = document.querySelector(".notepad__navigation");
  dataPages.forEach((item) => {
    const article = document.createElement("article");
    article.classList.add("notepad__page");
    article.setAttribute("aria-hidden", "true");

    // Asigna data-i18n al caption si "note" contiene una clave
    article.innerHTML = `
      <img src="${resolveImageUrl(item.src)}" alt="${item.alt}" loading="lazy" decoding="async" />
      <div class="notepad__caption" ${item.note ? `data-i18n="${item.note}"` : ""}></div>
    `;

    // Insertamos antes de la navegación
    notepad.insertBefore(article, navigation);
    pages.push(article);
  });
  // Las dos primeras páginas se cargan de inmediato (son las visibles)
  pages.slice(0, 2).forEach((pg) => pg.querySelector("img").removeAttribute("loading"));
}

// 3. Mostrar la vista que empieza en el índice actual (1 o 2 páginas)
function showPage(index) {
  pages.forEach((pg) => {
    pg.classList.remove(
      "notepad__page--active",
      "notepad__page--derecha",
      "notepad__page--flip-forward",
      "notepad__page--flip-back"
    );
    pg.setAttribute("aria-hidden", "true");
    pg.style.zIndex = "2";
  });
  const visibles = pages.slice(index, index + porVista());
  visibles.forEach((pg, i) => {
    pg.classList.add("notepad__page--active");
    if (i === 1) pg.classList.add("notepad__page--derecha");
    pg.setAttribute("aria-hidden", "false");
    pg.style.zIndex = "3";
  });
  // Precarga de la siguiente vista para que el paso de hoja no muestre huecos
  pages.slice(index + porVista(), index + porVista() * 2).forEach((pg) => {
    pg.querySelector("img").removeAttribute("loading");
  });
}

// 4. Actualizar la interfaz (botones e indicador)
function updateUI() {
  currentPage = alinear(currentPage);
  showPage(currentPage);
  const n = porVista();
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage + n >= pages.length;
  // translate() devuelve la propia clave si las traducciones aún no han
  // cargado: usamos un formato neutro hasta que llegue translationsReady.
  if (n === 2 && currentPage + 1 < pages.length) {
    const desde = currentPage + 1;
    const hasta = currentPage + 2;
    const raw = translate("notepad.indicadorRango"); // "Páginas {from}-{to} de {total}"
    indicator.textContent = raw === "notepad.indicadorRango"
      ? `${desde}-${hasta} / ${pages.length}`
      : raw.replace("{from}", desde).replace("{to}", hasta).replace("{total}", pages.length);
  } else {
    const raw = translate("notepad.indicator"); // "Página {current} de {total}"
    indicator.textContent = raw === "notepad.indicator"
      ? `${currentPage + 1} / ${pages.length}`
      : raw.replace("{current}", currentPage + 1).replace("{total}", pages.length);
  }
}

// Espera al final de la transición de una página (con respaldo por si no llega)
function alTerminar(pg, fn) {
  let hecho = false;
  const done = () => { if (hecho) return; hecho = true; fn(); };
  pg.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 600);
}

// 5. Avanzar con animación: en modo álbum gira la hoja derecha sobre el lomo
function nextPage() {
  const n = porVista();
  if (isAnimating || currentPage + n >= pages.length) return;
  isAnimating = true;
  const hoja = pages[Math.min(currentPage + n - 1, pages.length - 1)];
  hoja.classList.add("notepad__page--flip-forward");
  alTerminar(hoja, () => {
    currentPage += n;
    updateUI();
    isAnimating = false;
  });
}

// 6. Retroceder con animación: gira la hoja izquierda hacia atrás
function prevPage() {
  if (isAnimating || currentPage <= 0) return;
  isAnimating = true;
  const hoja = pages[currentPage];
  hoja.classList.add("notepad__page--flip-back");
  alTerminar(hoja, () => {
    currentPage -= porVista();
    updateUI();
    isAnimating = false;
  });
}

// Eventos de los botones
prevBtn.addEventListener("click", prevPage);
nextBtn.addEventListener("click", nextPage);

// Al cruzar el breakpoint del álbum se realinea la vista (sin hoja huérfana)
mqAlbum.addEventListener("change", () => {
  if (pages.length) updateUI();
});

// Re-render del indicador al cargar las traducciones y en cada cambio de
// idioma (lang.js dispara translationsReady en ambos casos).
document.addEventListener("translationsReady", () => {
  if (pages.length) updateUI();
});

// 7. Vídeo de la proclamación: botón "Ampliar" con la Fullscreen API nativa
// (webkitEnterFullscreen es la única vía en iPhone Safari). Solo se encadena
// .catch si la llamada devuelve promesa (la API prefijada devuelve undefined).
(function initVideoAmpliar() {
  const video = document.getElementById("galeriaVideo");
  const boton = document.getElementById("galeriaVideoAmpliar");
  if (!video || !boton) return;
  const puede = video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
  if (!puede) {
    boton.hidden = true;
    return;
  }
  boton.addEventListener("click", () => {
    const fn = video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
    try {
      const r = fn.call(video);
      if (r && typeof r.catch === "function") r.catch(() => {});
    } catch (e) {
      /* pantalla completa no disponible: los controles nativos siguen operativos */
    }
  });
})();

// Iniciar todo
loadPages();
