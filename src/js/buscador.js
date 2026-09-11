// js/buscador.js
// Buscador general v1 (v4.29.0): panel desplegable bajo la barra, abierto con un
// botón lupa + «Buscar» que este script crea en .header__botones (mismo patrón
// que el toggle del menú en nav-menu.js). El índice es un JSON estático que
// genera el build (gulpfile.js → buildSearchIndex) y cuya URL versionada viene
// en <meta name="search-index">. Se descarga solo al abrir el panel (o al
// pasar el ratón / enfocar el botón). Sin dependencias.
//
// La lógica de relevancia (normalizar, tokenizar, buscar) se expone en
// window.FallaBuscador para que scripts/search-eval.mjs y los tests la reutilicen.
(function () {
  'use strict';

  // ---------- Normalización y relevancia (sin DOM) ----------
  var STOP = ['de', 'del', 'la', 'el', 'los', 'las', 'les', 'els', 'i', 'y', 'en', 'a', 'per', 'para', 'un', 'una', 'the'];

  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')   // tildes y diéresis (Suïssa → suissa)
      .replace(/·/g, '')                 // col·laboracions → collaboracions
      .replace(/[’'`´]/g, ' ')           // l'alqueria → l alqueria
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function tokenizar(texto) {
    return normalizar(texto).split(' ').filter(function (t) {
      return t.length >= 2 && STOP.indexOf(t) === -1;
    });
  }

  // Variantes de un token: singular simple ("llibrets" → "llibret")
  function variantes(tok) {
    var v = [tok];
    if (tok.length > 4 && /s$/.test(tok) && !/ss$/.test(tok)) v.push(tok.slice(0, -1));
    if (tok.length > 5 && /es$/.test(tok)) v.push(tok.slice(0, -2));
    return v;
  }

  function prepararRegistro(r) {
    if (r._prep) return r;
    r._t = [normalizar(r.titulo.es), normalizar(r.titulo.va)];
    r._tw = r._t.map(function (t) { return t.split(' '); });
    r._d = [normalizar(r.desc.es), normalizar(r.desc.va)];
    r._kw = (r.kw || []).map(normalizar);
    r._prep = true;
    return r;
  }

  function esPasado(r, hoy) {
    var limite = r.hasta || (r.tipo === 'evento' ? r.fecha : '');
    return Boolean(limite) && limite < hoy;
  }

  // Puntuación explicable: frase exacta en título 10 · token en título 5 ·
  // palabra clave 4 · prefijo en título 3 · token en descripción 1 · todos los
  // tokens +3 · año/ejercicio de la consulta +6 · pasado −4 (salvo año explícito).
  function puntuar(r, q, hoy) {
    prepararRegistro(r);
    var score = 0;
    var hits = 0;
    if (q.norm.length >= 3 && (r._t[0].indexOf(q.norm) !== -1 || r._t[1].indexOf(q.norm) !== -1)) score += 10;
    q.tokens.forEach(function (tok) {
      var hit = false;
      var vs = variantes(tok);
      var esAnio = /^20\d{2}$/.test(tok);
      if (r._tw.some(function (ws) { return vs.some(function (v) { return ws.indexOf(v) !== -1; }); })) { score += 5; hit = true; }
      else if (r._kw.some(function (k) { return vs.some(function (v) { return k === v || k.split(' ').indexOf(v) !== -1; }); })) { score += 4; hit = true; }
      else if (tok.length >= 3 && r._tw.some(function (ws) { return ws.some(function (w) { return vs.some(function (v) { return w.indexOf(v) === 0; }); }); })) { score += 3; hit = true; }
      else if (tok.length >= 4 && r._kw.some(function (k) { return k.indexOf(tok) !== -1; })) { score += 2; hit = true; }
      else if (r._d.some(function (d) { return vs.some(function (v) { return (' ' + d + ' ').indexOf(' ' + v) !== -1; }); })) { score += 1; hit = true; }
      else if (esAnio && (r.ejercicio.indexOf(tok) !== -1 || String(r.fecha || '').indexOf(tok) === 0)) { score += 2; hit = true; }
      // Palabra clave editorial: refuerzo adicional aunque el título ya coincida
      if (hit && r._kw.length && r._kw.some(function (k) { return vs.some(function (v) { return k === v; }); })) score += 2;
      if (hit) hits += 1;
    });
    if (!hits) return 0;
    if (q.tokens.length > 1 && hits === q.tokens.length) score += 3;
    if (q.anio && (r.ejercicio.indexOf(q.anio) !== -1 || String(r.fecha || '').indexOf(q.anio) === 0)) score += 6;
    if (!q.anio && esPasado(r, hoy)) score -= 4;
    return score;
  }

  function prepararConsulta(texto) {
    var norm = normalizar(texto);
    var tokens = tokenizar(texto);
    var anio = '';
    var m = norm.match(/\b(20\d{2})(?:-(\d{2}))?\b/);
    if (m) anio = m[1];
    return { norm: norm, tokens: tokens, anio: anio };
  }

  // Devuelve [{ registro, score }] ordenado de forma estable: score, prio, título ES
  function buscar(registros, texto, opciones) {
    var opts = opciones || {};
    var hoy = opts.hoy || new Date().toISOString().slice(0, 10);
    var q = prepararConsulta(texto);
    if (!q.tokens.length) return [];
    var out = [];
    registros.forEach(function (r) {
      var s = puntuar(r, q, hoy);
      if (s > 0) out.push({ registro: r, score: s, pasado: esPasado(r, hoy) });
    });
    out.sort(function (a, b) {
      // Desempate: prioridad por tipo, ejercicio más reciente primero, título ES
      return b.score - a.score || a.registro.prio - b.registro.prio
        || String(b.registro.ejercicio).localeCompare(String(a.registro.ejercicio))
        || a.registro.titulo.es.localeCompare(b.registro.titulo.es, 'es');
    });
    return out;
  }

  var API = { normalizar: normalizar, tokenizar: tokenizar, buscar: buscar, esPasado: esPasado };
  if (typeof window !== 'undefined') window.FallaBuscador = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  // ---------- Interfaz ----------
  window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/[^/]*$/, '').replace(/(^|\/)va\/$/, '$1');

  // Textos de reserva (= valor ES de translations.json → buscador.*)
  var FALLBACK = {
    abrir: 'Buscar', cerrar: 'Cerrar buscador', etiqueta: 'Buscar en la web', placeholder: 'Escribe qué buscas…',
    borrar: 'Borrar la búsqueda', ayuda: 'Para filtrar los actos por día o categoría usa el', ayudaEnlace: 'calendario',
    ejemplosTitulo: 'Prueba con:', ejemplos: ['Ofrenda 2026', 'autorización menores', 'galería Cremà', 'calendario'],
    minimo: 'Escribe al menos 2 letras.', cargando: 'Cargando el índice…', resultados: '{n} resultados', resultado: '1 resultado',
    sinResultados: 'Sin coincidencias para «{q}».', sinResultadosAyuda: 'Revisa la ortografía o prueba con una de estas búsquedas:',
    error: 'No se ha podido cargar el buscador.', reintentar: 'Reintentar', verGalerias: 'Ver todas las galerías',
    mostrarMas: 'Mostrar más resultados', pasado: 'Pasado',
    tipo: { pagina: 'Página', seccion: 'Sección', galeria: 'Galería', post: 'Blog', evento: 'Evento', anuncio: 'Anuncio', documento: 'Documento', formulario: 'Formulario', legal: 'Legal' }
  };
  var POR_PAGINA = 10;
  var MIN_LETRAS = 2;

  function idioma() {
    if (window.currentLanguage === 'va' || window.currentLanguage === 'es') return window.currentLanguage;
    return document.documentElement.lang === 'ca' ? 'va' : 'es';
  }

  function leer(obj, ruta) {
    return ruta.split('.').reduce(function (o, k) { return o && o[k] !== undefined ? o[k] : undefined; }, obj);
  }

  function t(clave) {
    var tabla = window.translations && window.translations[idioma()];
    var v = tabla ? leer(tabla, 'buscador.' + clave) : undefined;
    if (v === undefined && window.translations && window.translations.es) v = leer(window.translations.es, 'buscador.' + clave);
    if (v === undefined) v = leer(FALLBACK, clave);
    return v;
  }

  function nombreSeccion(clave) {
    if (!clave) return '';
    var tabla = window.translations && window.translations[idioma()];
    return (tabla && leer(tabla, 'nav.' + clave)) || '';
  }

  function guardarConsulta(q) {
    try { sessionStorage.setItem('buscadorQuery', q); } catch (e) { /* Safari privado */ }
  }
  function leerConsulta() {
    try { return sessionStorage.getItem('buscadorQuery') || ''; } catch (e) { return ''; }
  }

  // URL de destino: páginas con variante /va/; wrappers PDF y llibret solo en raíz
  function resolverUrl(url) {
    var raiz = window.SITE_ROOT;
    if (/^pdf\//.test(url) || /^llibret_/.test(url)) return raiz + url;
    return raiz + (idioma() === 'va' ? 'va/' : '') + url;
  }

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init() {
    var headerBar = document.querySelector('.header__barra, .header-inner__barra');
    var botones = headerBar && headerBar.querySelector('.header__botones');
    var meta = document.querySelector('meta[name="search-index"]');
    if (!headerBar || !botones || !meta) return;
    if (headerBar.querySelector('.header__search-toggle')) return;

    var indiceUrl = window.SITE_ROOT + meta.getAttribute('content');
    var registros = null;
    var cargando = null;
    var mostrados = POR_PAGINA;
    var ultimaConsulta = '';
    var debounce = null;

    // Botón lupa + «Buscar»
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'header__search-toggle';
    toggle.setAttribute('aria-controls', 'siteSearch');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.8-3.8"></path></svg>' +
      '<span class="header__search-toggle-texto"></span>';
    botones.appendChild(toggle);

    // Panel
    var panel = document.createElement('div');
    panel.className = 'buscador';
    panel.id = 'siteSearch';
    panel.setAttribute('role', 'search');
    panel.hidden = true;
    panel.inert = true;
    panel.innerHTML =
      '<div class="buscador__cabecera">' +
      '  <label class="buscador__etiqueta" for="siteSearchInput"></label>' +
      '  <button type="button" class="buscador__cerrar" aria-label=""><span aria-hidden="true">&times;</span></button>' +
      '</div>' +
      '<div class="buscador__campo">' +
      '  <input id="siteSearchInput" class="buscador__input" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
      '  <button type="button" class="buscador__borrar" aria-label="" hidden><span aria-hidden="true">&times;</span></button>' +
      '</div>' +
      '<p class="buscador__ayuda"><span class="buscador__ayuda-texto"></span> <a class="buscador__ayuda-enlace" href="#"></a>.</p>' +
      '<p class="buscador__estado sr-only" aria-live="polite" aria-atomic="true"></p>' +
      '<div class="buscador__cuerpo" data-estado="inicial"></div>';
    headerBar.appendChild(panel);

    var input = panel.querySelector('.buscador__input');
    var cuerpo = panel.querySelector('.buscador__cuerpo');
    var estado = panel.querySelector('.buscador__estado');
    var borrar = panel.querySelector('.buscador__borrar');
    var cerrar = panel.querySelector('.buscador__cerrar');

    function pintarTextos() {
      toggle.querySelector('.header__search-toggle-texto').textContent = t('abrir');
      toggle.setAttribute('aria-label', t(abierto() ? 'cerrar' : 'abrir'));
      panel.querySelector('.buscador__etiqueta').textContent = t('etiqueta');
      input.placeholder = t('placeholder');
      borrar.setAttribute('aria-label', t('borrar'));
      cerrar.setAttribute('aria-label', t('cerrar'));
      panel.querySelector('.buscador__ayuda-texto').textContent = t('ayuda');
      var enlace = panel.querySelector('.buscador__ayuda-enlace');
      enlace.textContent = t('ayudaEnlace');
      enlace.href = resolverUrl('calendario.html');
    }

    function abierto() { return !panel.hidden; }

    function setEstado(nombre) {
      cuerpo.setAttribute('data-estado', nombre);
    }

    function anunciar(texto) {
      estado.textContent = '';
      window.setTimeout(function () { estado.textContent = texto; }, 30);
    }

    function ejemplosHtml() {
      var lista = t('ejemplos') || [];
      return '<p class="buscador__ejemplos-titulo">' + escapar(t('ejemplosTitulo')) + '</p>' +
        '<ul class="buscador__ejemplos">' + lista.map(function (e) {
          return '<li><button type="button" class="buscador__ejemplo" data-consulta="' + escapar(e) + '">' + escapar(e) + '</button></li>';
        }).join('') + '</ul>';
    }

    function pintarInicial() {
      setEstado('inicial');
      cuerpo.innerHTML = ejemplosHtml();
    }

    function pintarMinimo() {
      setEstado('minimo');
      cuerpo.innerHTML = '<p class="buscador__mensaje">' + escapar(t('minimo')) + '</p>';
    }

    function pintarCargando() {
      setEstado('cargando');
      cuerpo.innerHTML = '<p class="buscador__mensaje">' + escapar(t('cargando')) + '</p>';
    }

    function pintarError() {
      setEstado('error');
      cuerpo.innerHTML = '<p class="buscador__mensaje buscador__mensaje--error">' + escapar(t('error')) + '</p>' +
        '<p class="buscador__acciones"><button type="button" class="buscador__reintentar">' + escapar(t('reintentar')) + '</button> ' +
        '<a class="buscador__enlace-secundario" href="' + escapar(resolverUrl('calendario.html')) + '">' + escapar(t('ayudaEnlace')) + '</a></p>';
      anunciar(t('error'));
    }

    function pintarVacio(q) {
      setEstado('vacio');
      cuerpo.innerHTML = '<p class="buscador__mensaje">' + escapar(t('sinResultados').replace('{q}', q)) + '</p>' +
        '<p class="buscador__mensaje-secundario">' + escapar(t('sinResultadosAyuda')) + '</p>' + ejemplosHtml() +
        '<p class="buscador__acciones"><a class="buscador__enlace-secundario" href="' + escapar(resolverUrl('galerias.html')) + '">' + escapar(t('verGalerias')) + '</a></p>';
      anunciar(t('sinResultados').replace('{q}', q));
    }

    function pintarResultados(resultados, q) {
      setEstado('resultados');
      var lang = idioma();
      var visibles = resultados.slice(0, mostrados);
      var html = '<ol class="buscador__lista">' + visibles.map(function (res, i) {
        var r = res.registro;
        var titulo = r.titulo[lang] || r.titulo.es;
        var desc = r.desc[lang] || r.desc.es || '';
        var chips = '<span class="buscador__chip buscador__chip--tipo">' + escapar(t('tipo.' + r.tipo) || r.tipo) + '</span>';
        var sec = nombreSeccion(r.seccion);
        // Sin chip de sección si repite el tipo ("Galería · Galería")
        if (sec && sec.toLowerCase() !== String(t('tipo.' + r.tipo) || '').toLowerCase()) chips += '<span class="buscador__chip">' + escapar(sec) + '</span>';
        if (r.ejercicio) chips += '<span class="buscador__chip">' + escapar(r.ejercicio) + '</span>';
        else if (r.fecha) chips += '<span class="buscador__chip">' + escapar(r.fecha) + '</span>';
        if (res.pasado) chips += '<span class="buscador__chip buscador__chip--pasado">' + escapar(t('pasado')) + '</span>';
        return '<li class="buscador__item">' +
          '<a class="buscador__resultado" href="' + escapar(resolverUrl(r.url)) + '" data-id="' + escapar(r.id) + '" data-pos="' + (i + 1) + '">' +
          '<span class="buscador__titulo">' + escapar(titulo) + '</span>' +
          (desc ? '<span class="buscador__desc">' + escapar(desc.length > 140 ? desc.slice(0, 137) + '…' : desc) + '</span>' : '') +
          '<span class="buscador__chips">' + chips + '</span>' +
          '</a></li>';
      }).join('') + '</ol>';
      if (resultados.length > mostrados) {
        html += '<p class="buscador__acciones"><button type="button" class="buscador__mas">' + escapar(t('mostrarMas')) + ' (' + (resultados.length - mostrados) + ')</button></p>';
      }
      cuerpo.innerHTML = html;
      anunciar(resultados.length === 1 ? t('resultado') : String(t('resultados')).replace('{n}', resultados.length));
      void q;
    }

    function cargarIndice() {
      if (registros) return Promise.resolve(registros);
      if (cargando) return cargando;
      cargando = fetch(indiceUrl, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          registros = Array.isArray(data.registros) ? data.registros : [];
          return registros;
        })
        .catch(function (err) {
          cargando = null;
          throw err;
        });
      return cargando;
    }

    function ejecutar(texto, reiniciar) {
      var q = String(texto || '').trim();
      ultimaConsulta = q;
      if (reiniciar !== false) mostrados = POR_PAGINA;
      borrar.hidden = q.length === 0;
      guardarConsulta(q);
      if (!q) { pintarInicial(); return; }
      if (q.length < MIN_LETRAS) { pintarMinimo(); return; }
      if (!registros) pintarCargando();
      cargarIndice().then(function (regs) {
        if (q !== ultimaConsulta) return;
        var resultados = buscar(regs, q);
        if (!resultados.length) pintarVacio(q);
        else pintarResultados(resultados, q);
      }).catch(function () {
        if (q === ultimaConsulta) pintarError();
      });
    }

    function abrir() {
      if (abierto()) return;
      document.dispatchEvent(new CustomEvent('buscador:open'));
      panel.hidden = false;
      panel.inert = false;
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', t('cerrar'));
      var previa = leerConsulta();
      if (previa && !input.value) input.value = previa;
      ejecutar(input.value);
      input.focus({ preventScroll: true });
      cargarIndice().catch(function () { /* se pinta al buscar */ });
    }

    function cerrarPanel(devolverFoco) {
      if (!abierto()) return;
      panel.classList.remove('is-open');
      panel.hidden = true;
      panel.inert = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', t('abrir'));
      if (devolverFoco) toggle.focus({ preventScroll: true });
    }

    // Eventos
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (abierto()) cerrarPanel(true); else abrir();
    });
    ['pointerenter', 'focus'].forEach(function (ev) {
      toggle.addEventListener(ev, function () { cargarIndice().catch(function () {}); }, { once: true });
    });
    cerrar.addEventListener('click', function () { cerrarPanel(true); });
    borrar.addEventListener('click', function () {
      input.value = '';
      ejecutar('');
      input.focus();
    });
    input.addEventListener('input', function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(function () { ejecutar(input.value); }, 150);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); window.clearTimeout(debounce); ejecutar(input.value); }
      if (e.key === 'ArrowDown') {
        var primero = cuerpo.querySelector('.buscador__resultado, .buscador__ejemplo');
        if (primero) { e.preventDefault(); primero.focus(); }
      }
    });
    cuerpo.addEventListener('click', function (e) {
      var target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      var ejemplo = target.closest('.buscador__ejemplo');
      if (ejemplo) { input.value = ejemplo.getAttribute('data-consulta') || ''; ejecutar(input.value); input.focus(); return; }
      if (target.closest('.buscador__mas')) { mostrados += POR_PAGINA; ejecutar(ultimaConsulta, false); return; }
      if (target.closest('.buscador__reintentar')) { registros = null; cargando = null; ejecutar(ultimaConsulta); return; }
      if (target.closest('.buscador__resultado')) cerrarPanel(false);
    });
    cuerpo.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var focusables = Array.prototype.slice.call(cuerpo.querySelectorAll('.buscador__resultado, .buscador__ejemplo, .buscador__mas'));
      var i = focusables.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      if (e.key === 'ArrowUp' && i === 0) { input.focus(); return; }
      var siguiente = focusables[i + (e.key === 'ArrowDown' ? 1 : -1)];
      if (siguiente) siguiente.focus();
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); cerrarPanel(true); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && abierto()) cerrarPanel(true);
    });
    // Se comprueba la ruta del evento, no e.target: el handler de `cuerpo` ya se
    // ha ejecutado y ha repintado los resultados, así que el botón pulsado
    // (ejemplo, «Mostrar más», reintentar) ya no está en el DOM y
    // panel.contains(target) cerraba el panel indebidamente.
    function clicDentro(e) {
      var ruta = typeof e.composedPath === 'function' ? e.composedPath() : [];
      if (ruta.indexOf(panel) !== -1 || ruta.indexOf(toggle) !== -1) return true;
      var target = e.target instanceof Element ? e.target : null;
      return !!target && (panel.contains(target) || toggle.contains(target));
    }
    document.addEventListener('click', function (e) {
      if (!abierto()) return;
      if (clicDentro(e)) return;
      cerrarPanel(false);
    });
    document.addEventListener('nav:open', function () { cerrarPanel(false); });
    // Solo se cierra si cambia el ANCHO: el teclado virtual de móvil o un cambio
    // de alto de la ventana disparan resize y cerraban el panel nada más enfocar.
    var anchoPrevio = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === anchoPrevio) return;
      anchoPrevio = window.innerWidth;
      if (abierto()) cerrarPanel(false);
    });
    document.addEventListener('translationsReady', function () { pintarTextos(); if (abierto()) ejecutar(ultimaConsulta, false); else pintarInicial(); });
    document.addEventListener('langChanged', function () { pintarTextos(); if (abierto()) ejecutar(ultimaConsulta, false); else pintarInicial(); });

    pintarTextos();
    pintarInicial();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
