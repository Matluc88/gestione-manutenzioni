const CACHE_NAME = 'onem-energy-v1';
const RUNTIME_CACHE = 'onem-runtime-v1';
const IMAGE_CACHE = 'onem-images-v1';

const PRECACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/onem-logo-transparent.png'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching static resources');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[Service Worker] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    console.error('[Service Worker] Cache first failed');
    return offlineFallback(request);
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return offlineFallback(request);
  }
}

function offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/offline.html').then((response) => {
      if (response) {
        return response;
      }
      
      return new Response(
        `<!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline - ONE-M ENERGY</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .container {
              max-width: 500px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            h1 {
              font-size: 2.5rem;
              margin: 0 0 20px 0;
            }
            p {
              font-size: 1.1rem;
              line-height: 1.6;
              margin: 0 0 30px 0;
              opacity: 0.9;
            }
            .icon {
              font-size: 5rem;
              margin-bottom: 20px;
            }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 15px 30px;
              font-size: 1rem;
              font-weight: 600;
              border-radius: 10px;
              cursor: pointer;
              transition: transform 0.2s;
            }
            button:hover {
              transform: scale(1.05);
            }
            button:active {
              transform: scale(0.95);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>Sei Offline</h1>
            <p>Non è possibile connettersi al server. Verifica la tua connessione internet e riprova.</p>
            <button onclick="window.location.reload()">Riprova</button>
          </div>
        </body>
        </html>`,
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
    });
  }

  if (request.destination === 'image') {
    return new Response(
      `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="16">
          Immagine non disponibile
        </text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[Service Worker] Background sync triggered');
}
