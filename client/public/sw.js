// TakeAway Manager - Service Worker
// Versión mínima: solo gestiona la instalación PWA y el caché del shell de la app.
// No hace caché agresivo para que los datos de pedidos siempre sean frescos.

const CACHE_NAME = 'takeaway-v1';

// Al instalar, pre-cachear solo el shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
      ]).catch(() => {
        // Si falla el precacheo, continuar igualmente
      });
    })
  );
  self.skipWaiting();
});

// Al activar, limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First para la app (datos siempre frescos)
// Solo usa caché si la red falla completamente
self.addEventListener('fetch', (event) => {
  // No interceptar llamadas a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Para el resto, intentar red primero, caché como fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en caché si es una respuesta válida
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla, intentar desde caché
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
