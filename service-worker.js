const staticCacheName = 'restaurant-static-v1';
const dynamicMapsCacheName = 'restaurant-dynamic-maps-v1';
const dynamicImagesCacheName = 'restaurant-dynamic-images-v1';
const dynamicPagesCacheName = 'restaurant-dynamic-pages-v1'

const cssFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'css/styles.min.css'
];

const jsFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'js/index.min.js',
  'js/restaurant.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(staticCacheName)
      .then((cache) => {
        cache.addAll([
          '/',
          ...cssFiles,
          ...jsFiles
        ]);
      }).catch(() => {
        console.log('Error caching static assets!');
      })
  );
});

self.addEventListener('activate', (event) => {
  if (self.clients && clients.claim) {
    clients.claim();
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-') && cacheName !== staticCacheName;
        })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    }).catch((error) => {
      console.log('Some error occurred!' + error);
    }));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
        .then((fetchResponse) => {
          if (event.request.url.endsWith('.webp') || event.request.url.endsWith('.jpg')) {
            return cacheDynamicRequestData(dynamicImagesCacheName, event.request.url, fetchResponse.clone());
          } else if (event.request.url.includes('.html')) {
            return cacheDynamicRequestData(dynamicPagesCacheName, event.request.url, fetchResponse.clone());
          }
          else {
            return cacheDynamicRequestData(dynamicMapsCacheName, event.request.url, fetchResponse.clone());
          }
        }).catch((error) => {
          console.log('Some network error occurred!');
        });
    })
  );
});

function cacheDynamicRequestData(dynamicCacheName, url, fetchResponse) {
  return caches.open(dynamicCacheName)
    .then((cache) => {
      cache.put(url, fetchResponse.clone());
      return fetchResponse;
    }).catch((error) => {
      console.log('Some error occurred!');
    });
}
