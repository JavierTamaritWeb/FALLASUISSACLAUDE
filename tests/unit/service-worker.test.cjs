const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Cachés independientes, con el mismo orden de búsqueda que CacheStorage.
function worker(fetchImpl) {
  const stores = new Map();
  const handlers = {};
  const key = request => new URL(typeof request === 'string' ? request : request.url, 'https://fallasuissa.es').href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) { store.set(key(request), response.clone()); },
        async addAll() {}
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const name of stores.keys()) {
        const found = await (await caches.open(name)).match(request);
        if (found) return found;
      }
    }
  };
  const context = vm.createContext({ caches, fetch: fetchImpl, URL, Response,
    location: { origin: 'https://fallasuissa.es' }, console: { log() {} },
    self: { addEventListener(name, handler) { handlers[name] = handler; }, clients: { async claim() {} }, async skipWaiting() {} }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/sw.js'), 'utf8'), context);
  return { caches, handlers, context,
    cacheName: vm.runInContext('CACHE_NAME', context),
    criticalName: vm.runInContext('CRITICAL_CACHE', context),
    async request(url) {
      let response;
      const pending = [];
      handlers.fetch({ request: new Request(`https://fallasuissa.es${url}`),
        respondWith(promise) { response = promise; }, waitUntil(promise) { pending.push(promise); }
      });
      const result = await response;
      await Promise.all(pending);
      return result;
    }
  };
}

test('la portada devuelve la versión de red aunque exista una precarga antigua', async () => {
  const sw = worker(async () => new Response('portada nueva'));
  await (await sw.caches.open(sw.criticalName)).put('/', new Response('portada antigua'));
  assert.equal(await (await sw.request('/')).text(), 'portada nueva');
});

test('la actualización de un recurso crítico reemplaza la copia que se consulta', async () => {
  const sw = worker(async () => new Response('css nuevo'));
  await (await sw.caches.open(sw.criticalName)).put('/css/main.css', new Response('css antiguo'));
  assert.equal(await (await sw.request('/css/main.css')).text(), 'css antiguo');
  assert.equal(await (await sw.request('/css/main.css')).text(), 'css nuevo');
});

test('activar y limpiar el worker conserva cachés ajenas del mismo origen', async () => {
  const sw = worker(async () => new Response('ok'));
  await sw.caches.open('otra-aplicacion-v1');
  await sw.caches.open('falla-suissa-v0');
  await sw.caches.open(sw.cacheName);
  await sw.caches.open(sw.criticalName);
  let pending;
  sw.handlers.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.ok((await sw.caches.keys()).includes('otra-aplicacion-v1'));
  assert.ok(!(await sw.caches.keys()).includes('falla-suissa-v0'));
  await sw.caches.open('falla-critical-v0');
  sw.handlers.message({ data: { type: 'CLEAN_CACHE' }, waitUntil(promise) { pending = promise; } });
  await pending;
  assert.ok((await sw.caches.keys()).includes('otra-aplicacion-v1'));
  assert.ok(!(await sw.caches.keys()).includes('falla-critical-v0'));
});

test('un fallo de escritura de caché no convierte una respuesta de red válida en error', async () => {
  const sw = worker(async () => new Response('contenido disponible'));
  sw.caches.open = async () => ({ async put() { throw new Error('Cuota agotada'); }, async match() {} });
  assert.equal(await (await sw.request('/eventos.html')).text(), 'contenido disponible');
});
