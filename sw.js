// DeCasa Esquadrias — Service Worker PWA
const CACHE = 'decasa-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instala e cacheia os assets principais
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS).catch(function(err){
        console.log('Cache parcial (fonts/cdn podem falhar offline):', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);})
      );
    })
  );
  self.clients.claim();
});

// Serve do cache, busca na rede se não tiver (cache-first para o HTML principal)
self.addEventListener('fetch', function(e){
  // Só intercepta requests GET
  if(e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cacheia respostas válidas
        if(response && response.status === 200 && response.type !== 'opaque'){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){cache.put(e.request, clone);});
        }
        return response;
      }).catch(function(){
        // Offline fallback — retorna o HTML principal
        if(e.request.destination === 'document'){
          return caches.match('./index.html');
        }
      });
    })
  );
});
