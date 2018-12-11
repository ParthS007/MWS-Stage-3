let restaurant;
let reviews;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  window.lazySizesConfig = window.lazySizesConfig || {};
  lazySizesConfig.loadMode = 1; // no offscreen images load
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      // remove focus
      // assuming map doesn't need focus
      // https://stackoverflow.com/questions/30531075/
      google.maps.event.addListener(self.map, "tilesloaded", function(){
        [].slice.apply(document.querySelectorAll('#map a,button')).forEach(function(item) {
          item.setAttribute('tabindex','-1');
        });
        // div for map satellite buttons
        // button for right side zoom buttons
        document.getElementsByTagName('iframe')[0].setAttribute('title', 'Google Maps for restaurant');
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/*
 * fetch reviews
 */
fetchReviews = () => {
  const id = getParameterByName('id');
  if (!id) {
    console.log('No ID in URL');
    return;
  }
  DBHelper.fetchReviewsForRestaurant(id, (err, reviews) => {
    self.reviews = reviews;
    if (err || !reviews) {
      console.log('reviews fetch error', err);
      return;
    }
    fillReviewsHTML();
  });
}

/*
 * set favorite button
 */
setFavoriteButton = (status) => {
  const favorite = document.getElementById('favBtn');
  if (status === 'true') {
    favorite.title = 'Restaurant is Favorite';
    favorite.innerHTML = '⭐️ Unfavorite';
  } else {
    favorite.title = 'Restaurant is not Favorite';
    favorite.innerHTML = '☆ Favorite';
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  // favorite
  setFavoriteButton(restaurant.is_favorite);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazyload';
  image.alt = 'Photo of ' + restaurant.name;
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('role', 'listitem');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = getHumanDate(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  // https://www.w3.org/TR/wai-aria-practices/examples/breadcrumb/index.html
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


getHumanDate = (ts) => {
  let date = new Date(ts);
  return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

/* Managing reviews */
// https://developers.google.com/web/updates/2015/12/background-sync
navigator.serviceWorker.ready.then(function (swRegistration) {
  let form = document.querySelector('#review-form');
  // listen to submit event
  form.addEventListener('submit', e => {
    e.preventDefault();
    let rating = form.querySelector('#rating');
    let review = {
      restaurant_id: getParameterByName('id'),
      name: form.querySelector('#name').value,
      rating: rating.options[rating.selectedIndex].value,
      comments: form.querySelector('#comment').value
    };
    console.log(review);
    // save to DB
    idb.open('review', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('outbox', { autoIncrement: true, keyPath: 'id' });
    }).then(function (db) {
      var transaction = db.transaction('outbox', 'readwrite');
      return transaction.objectStore('outbox').put(review);
    }).then(function () {
      form.reset();
      // register for sync and clean up the form
      return swRegistration.sync.register('sync').then(() => {
        console.log('Sync registered');
        // add review to view (for better UX)
        // const ul = document.getElementById('reviews-list');
        // review.createdAt = new Date();
        // ul.appendChild(createReviewHTML(review));
      });
    });
    // finish
  });
});


/* Managing favorites */
navigator.serviceWorker.ready.then(function (swRegistration) {
  let btn = document.getElementById('favBtn');
  // listen to click event
  btn.addEventListener('click', e => {
    const opposite = (self.restaurant.is_favorite === 'true') ? 'false' : 'true';
    console.log('clicked');
    let res = {
      resId: getParameterByName('id'),
      favorite: opposite
    };
    // save to DB
    idb.open('favorite', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('outbox', { autoIncrement: true, keyPath: 'id' });
    }).then(function (db) {
      var transaction = db.transaction('outbox', 'readwrite');
      return transaction.objectStore('outbox').put(res);
    }).then(function () {
      setFavoriteButton(opposite);
      self.restaurant.is_favorite = opposite;
      // register for sync and clean up the form
      return swRegistration.sync.register('favorite').then(() => {
        console.log('Favorite Sync registered');
      });
    });
    // finish
  });
});
