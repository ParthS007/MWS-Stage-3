// importScripts('/js/idb.js');

/*
 Service Worker implementation
 inspired from https://github.com/GoogleChromeLabs/airhorn/blob/master/app/sw.js
 */

let version = '1.6.0';
let staticCacheName = 'mws-rrs3-' + version;
let DBName = 'mws-rrs3';
let DBVersion = 1;
let dbPromise;


self.addEventListener('activate',  event => {
  event.waitUntil((function(){
    self.clients.claim();
    initDB();
  })());
});


/*
 * Adapted from https://developers.google.com/web/ilt/pwa/lab-caching-files-with-service-worker
 * Another way to cache is to cache it in 'install' event, but I am not sure if rubrics demands that
 * It says visited page should show when there is no network access so only caching requests as they happen
 */
self.addEventListener('fetch', function(event) {
  // console.log('Fetch event for ', event.request.url);

  // IDB case
  if (event.request.url.endsWith('localhost:1337/restaurants')){
    // fetching restaurants, intervene with IDB
    event.respondWith(
      // try to read data
      dbPromise.then(function (db) {
        var tx = db.transaction('restaurants', 'readonly');
        var store = tx.objectStore('restaurants');
        return store.getAll();
      }).then(function (items) {
        // read
        if (!items.length) {
          // fetch it from net
          return fetch(event.request).then(function (response) {
            return response.clone().json().then(json => {
              // add to db
              console.log('event respond fetch from net');
              addAllData(json);
              return response;
            })
          });
        } else {
          // already in DB
          console.log('event respond read from DB');
          let response = new Response(JSON.stringify(items), {
            headers: new Headers({
              'Content-type': 'application/json',
              'Access-Control-Allow-Credentials': 'true'
            }),
            type: 'cors',
            status: 200
          });
          return response;
        }
      })
    );

    return; // don't go down
  }

  // normal cases
  event.respondWith(
    caches.match(event.request).then(function(response) {

      if (response) {
        console.log('Found ', event.request.url, ' in cache');
        return response;
      }
      // console.log('Network request for ', event.request.url);
      return fetch(event.request)
        .then(function(response) {
          return caches.open(staticCacheName).then(function(cache) {
            if (event.request.url.indexOf('maps') < 0) { // don't cache google maps
              // ^ it's not a site asset, is it?
              // console.log('Saving ' + event.request.url + ' into cache.');
              cache.put(event.request.url, response.clone());
            }
            return response;
          });
        });

    }).catch(function(error) {
      console.log('offline');
    })
  );
});


/* delete old cache */
self.addEventListener('activate', function(event) {
  console.log('Activating new service worker...');

  let cacheWhitelist = [staticCacheName];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// IDB Integration
// https://developers.google.com/web/ilt/pwa/working-with-indexeddb

function initDB() {
  dbPromise = idb.open(DBName, DBVersion, function (upgradeDb) {
    console.log('making DB Store');
    if (!upgradeDb.objectStoreNames.contains('restaurants')) {
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    }
  });
}

function addAllData(rlist) {
  let tx;
  dbPromise.then(function(db) {
    tx = db.transaction('restaurants', 'readwrite');
    var store = tx.objectStore('restaurants');
    rlist.forEach(function(res) {
      console.log('adding', res);
      store.put(res);  // put is safer because it doesn't give error on duplicate add
    });
    return tx.complete;
  }).then(function() {
    console.log('All data added to DB successfully');
  }).catch(function(err) {
    tx.abort();
    console.log('error in DB adding', err);
    return false;
  });
}


// reviews
// https://developers.google.com/web/updates/2015/12/background-sync

self.addEventListener('sync', function (event) {
  if (event.tag === 'sync') {
    event.waitUntil(
      sendReviews().then(() => {
        console.log('synced');
      }).catch(err => {
        console.log(err, 'error syncing');
      })
    );
  } else if (event.tag === 'favorite') {
    event.waitUntil(
      sendFavorites().then(() => {
        console.log('favorites synced');
      }).catch(err => {
        console.log(err, 'error syncing favorites');
      })
    );
  }
});

function sendFavorites() {
  return idb.open('favorite', 1).then(db => {
    let tx = db.transaction('outbox', 'readonly');
    return tx.objectStore('outbox').getAll();
  }).then(items => {
    return Promise.all(items.map(item => {
      let id = item.id;
      // delete review.id;
      console.log("sending favorite", item);
      // POST review
      return fetch(`http://localhost:1337/restaurants/${item.resId}/?is_favorite=${item.favorite}`, {
        method: 'PUT'
      }).then(response => {
        console.log(response);
        return response.json();
      }).then(data => {
        console.log('added favorite', data);
        if (data) {
          // delete from db
          idb.open('favorite', 1).then(db => {
            let tx = db.transaction('outbox', 'readwrite');
            return tx.objectStore('outbox').delete(id);
          });
        }
      });
    }));
  });
}

function sendReviews() {
  return idb.open('review', 1).then(db => {
    let tx = db.transaction('outbox', 'readonly');
    return tx.objectStore('outbox').getAll();
  }).then(reviews => {
    return Promise.all(reviews.map(review => {
      let reviewID = review.id;
      delete review.id;
      console.log("sending review", review);
      // POST review
      return fetch('http://localhost:1337/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        console.log(response);
        return response.json();
      }).then(data => {
        console.log('added review', data);
        if (data) {
          // delete from db
          idb.open('review', 1).then(db => {
            let tx = db.transaction('outbox', 'readwrite');
            return tx.objectStore('outbox').delete(reviewID);
          });
        }
      });
    }));
  });
}
