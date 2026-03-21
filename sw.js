// sw.js - Corrigido para: blecauth.github.io/Controle-fiado-chatbot/
const CACHE_NAME = 'fiadobot-v1.2';
const BASE_PATH = '/Controle-fiado-chatbot/';

const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon-72x72.png',
  BASE_PATH + 'icons/icon-96x96.png',
  BASE_PATH + 'icons/icon-128x128.png',
  BASE_PATH + 'icons/icon-144x144.png',
  BASE_PATH + 'icons/icon-152x152.png',
  BASE_PATH + 'icons/icon-192x192.png',
  BASE_PATH + 'icons/icon-384x384.png',
  BASE_PATH + 'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando assets:', STATIC_ASSETS);
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Erro ao cachear:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora métodos que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignora requisições de outros domínios
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  
  // Estratégia: Cache First para assets, Network First para HTML
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[SW] Servindo do cache:', url.pathname);
        return response;
      }
      
      console.log('[SW] Buscando na rede:', url.pathname);
      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200) {
          return fetchResponse;
        }
        
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return fetchResponse;
      }).catch((error) => {
        console.error('[SW] Fetch falhou:', error);
        // Fallback para offline
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_PATH + 'index.html');
        }
      });
    })
  );
});
