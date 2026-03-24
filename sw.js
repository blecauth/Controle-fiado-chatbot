// sw.js - Service Worker com atualização automática
const CACHE_NAME = 'fiadobot-cache-v1.5';
const STATIC_ASSETS = [
  '/Controle-fiado-chatbot/',
  '/Controle-fiado-chatbot/index.html',
  '/Controle-fiado-chatbot/manifest.json',
  '/Controle-fiado-chatbot/icons/icon-192x192.png',
  '/Controle-fiado-chatbot/icons/icon-512x512.png'
  // ADICIONE SEUS ARQUIVOS CSS E JS AQUI
];

// Instalação: Cacheia assets e força ativação imediata
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch((err) => console.error('[SW] Erro no cache:', err))
  );
});

// Ativação: Limpa caches antigos e assume controle
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
    }).then(() => {
      console.log('[SW] Clientes reivindicados');
      return self.clients.claim();
    })
  );
});

// Fetch: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log('[SW] Offline, usando cache para:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
