// sw.js - Service Worker corrigido para GitHub Pages
const CACHE_NAME = 'fiadobot-cache-v1.6';  // Bump version
const BASE_PATH = '/Controle-fiado-chatbot';

const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`
];

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v1.6...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Erro:', err))
  );
});

// Ativação
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deletando:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch com correção de caminho
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Só intercepta requests do mesmo domínio e path
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(BASE_PATH)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('[SW] Offline:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Mensagens
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
