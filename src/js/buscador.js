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
  // v4.34.0: puntuación aditiva, raíces ES/VA, sinónimos, año dentro del
  // ejercicio, tolerancia a erratas y bigramas; los registros pasados nunca
  // desaparecen (el −4 es penalización, no filtro).
  var STOP = ['de', 'del', 'la', 'el', 'los', 'las', 'les', 'els', 'i', 'y', 'en', 'a', 'per', 'para', 'un', 'una', 'the'];

  // Sinónimos mínimos ES↔VA que no resuelven las raíces (formas ya normalizadas;
  // se aplican en ambos sentidos). Lo que comparte raíz (galería/galeries,
  // presidente/president, contacto/contacte, calendario/calendari) no hace falta.
  var SINONIMOS_BASE = [
    ['foto', 'imagen', 'imatge', 'fotografia'], ['video', 'vídeo'], ['mayor', 'major'], ['monumento', 'monument'],
    ['ofrenda', 'ofrena'], ['tiempo', 'temps', 'oratge', 'meteo'], ['evento', 'esdeveniment', 'acto', 'acte'],
    ['deporte', 'esport'], ['nino', 'xiquet'], ['nina', 'xiqueta'], ['ayuntamiento', 'ajuntament'],
    ['inscripcion', 'inscripcio'], ['autorizacion', 'autoritzacio'], ['boceto', 'esbos'], ['hoguera', 'foguera'],
    ['noche', 'nit'], ['ano', 'any'], ['sorteo', 'sorteig'], ['direccion', 'adreca'], ['mapa', 'ubicacion', 'ubicacio']
  ];
  var SINONIMOS = {};
  SINONIMOS_BASE.forEach(function (grupo) {
    grupo.forEach(function (a) {
      var na = normalizar(a);
      SINONIMOS[na] = grupo.map(normalizar).filter(function (b) { return b !== na; });
    });
  });

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

  function unicos(lista) {
    return lista.filter(function (x, i) { return x && lista.indexOf(x) === i; });
  }

  // Raíces de un token (se aplican a la consulta Y a las palabras del índice, así
  // singular/plural y género puntúan como palabra entera): plural -s/-es
  // (llibrets → llibret, representantes → representant) y vocal final de género
  // en palabras largas (fallera/fallero → faller, presidenta/presidente → president).
  function variantes(tok) {
    var v = [tok];
    var b = tok;
    if (b.length > 4 && /[^s]s$/.test(b)) { b = b.slice(0, -1); v.push(b); }
    if (tok.length > 5 && /es$/.test(tok)) v.push(tok.slice(0, -2));
    if (b.length > 6 && /[aeo]$/.test(b)) v.push(b.slice(0, -1));
    return unicos(v);
  }

  // Formas con las que un token de la consulta puede casar: sus raíces y las de sus sinónimos
  function formas(tok) {
    var out = variantes(tok);
    (SINONIMOS[tok] || []).forEach(function (s) { out = out.concat(variantes(s)); });
    return unicos(out);
  }

  function prepararRegistro(r) {
    if (r._prep) return r;
    r._t = [normalizar(r.titulo.es), normalizar(r.titulo.va)];
    r._tw = r._t.map(function (t) { return t.split(' ').filter(Boolean); });
    // Raíces de cada palabra del título (para casar plural/género como palabra entera)
    r._tv = r._tw.map(function (ws) { return unicos([].concat.apply([], ws.map(variantes))); });
    r._d = [normalizar(r.desc.es), normalizar(r.desc.va)];
    r._dv = r._d.map(function (d) { return unicos([].concat.apply([], d.split(' ').filter(Boolean).map(variantes))); });
    r._kw = (r.kw || []).map(normalizar);
    r._kwv = unicos([].concat.apply([], r._kw.map(function (k) { return [].concat.apply([], k.split(' ').map(variantes)); })));
    r._anios = aniosDe(r.ejercicio, r.fecha);
    r._prep = true;
    return r;
  }

  // Años que cubre un registro: los dos del ejercicio («2024-25» → 2024 y 2025) o el de la fecha
  function aniosDe(ejercicio, fecha) {
    var out = [];
    var m = String(ejercicio || '').match(/^(20\d{2})-(\d{2})$/);
    if (m) { out.push(m[1]); out.push(m[1].slice(0, 2) + m[2]); }
    var f = String(fecha || '').match(/^(20\d{2})/);
    if (f) out.push(f[1]);
    return unicos(out);
  }

  function enEjercicio(anio, ejercicio, fecha) {
    return Boolean(anio) && aniosDe(ejercicio, fecha).indexOf(anio) !== -1;
  }

  function esPasado(r, hoy) {
    var limite = r.hasta || (r.tipo === 'evento' ? r.fecha : '');
    return Boolean(limite) && limite < hoy;
  }

  // Vocabulario del índice (palabras de títulos y palabras clave) para corregir erratas
  function vocabulario(registros) {
    if (registros._vocab) return registros._vocab;
    var set = {};
    registros.forEach(function (r) {
      prepararRegistro(r);
      r._tw.forEach(function (ws) { ws.forEach(function (w) { set[w] = true; }); });
      r._kw.forEach(function (k) { k.split(' ').forEach(function (w) { if (w) set[w] = true; }); });
    });
    var lista = Object.keys(set).filter(function (w) { return w.length >= 4; });
    try { Object.defineProperty(registros, '_vocab', { value: lista, enumerable: false }); } catch (e) { /* array congelado */ }
    return lista;
  }

  // Distancia de Damerau-Levenshtein (transposiciones adyacentes) acotada
  function distancia(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev2 = null; var prev = []; var i; var j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      var mejor = i;
      for (j = 1; j <= b.length; j++) {
        var coste = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + coste);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
        if (v < mejor) mejor = v;
      }
      if (mejor > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }

  // Corrección de un token que no casa con nada: la palabra del vocabulario más
  // cercana (≤ 1 error; ≤ 2 a partir de 8 letras), sin cambiar la primera letra
  function corregir(tok, vocab) {
    if (tok.length < 5) return '';
    var max = tok.length >= 8 ? 2 : 1;
    var mejor = ''; var mejorD = max + 1;
    for (var i = 0; i < vocab.length; i++) {
      var w = vocab[i];
      if (w === tok || w[0] !== tok[0]) continue;
      var d = distancia(tok, w, max);
      if (d < mejorD || (d === mejorD && mejor && w.length < mejor.length)) { mejorD = d; mejor = w; }
    }
    return mejorD <= max ? mejor : '';
  }

  function contieneAlguna(lista, vs) {
    for (var i = 0; i < vs.length; i++) if (lista.indexOf(vs[i]) !== -1) return true;
    return false;
  }

  // Puntos de un token en un registro (aditivos, techo 9): palabra del título 5 ·
  // palabra clave 4 · prefijo en título (≥ 3 letras) 3 · palabra clave parcial
  // (≥ 4 letras) 2 · palabra de la descripción 1 · año del ejercicio/fecha 2
  function puntuarToken(r, tok, vs) {
    var p = 0;
    if (r._tv.some(function (ws) { return contieneAlguna(ws, vs); })) p += 5;
    if (contieneAlguna(r._kwv, vs)) p += 4;
    else if (tok.length >= 4 && r._kw.some(function (k) { return k.indexOf(tok) !== -1; })) p += 2;
    if (tok.length >= 3 && r._tw.some(function (ws) { return ws.some(function (w) { return vs.some(function (v) { return v.length >= 3 && w.indexOf(v) === 0 && w !== v; }); }); })) p += 3;
    if (r._dv.some(function (ws) { return contieneAlguna(ws, vs); })) p += 1;
    if (/^20\d{2}$/.test(tok) && r._anios.indexOf(tok) !== -1) p += 2;
    return Math.min(p, 9);
  }

  // Puntuación explicable: frase exacta en título 10 · puntos por token (ver
  // puntuarToken) · bigrama en el título +2 · todos los tokens +3 · año/ejercicio
  // de la consulta +6 · pasado −4 (salvo año explícito). Con errata, el token
  // corregido puntúa 2 puntos menos.
  function puntuar(r, q, hoy) {
    prepararRegistro(r);
    var score = 0;
    var hits = 0;
    var corregido = false;
    if (q.norm.length >= 3 && (r._t[0].indexOf(q.norm) !== -1 || r._t[1].indexOf(q.norm) !== -1)) score += 10;
    var usados = [];
    q.tokens.forEach(function (tok) {
      var p = puntuarToken(r, tok, q.formas[tok]);
      var efectivo = tok;
      if (!p && q.corr[tok]) {
        p = Math.max(0, puntuarToken(r, q.corr[tok], q.formas[q.corr[tok]]) - 2);
        if (p) { corregido = true; efectivo = q.corr[tok]; }
      }
      if (p) { hits += 1; score += p; }
      usados.push(p ? efectivo : '');
    });
    if (!hits) return null;
    // Bigrama: dos tokens seguidos de la consulta que van seguidos en el título (nombres, «san juan»)
    for (var i = 1; i < usados.length; i++) {
      if (!usados[i - 1] || !usados[i]) continue;
      var a = variantes(usados[i - 1]); var b = variantes(usados[i]);
      var hay = r._tw.some(function (ws) {
        for (var k = 1; k < ws.length; k++) {
          if (contieneAlguna(variantes(ws[k - 1]), a) && contieneAlguna(variantes(ws[k]), b)) return true;
        }
        return false;
      });
      if (hay) { score += 2; break; }
    }
    if (q.tokens.length > 1 && hits === q.tokens.length) score += 3;
    if (q.anio && r._anios.indexOf(q.anio) !== -1) score += 6;
    if (!q.anio && esPasado(r, hoy)) score -= 4;
    return { score: score, hits: hits, corregido: corregido };
  }

  function prepararConsulta(texto, vocab, opts) {
    var norm = normalizar(texto);
    var tokens = tokenizar(texto);
    var anio = '';
    var m = norm.match(/\b(20\d{2})\b/);
    if (m) anio = m[1];
    var q = { norm: norm, tokens: tokens, anio: anio, formas: {}, corr: {} };
    var conocidas = {};
    (vocab || []).forEach(function (w) { conocidas[w] = true; });
    tokens.forEach(function (tok) {
      q.formas[tok] = formas(tok);
      if (opts && opts.sinErratas) return;
      if (!vocab || tok.length < 5 || /^\d+$/.test(tok)) return;
      var yaConocida = q.formas[tok].some(function (f) { return conocidas[f]; });
      if (yaConocida) return;
      var c = corregir(tok, vocab);
      if (c) { q.corr[tok] = c; q.formas[c] = formas(c); }
    });
    return q;
  }

  // Devuelve [{ registro, score, pasado, corregido }] ordenado de forma estable:
  // score, prio, ejercicio reciente, título ES. La lista lleva además
  // `.consulta` ({ tokens, anio, corr }) para que la interfaz muestre las erratas corregidas.
  function buscar(registros, texto, opciones) {
    var opts = opciones || {};
    var hoy = opts.hoy || new Date().toISOString().slice(0, 10);
    var vocab = opts.sinErratas ? null : vocabulario(registros);
    var q = prepararConsulta(texto, vocab, opts);
    var out = [];
    if (!q.tokens.length) { out.consulta = q; return out; }
    registros.forEach(function (r) {
      var res = puntuar(r, q, hoy);
      if (res) out.push({ registro: r, score: res.score, pasado: esPasado(r, hoy), corregido: res.corregido });
    });
    out.sort(function (a, b) {
      return b.score - a.score || a.registro.prio - b.registro.prio
        || String(b.registro.ejercicio).localeCompare(String(a.registro.ejercicio))
        || a.registro.titulo.es.localeCompare(b.registro.titulo.es, 'es');
    });
    out.consulta = q;
    return out;
  }

  var API = { normalizar: normalizar, tokenizar: tokenizar, variantes: variantes, enEjercicio: enEjercicio, distancia: distancia, corregir: corregir, vocabulario: vocabulario, buscar: buscar, esPasado: esPasado };
  if (typeof window !== 'undefined') window.FallaBuscador = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  // ---------- Interfaz ----------
  // v4.35.0: resaltado de coincidencias, patrón combobox/listbox con
  // aria-activedescendant, Enter abre el resultado activo, «Mostrar más» sin
  // perder el foco, anuncios completos en aria-live, altura por visualViewport
  // en móvil, espera tras un error de red y validación del esquema de las URL.
  window.SITE_ROOT = window.SITE_ROOT || window.location.pathname.replace(/[^/]*$/, '').replace(/(^|\/)va\/$/, '$1');

  // Textos de reserva (= valor ES de translations.json → buscador.*) y los
  // visibles del botón/panel en VA para el primer pintado en /va/ (evita el
  // parpadeo en castellano antes de que carguen las traducciones)
  var FALLBACK = {
    abrir: 'Buscar', cerrar: 'Cerrar buscador', etiqueta: 'Buscar en la web', placeholder: 'Escribe qué buscas…',
    borrar: 'Borrar la búsqueda', ayuda: 'Para filtrar los actos por día o categoría usa el', ayudaEnlace: 'calendario',
    ejemplosTitulo: 'Prueba con:', ejemplos: ['Ofrenda 2026', 'autorización menores', 'galería Cremá', 'calendario'],
    minimo: 'Escribe al menos 2 letras.', cargando: 'Cargando el índice…', resultados: '{n} resultados', resultado: '1 resultado',
    resultadosPara: '{n} resultados para «{q}»', resultadoPara: '1 resultado para «{q}»', corregido: 'Mostrando resultados para «{q}»',
    listaAria: 'Resultados de la búsqueda',
    sinResultados: 'Sin coincidencias para «{q}».', sinResultadosAyuda: 'Revisa la ortografía o prueba con una de estas búsquedas:',
    error: 'No se ha podido cargar el buscador.', reintentar: 'Reintentar', verGalerias: 'Ver todas las galerías',
    mostrarMas: 'Mostrar más resultados', pasado: 'Pasado',
    tipo: { pagina: 'Página', seccion: 'Sección', galeria: 'Galería', post: 'Blog', evento: 'Evento', anuncio: 'Anuncio', documento: 'Documento', formulario: 'Formulario', legal: 'Legal', persona: 'Persona' }
  };
  var FALLBACK_VA = { abrir: 'Cercar', cerrar: 'Tancar cercador', etiqueta: 'Cercar en la web', placeholder: 'Escriu què busques…', borrar: 'Esborrar la cerca' };
  var POR_PAGINA = 10;
  var MIN_LETRAS = 2;
  var ESPERA_TRAS_ERROR = 3000;

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
    if (v === undefined && !window.translations && idioma() === 'va') v = FALLBACK_VA[clave];
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

  // URL de destino: páginas con variante /va/; los PDF reales solo en raíz. Se
  // rechaza cualquier esquema (javascript:, http:…): el índice solo trae rutas relativas.
  function resolverUrl(url) {
    var u = String(url || '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '#';
    var raiz = window.SITE_ROOT;
    if (/^pdf\//.test(u)) return raiz + u;
    return raiz + (idioma() === 'va' ? 'va/' : '') + u;
  }

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- Resaltado: <mark> sobre las palabras que casan (raíces y sinónimos incluidos) ----
  // Devuelve HTML escapado; `formas` son las raíces normalizadas de la consulta.
  function resaltar(texto, formas) {
    var partes = String(texto || '').split(/(\s+)/);
    return partes.map(function (parte) {
      if (!parte || /^\s+$/.test(parte)) return escapar(parte);
      var norm = normalizar(parte);
      var propias = variantes(norm);
      var casa = formas.some(function (f) {
        return f.length >= 2 && (propias.indexOf(f) !== -1 || (f.length >= 3 && norm.indexOf(f) === 0));
      });
      return casa ? '<mark class="buscador__mark">' + escapar(parte) + '</mark>' : escapar(parte);
    }).join('');
  }

  // Ventana de la descripción alrededor de la primera coincidencia (≈140 caracteres)
  function ventana(desc, formas) {
    var texto = String(desc || '');
    var MAX = 140;
    if (texto.length <= MAX) return texto;
    var palabras = texto.split(' ');
    var idx = -1;
    for (var i = 0; i < palabras.length && idx === -1; i++) {
      var n = normalizar(palabras[i]); var vs = variantes(n);
      if (formas.some(function (f) { return vs.indexOf(f) !== -1 || (f.length >= 3 && n.indexOf(f) === 0); })) idx = i;
    }
    if (idx === -1) return texto.slice(0, MAX - 1).replace(/\s+\S*$/, '') + '…';
    // Empezar unas palabras antes de la coincidencia
    var ini = Math.max(0, idx - 4);
    var out = palabras.slice(ini).join(' ');
    if (out.length > MAX) out = out.slice(0, MAX - 1).replace(/\s+\S*$/, '') + '…';
    return (ini > 0 ? '…' : '') + out;
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
    var ultimoError = 0;
    var mostrados = POR_PAGINA;
    var ultimaConsulta = '';
    var ultimosResultados = [];
    var debounce = null;
    var activo = -1; // índice del resultado activo (aria-activedescendant)

    // Botón lupa + «Buscar»: el nombre accesible es su texto visible (WCAG 2.5.3);
    // el estado lo da aria-expanded, sin cambiar el nombre a «Cerrar»
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
      '  <input id="siteSearchInput" class="buscador__input" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"' +
      '    role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="siteSearchLista" aria-haspopup="listbox">' +
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
      if (nombre !== 'resultados') setActivo(-1);
      input.setAttribute('aria-expanded', nombre === 'resultados' ? 'true' : 'false');
    }

    function anunciar(texto) {
      estado.textContent = '';
      window.setTimeout(function () { estado.textContent = texto; }, 30);
    }

    function plantilla(clave, valores) {
      var s = String(t(clave) || '');
      Object.keys(valores).forEach(function (k) { s = s.split('{' + k + '}').join(valores[k]); });
      return s;
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
      anunciar(t('minimo'));
    }

    function pintarCargando() {
      setEstado('cargando');
      cuerpo.innerHTML = '<p class="buscador__mensaje">' + escapar(t('cargando')) + '</p>';
      anunciar(t('cargando'));
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
      cuerpo.innerHTML = '<p class="buscador__mensaje">' + escapar(plantilla('sinResultados', { q: q })) + '</p>' +
        '<p class="buscador__mensaje-secundario">' + escapar(t('sinResultadosAyuda')) + '</p>' + ejemplosHtml() +
        '<p class="buscador__acciones"><a class="buscador__enlace-secundario" href="' + escapar(resolverUrl('galerias.html')) + '">' + escapar(t('verGalerias')) + '</a></p>';
      anunciar(plantilla('sinResultados', { q: q }));
    }

    // Formas de la consulta (raíces + sinónimos + correcciones) para el resaltado
    function formasDe(consulta) {
      var out = [];
      Object.keys(consulta.formas || {}).forEach(function (tok) { out = out.concat(consulta.formas[tok]); });
      return out;
    }

    function itemHtml(res, i, formas) {
      var r = res.registro;
      var lang = idioma();
      var titulo = r.titulo[lang] || r.titulo.es;
      var desc = r.desc[lang] || r.desc.es || '';
      var chips = '<span class="buscador__chip buscador__chip--tipo">' + escapar(t('tipo.' + r.tipo) || r.tipo) + '</span>';
      var sec = nombreSeccion(r.seccion);
      // Sin chip de sección si repite el tipo ("Galería · Galería")
      if (sec && sec.toLowerCase() !== String(t('tipo.' + r.tipo) || '').toLowerCase()) chips += '<span class="buscador__chip">' + escapar(sec) + '</span>';
      if (r.ejercicio) chips += '<span class="buscador__chip">' + escapar(r.ejercicio) + '</span>';
      else if (r.fecha) chips += '<span class="buscador__chip">' + escapar(r.fecha) + '</span>';
      if (res.pasado) chips += '<span class="buscador__chip buscador__chip--pasado">' + escapar(t('pasado')) + '</span>';
      return '<li class="buscador__item" role="none">' +
        '<a class="buscador__resultado" role="option" id="siteSearchOpcion' + (i + 1) + '" aria-selected="false" href="' + escapar(resolverUrl(r.url)) + '" data-id="' + escapar(r.id) + '" data-pos="' + (i + 1) + '">' +
        '<span class="buscador__titulo">' + resaltar(titulo, formas) + '</span>' +
        (desc ? '<span class="buscador__desc">' + resaltar(ventana(desc, formas), formas) + '</span>' : '') +
        '<span class="buscador__chips">' + chips + '</span>' +
        '</a></li>';
    }

    function masHtml(resultados) {
      if (resultados.length <= mostrados) return '';
      return '<p class="buscador__acciones"><button type="button" class="buscador__mas">' + escapar(t('mostrarMas')) + ' (' + (resultados.length - mostrados) + ')</button></p>';
    }

    function consultaCorregida(q, consulta) {
      var corr = consulta && consulta.corr ? consulta.corr : {};
      if (!Object.keys(corr).length) return '';
      return q.split(/\s+/).map(function (palabra) {
        var n = normalizar(palabra);
        return corr[n] || palabra;
      }).join(' ');
    }

    function pintarResultados(resultados, q) {
      setEstado('resultados');
      var formas = formasDe(resultados.consulta || {});
      var visibles = resultados.slice(0, mostrados);
      var corregida = consultaCorregida(q, resultados.consulta);
      var html = '';
      if (corregida) html += '<p class="buscador__corregido">' + escapar(plantilla('corregido', { q: corregida })) + '</p>';
      html += '<ol class="buscador__lista" id="siteSearchLista" role="listbox" aria-label="' + escapar(t('listaAria')) + '">' +
        visibles.map(function (res, i) { return itemHtml(res, i, formas); }).join('') + '</ol>' + masHtml(resultados);
      cuerpo.innerHTML = html;
      setActivo(-1);
      var n = resultados.length;
      anunciar(n === 1 ? plantilla('resultadoPara', { q: corregida || q }) : plantilla('resultadosPara', { n: n, q: corregida || q }));
    }

    // «Mostrar más»: añade los siguientes sin repintar la lista y enfoca el primero nuevo
    function mostrarMas() {
      var lista = cuerpo.querySelector('.buscador__lista');
      if (!lista || !ultimosResultados.length) return;
      var desde = mostrados;
      mostrados += POR_PAGINA;
      var formas = formasDe(ultimosResultados.consulta || {});
      lista.insertAdjacentHTML('beforeend', ultimosResultados.slice(desde, mostrados).map(function (res, i) { return itemHtml(res, desde + i, formas); }).join(''));
      var mas = cuerpo.querySelector('.buscador__acciones');
      if (mas) mas.remove();
      cuerpo.insertAdjacentHTML('beforeend', masHtml(ultimosResultados));
      var nuevo = lista.querySelector('#siteSearchOpcion' + (desde + 1));
      if (nuevo) nuevo.focus();
    }

    // Opción activa del listbox (↑/↓ desde el campo, sin mover el foco)
    function opciones() { return Array.prototype.slice.call(cuerpo.querySelectorAll('.buscador__resultado')); }
    function setActivo(i) {
      var ops = opciones();
      ops.forEach(function (op) { op.setAttribute('aria-selected', 'false'); op.classList.remove('is-activo'); });
      activo = i;
      if (i < 0 || !ops[i]) { input.removeAttribute('aria-activedescendant'); return; }
      ops[i].setAttribute('aria-selected', 'true');
      ops[i].classList.add('is-activo');
      input.setAttribute('aria-activedescendant', ops[i].id);
      if (typeof ops[i].scrollIntoView === 'function') ops[i].scrollIntoView({ block: 'nearest' });
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
          if (!data || !Array.isArray(data.registros) || !data.registros.length) throw new Error('índice vacío');
          registros = data.registros;
          return registros;
        })
        .catch(function (err) {
          cargando = null;
          ultimoError = Date.now();
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
      if (!registros) {
        // Tras un fallo de red, no se reintenta con cada pulsación (sí con «Reintentar»)
        if (Date.now() - ultimoError < ESPERA_TRAS_ERROR) { pintarError(); return; }
        pintarCargando();
      }
      cargarIndice().then(function (regs) {
        if (q !== ultimaConsulta) return;
        var resultados = buscar(regs, q);
        ultimosResultados = resultados;
        if (!resultados.length) pintarVacio(q);
        else pintarResultados(resultados, q);
      }).catch(function () {
        if (q === ultimaConsulta) pintarError();
      });
    }

    // Altura del panel en móvil con el teclado desplegado (visualViewport)
    function ajustarAltura() {
      if (!abierto()) return;
      var vv = window.visualViewport;
      if (!vv) { panel.style.maxHeight = ''; return; }
      var top = panel.getBoundingClientRect().top;
      var disponible = vv.height + vv.offsetTop - top - 12;
      panel.style.maxHeight = disponible > 160 ? disponible + 'px' : '';
    }

    function abrir() {
      if (abierto()) return;
      document.dispatchEvent(new CustomEvent('buscador:open'));
      panel.hidden = false;
      panel.inert = false;
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      var previa = leerConsulta();
      if (previa && !input.value) input.value = previa;
      ejecutar(input.value);
      input.focus({ preventScroll: true });
      ajustarAltura();
      cargarIndice().catch(function () { /* se pinta al buscar */ });
    }

    function cerrarPanel(devolverFoco) {
      if (!abierto()) return;
      panel.classList.remove('is-open');
      panel.hidden = true;
      panel.inert = true;
      panel.style.maxHeight = '';
      toggle.setAttribute('aria-expanded', 'false');
      setActivo(-1);
      if (devolverFoco) toggle.focus({ preventScroll: true });
    }

    // Ir a un resultado: si es un ancla de esta misma página con el hash ya
    // puesto, hashchange no se dispara; se fuerza para que acc.js reabra el panel
    function irA(enlace) {
      cerrarPanel(false);
      try {
        var destino = new URL(enlace.href, window.location.href);
        var mismaPagina = destino.pathname === window.location.pathname && destino.search === window.location.search;
        if (mismaPagina && destino.hash && destino.hash === window.location.hash) {
          window.setTimeout(function () { window.dispatchEvent(new HashChangeEvent('hashchange')); }, 0);
        }
      } catch (e) { /* URL inválida: el enlace navega igual */ }
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
      var ops;
      if (e.key === 'Enter') {
        e.preventDefault();
        ops = opciones();
        var destino = activo >= 0 ? ops[activo] : ops[0];
        if (destino && cuerpo.getAttribute('data-estado') === 'resultados' && input.value.trim() === ultimaConsulta) {
          irA(destino);
          destino.click();
          return;
        }
        window.clearTimeout(debounce);
        ejecutar(input.value);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        ops = opciones();
        if (ops.length) {
          e.preventDefault();
          var n = ops.length;
          setActivo(e.key === 'ArrowDown' ? (activo + 1) % n : (activo - 1 + n) % n);
          return;
        }
        var primero = cuerpo.querySelector('.buscador__ejemplo');
        if (primero && e.key === 'ArrowDown') { e.preventDefault(); primero.focus(); }
      }
    });
    cuerpo.addEventListener('click', function (e) {
      var target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      var ejemplo = target.closest('.buscador__ejemplo');
      if (ejemplo) { input.value = ejemplo.getAttribute('data-consulta') || ''; ejecutar(input.value); input.focus(); return; }
      if (target.closest('.buscador__mas')) { mostrarMas(); return; }
      if (target.closest('.buscador__reintentar')) { registros = null; cargando = null; ultimoError = 0; ejecutar(ultimaConsulta); input.focus(); return; }
      var resultado = target.closest('.buscador__resultado');
      if (resultado) irA(resultado);
    });
    // Con el foco en un resultado (Tab), ↑/↓ recorren los focalizables del cuerpo
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
    // ha ejecutado y puede haber repintado los resultados, así que el botón pulsado
    // (ejemplo, reintentar) ya no está en el DOM y panel.contains(target) cerraba el panel.
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
      if (window.innerWidth === anchoPrevio) { ajustarAltura(); return; }
      anchoPrevio = window.innerWidth;
      if (abierto()) cerrarPanel(false);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', ajustarAltura);
      window.visualViewport.addEventListener('scroll', ajustarAltura);
    }
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
