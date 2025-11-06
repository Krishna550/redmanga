const CACHE_NAME = 'manga-reader-v1';
const STATIC_CACHE = 'manga-static-v1';
const IMAGE_CACHE = 'manga-images-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { cache: 'reload' });
      })).catch(err => {
        console.warn('[Service Worker] Failed to cache some static assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE && name !== IMAGE_CACHE;
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle image requests separately with aggressive caching
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving image from cache:', url.pathname);
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            // Only cache successful responses and only if body hasn't been consumed
            if (networkResponse && networkResponse.status === 200 && networkResponse.body) {
              console.log('[Service Worker] Caching new image:', url.pathname);
              // Clone BEFORE any other operation to avoid "body already used" error
              const responseToCache = networkResponse.clone();
              cache.put(request, responseToCache).catch(err => {
                console.warn('[Service Worker] Failed to cache image:', err);
              });
            }
            return networkResponse;
          }).catch((error) => {
            console.error('[Service Worker] Image fetch failed:', error);
            throw error;
          });
        });
      })
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request).then((networkResponse) => {
      // Only cache successful GET requests
      if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
        // Clone the response before caching (must clone before reading body)
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        }).catch((err) => {
          console.warn('[Service Worker] Cache put failed:', err);
        });
      }
      return networkResponse;
    }).catch((error) => {
      console.error('[Service Worker] Fetch failed:', error);
      // Try to return from cache
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Return index.html as fallback
        return caches.match('/index.html');
      });
    })
  );
});

// Message event - handle cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name === IMAGE_CACHE) {
              console.log('[Service Worker] Clearing image cache');
              return caches.delete(name);
            }
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
