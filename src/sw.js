// Service Worker para WEBFALLASUISSA
// Cache crítico y estrategias de performance

// IMPORTANTE: sincronizar con la versión de release (package.json/CLAUDE.md)
// en cada subida de versión. Al cambiar los nombres, el handler de activate
// purga los caches antiguos — sin el bump, los visitantes recurrentes con el
// SW registrado seguirían viendo el HTML/CSS cacheado de la versión anterior.
const CACHE_NAME = 'falla-suissa-v4.30.26';
const CRITICAL_CACHE = 'falla-critical-v4.30.26';

// Recursos críticos para cache inmediato
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/dark.js',
  '/js/lang.js',
  '/js/nav-menu.js',
  '/js/accessibility.js',
  '/img/escudo-falla/Escudo-Oficial-Falla.avif',
  '/img/favicon/favicon.ico',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then((cache) => {
        console.log('SW: Cacheando recursos críticos');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        // Activar inmediatamente
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    cleanOldCaches().then(() => {
      // Controlar inmediatamente todas las pestañas
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests GET del mismo origen (cache.put rechaza POST/HEAD)
  if (request.method !== 'GET' || url.origin !== location.origin || request.headers.has('range')) {
    return;
  }

  event.respondWith(
    handleFetch(request, event)
  );
});

async function handleFetch(request, event) {
  const url = new URL(request.url);
  
  // El HTML siempre consulta la red, incluida la portada precargada.
  if (isHTMLPage(url.pathname)) {
    return networkFirst(request);
  }
  
  // Estrategia Cache First para assets estáticos
  if (isStaticAsset(url.pathname)) {
    return cacheFirst(request, event);
  }
  
  // Por defecto, Network First
  return networkFirst(request);
}

// Cache First: buscar en cache, fallback a network
async function cacheFirst(request, event) {
  const cachedResponse = await matchCurrentCache(request);
  
  if (cachedResponse) {
    // Actualizar cache en background si es necesario
    event.waitUntil(updateCacheInBackground(request));
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await storeResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback offline
    return getOfflineFallback(request);
  }
}

// Network First: intentar network, fallback a cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await storeResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await matchCurrentCache(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

// Actualizar cache en background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await storeResponse(request, networkResponse);
    }
  } catch (error) {
    // Ignorar errores en background updates
  }
}

// Leer y escribir siempre en la misma caché: una precarga antigua no debe
// ocultar una actualización escrita en otra caché de CacheStorage.
function cacheNameFor(request) {
  const pathname = new URL(typeof request === 'string' ? request : request.url, location.origin).pathname;
  return isCriticalResource(pathname) ? CRITICAL_CACHE : CACHE_NAME;
}

async function matchCurrentCache(request) {
  try {
    return await (await caches.open(cacheNameFor(request))).match(request);
  } catch (error) {
    return undefined;
  }
}

async function storeResponse(request, response) {
  try {
    await (await caches.open(cacheNameFor(request))).put(request, response);
  } catch (error) {
    // Una cuota agotada no debe impedir entregar la respuesta válida de la red.
  }
}

// Detectar recursos críticos
function isCriticalResource(pathname) {
  // Igualdad estricta: con startsWith, '/' casaba con TODAS las rutas y el HTML
  // acababa en cache-first (la rama network-first era inalcanzable)
  return CRITICAL_RESOURCES.includes(pathname);
}

// Detectar páginas HTML
function isHTMLPage(pathname) {
  return pathname.endsWith('.html') || 
         pathname === '/' || 
         !pathname.includes('.');
}

// Detectar assets estáticos
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Fallback offline
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Fallback para páginas HTML
  if (isHTMLPage(url.pathname)) {
    const offlinePage = await matchCurrentCache('/');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Fallback genérico
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'No hay conexión disponible' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Limpiar caches periódicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanOldCaches());
  }
});

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name =>
    (name.startsWith('falla-suissa-') || name.startsWith('falla-critical-'))
    && name !== CACHE_NAME && name !== CRITICAL_CACHE
  );
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}
