// Service Worker para WEBFALLASUISSA
// Cache crítico y estrategias de performance

const CACHE_NAME = 'falla-suissa-v2.0.1';
const CRITICAL_CACHE = 'falla-critical-v2';

// Recursos críticos para cache inmediato
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/dark.js',
  '/js/lang.js',
  '/js/nav-menu.js',
  '/js/accessibility.js',
  '/img/Escudo_falla.avif',
  '/img/favicon.ico',
  '/manifest.json'
];

// Recursos para cache bajo demanda
const CACHEABLE_RESOURCES = [
  '/calendario.html',
  '/eventos.html', 
  '/galerias.html',
  '/lafalla.html',
  '/organigrama.html'
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
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Eliminar caches antiguos
            return cacheName !== CACHE_NAME && cacheName !== CRITICAL_CACHE;
          })
          .map((cacheName) => {
            console.log('SW: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Controlar inmediatamente todas las pestañas
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  // Estrategia Cache First para recursos críticos
  if (isCriticalResource(url.pathname)) {
    return cacheFirst(request);
  }
  
  // Estrategia Network First para HTML
  if (isHTMLPage(url.pathname)) {
    return networkFirst(request);
  }
  
  // Estrategia Cache First para assets estáticos
  if (isStaticAsset(url.pathname)) {
    return cacheFirst(request);
  }
  
  // Por defecto, Network First
  return networkFirst(request);
}

// Cache First: buscar en cache, fallback a network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Actualizar cache en background si es necesario
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
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
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
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
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Ignorar errores en background updates
  }
}

// Detectar recursos críticos
function isCriticalResource(pathname) {
  return CRITICAL_RESOURCES.some(resource => 
    pathname === resource || pathname.startsWith(resource)
  );
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
    const offlinePage = await caches.match('/');
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
    cleanOldCaches();
  }
});

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    !name.includes(CACHE_NAME) && !name.includes(CRITICAL_CACHE)
  );
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}