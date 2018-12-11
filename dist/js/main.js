
class DBHelper{static get DATABASE_URL(){const port=1337
return`http://localhost:${port}/restaurants`;}
static fetchRestaurants(callback){fetch(DBHelper.DATABASE_URL).then(response=>{if(response.status===200){response.json().then(json=>callback(null,json)).catch(error=>callback(error,null));}else{callback(`Request failed. Returned status of ${response.status}`,null);}}).catch(error=>callback(error,null));}
static fetchRestaurantById(id,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{const restaurant=restaurants.find(r=>r.id==id);if(restaurant){callback(null,restaurant);}else{callback('Restaurant does not exist',null);}}});}
static fetchRestaurantByCuisine(cuisine,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{const results=restaurants.filter(r=>r.cuisine_type==cuisine);callback(null,results);}});}
static fetchRestaurantByNeighborhood(neighborhood,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{const results=restaurants.filter(r=>r.neighborhood==neighborhood);callback(null,results);}});}
static fetchRestaurantByCuisineAndNeighborhood(cuisine,neighborhood,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{let results=restaurants
if(cuisine!='all'){results=results.filter(r=>r.cuisine_type==cuisine);}
if(neighborhood!='all'){results=results.filter(r=>r.neighborhood==neighborhood);}
callback(null,results);}});}
static fetchNeighborhoods(callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{const neighborhoods=restaurants.map((v,i)=>restaurants[i].neighborhood)
const uniqueNeighborhoods=neighborhoods.filter((v,i)=>neighborhoods.indexOf(v)==i)
callback(null,uniqueNeighborhoods);}});}
static fetchCuisines(callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null);}else{const cuisines=restaurants.map((v,i)=>restaurants[i].cuisine_type)
const uniqueCuisines=cuisines.filter((v,i)=>cuisines.indexOf(v)==i)
callback(null,uniqueCuisines);}});}
static urlForRestaurant(restaurant){return(`./restaurant.html?id=${restaurant.id}`);}
static imageUrlForRestaurant(restaurant){return(restaurant.photograph===undefined?'http://via.placeholder.com/800x600':`/img/${restaurant.photograph}.jpg`);}
static mapMarkerForRestaurant(restaurant,map){const marker=new google.maps.Marker({position:restaurant.latlng,title:restaurant.name,url:DBHelper.urlForRestaurant(restaurant),map:map,animation:google.maps.Animation.DROP});return marker;}
static fetchReviewsForRestaurant(id,callback){fetch('http://localhost:1337/reviews/?restaurant_id='+id).then(response=>{if(response.status===200){response.json().then(json=>{callback(null,json);}).catch(err=>{callback(err,null);});}else{callback(`Request failed. Returned status of ${response.status}`,null);}}).catch(err=>{callback(err,null);});}}
if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(registration){console.log('Service Worker Registered');});navigator.serviceWorker.ready.then(function(registration){console.log('Service Worker Ready');});}
let restaurants,neighborhoods,cuisines
var map
var markers=[]
document.addEventListener('DOMContentLoaded',(event)=>{fetchNeighborhoods();fetchCuisines();window.lazySizesConfig=window.lazySizesConfig||{};lazySizesConfig.loadMode=1;});fetchNeighborhoods=()=>{DBHelper.fetchNeighborhoods((error,neighborhoods)=>{if(error){console.error(error);}else{self.neighborhoods=neighborhoods;fillNeighborhoodsHTML();}});}
fillNeighborhoodsHTML=(neighborhoods=self.neighborhoods)=>{const select=document.getElementById('neighborhoods-select');neighborhoods.forEach(neighborhood=>{const option=document.createElement('option');option.innerHTML=neighborhood;option.value=neighborhood;select.append(option);});}
fetchCuisines=()=>{DBHelper.fetchCuisines((error,cuisines)=>{if(error){console.error(error);}else{self.cuisines=cuisines;fillCuisinesHTML();}});}
fillCuisinesHTML=(cuisines=self.cuisines)=>{const select=document.getElementById('cuisines-select');cuisines.forEach(cuisine=>{const option=document.createElement('option');option.innerHTML=cuisine;option.value=cuisine;select.append(option);});}
window.initMap=()=>{let loc={lat:40.722216,lng:-73.987501};self.map=new google.maps.Map(document.getElementById('map'),{zoom:12,center:loc,scrollwheel:false});google.maps.event.addListener(self.map,"tilesloaded",function(){[].slice.apply(document.querySelectorAll('#map a,div,button')).forEach(function(item){item.setAttribute('tabindex','-1');});document.getElementsByTagName('iframe')[0].setAttribute('title','Google Maps for restaurants');});updateRestaurants();}
updateRestaurants=()=>{const cSelect=document.getElementById('cuisines-select');const nSelect=document.getElementById('neighborhoods-select');const cIndex=cSelect.selectedIndex;const nIndex=nSelect.selectedIndex;const cuisine=cSelect[cIndex].value;const neighborhood=nSelect[nIndex].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine,neighborhood,(error,restaurants)=>{if(error){console.error(error);}else{resetRestaurants(restaurants);fillRestaurantsHTML();}})}
resetRestaurants=(restaurants)=>{self.restaurants=[];const ul=document.getElementById('restaurants-list');ul.innerHTML='';self.markers.forEach(m=>m.setMap(null));self.markers=[];self.restaurants=restaurants;}
fillRestaurantsHTML=(restaurants=self.restaurants)=>{const ul=document.getElementById('restaurants-list');restaurants.forEach(restaurant=>{ul.append(createRestaurantHTML(restaurant));});addMarkersToMap();}
createRestaurantHTML=(restaurant)=>{const li=document.createElement('li');li.setAttribute('role','listitem');const image=document.createElement('img');image.className='restaurant-img lazyload';image.alt='Photo of '+restaurant.name;image.setAttribute('data-src',DBHelper.imageUrlForRestaurant(restaurant));image.src='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';li.append(image);const name=document.createElement('h3');name.innerHTML=restaurant.name;li.append(name);const neighborhood=document.createElement('p');neighborhood.innerHTML=restaurant.neighborhood;li.append(neighborhood);const address=document.createElement('p');address.innerHTML=restaurant.address;li.append(address);const more=document.createElement('a');more.innerHTML='View Details';more.href=DBHelper.urlForRestaurant(restaurant);li.append(more)
return li}
addMarkersToMap=(restaurants=self.restaurants)=>{restaurants.forEach(restaurant=>{const marker=DBHelper.mapMarkerForRestaurant(restaurant,self.map);google.maps.event.addListener(marker,'click',()=>{window.location.href=marker.url});self.markers.push(marker);});}