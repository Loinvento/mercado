const CACHE_NAME = 'mercado-facil-v3';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Al instalar, guarda en caché los archivos de la app y la librería de escaneo
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).catch(function(err) {
      console.warn('No se pudieron cachear todos los archivos iniciales', err);
    })
  );
  self.skipWaiting();
});

// Limpia cachés viejos al activar una nueva versión
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: cache primero, y si no está, va a la red y lo guarda para la próxima vez
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        // Solo cachear respuestas válidas
        if (!response || response.status !== 200) return response;

        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        // Sin red y sin caché: si pidieron la página principal, devuélvela igual desde caché
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
