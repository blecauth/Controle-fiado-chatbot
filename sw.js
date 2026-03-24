// sw.js - Service Worker FiadoBot v1.7
const CACHE_NAME = 'fiadobot-cache-v1.7';
const BASE_PATH = '/Controle-fiado-chatbot';

// Assets essenciais (adicione seus arquivos CSS/JS externos aqui se houver)
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`
  // ADICIONE AQUI se tiver arquivos externos:
  // `${BASE_PATH}/styles.css`,
  // `${BASE_PATH}/app.js`
];

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v1.7...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto, adicionando assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets cacheados');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Erro ao cachear:', err);
        // Continua mesmo se falhar algum asset
        return self.skipWaiting();
      })
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando v1.7...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Controle assumido');
      return self.clients.claim();
    })
  );
});

// Fetch - Estratégia: Cache First para assets, Network First para API
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Só processa requests do mesmo domínio e base path
  if (!url.pathname.startsWith(BASE_PATH)) return;
  
  // Estratégia diferente para navegação (SPA) vs assets estáticos
  const isNavigation = event.request.mode === 'navigate';
  const isAsset = STATIC_ASSETS.some(asset => url.pathname === asset.replace(BASE_PATH, ''));
  
  if (isNavigation) {
    // SPA: sempre retorna index.html (client-side routing)
    event.respondWith(
      caches.match(`${BASE_PATH}/index.html`)
        .then(response => {
          if (response) {
            console.log('[SW] Serving index.html from cache for:', url.pathname);
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => caches.match(`${BASE_PATH}/index.html`))
    );
  } else {
    // Assets: Cache First
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('[SW] Cache hit:', url.pathname);
            return response;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, clone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              console.log('[SW] Offline, não encontrado no cache:', url.pathname);
              // Retorna uma resposta vazia em vez de undefined
              return new Response('Offline', { status: 503 });
            });
        })
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting recebido');
    self.skipWaiting();
  }
});
