
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
if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(registration){console.log('Service Worker Registered');});navigator.serviceWorker.ready.then(function(registration){console.log('Service Worker Ready');});}'use strict';(function(){function toArray(arr){return Array.prototype.slice.call(arr);}
function promisifyRequest(request){return new Promise(function(resolve,reject){request.onsuccess=function(){resolve(request.result);};request.onerror=function(){reject(request.error);};});}
function promisifyRequestCall(obj,method,args){var request;var p=new Promise(function(resolve,reject){request=obj[method].apply(obj,args);promisifyRequest(request).then(resolve,reject);});p.request=request;return p;}
function promisifyCursorRequestCall(obj,method,args){var p=promisifyRequestCall(obj,method,args);return p.then(function(value){if(!value)return;return new Cursor(value,p.request);});}
function proxyProperties(ProxyClass,targetProp,properties){properties.forEach(function(prop){Object.defineProperty(ProxyClass.prototype,prop,{get:function(){return this[targetProp][prop];},set:function(val){this[targetProp][prop]=val;}});});}
function proxyRequestMethods(ProxyClass,targetProp,Constructor,properties){properties.forEach(function(prop){if(!(prop in Constructor.prototype))return;ProxyClass.prototype[prop]=function(){return promisifyRequestCall(this[targetProp],prop,arguments);};});}
function proxyMethods(ProxyClass,targetProp,Constructor,properties){properties.forEach(function(prop){if(!(prop in Constructor.prototype))return;ProxyClass.prototype[prop]=function(){return this[targetProp][prop].apply(this[targetProp],arguments);};});}
function proxyCursorRequestMethods(ProxyClass,targetProp,Constructor,properties){properties.forEach(function(prop){if(!(prop in Constructor.prototype))return;ProxyClass.prototype[prop]=function(){return promisifyCursorRequestCall(this[targetProp],prop,arguments);};});}
function Index(index){this._index=index;}
proxyProperties(Index,'_index',['name','keyPath','multiEntry','unique']);proxyRequestMethods(Index,'_index',IDBIndex,['get','getKey','getAll','getAllKeys','count']);proxyCursorRequestMethods(Index,'_index',IDBIndex,['openCursor','openKeyCursor']);function Cursor(cursor,request){this._cursor=cursor;this._request=request;}
proxyProperties(Cursor,'_cursor',['direction','key','primaryKey','value']);proxyRequestMethods(Cursor,'_cursor',IDBCursor,['update','delete']);['advance','continue','continuePrimaryKey'].forEach(function(methodName){if(!(methodName in IDBCursor.prototype))return;Cursor.prototype[methodName]=function(){var cursor=this;var args=arguments;return Promise.resolve().then(function(){cursor._cursor[methodName].apply(cursor._cursor,args);return promisifyRequest(cursor._request).then(function(value){if(!value)return;return new Cursor(value,cursor._request);});});};});function ObjectStore(store){this._store=store;}
ObjectStore.prototype.createIndex=function(){return new Index(this._store.createIndex.apply(this._store,arguments));};ObjectStore.prototype.index=function(){return new Index(this._store.index.apply(this._store,arguments));};proxyProperties(ObjectStore,'_store',['name','keyPath','indexNames','autoIncrement']);proxyRequestMethods(ObjectStore,'_store',IDBObjectStore,['put','add','delete','clear','get','getAll','getKey','getAllKeys','count']);proxyCursorRequestMethods(ObjectStore,'_store',IDBObjectStore,['openCursor','openKeyCursor']);proxyMethods(ObjectStore,'_store',IDBObjectStore,['deleteIndex']);function Transaction(idbTransaction){this._tx=idbTransaction;this.complete=new Promise(function(resolve,reject){idbTransaction.oncomplete=function(){resolve();};idbTransaction.onerror=function(){reject(idbTransaction.error);};idbTransaction.onabort=function(){reject(idbTransaction.error);};});}
Transaction.prototype.objectStore=function(){return new ObjectStore(this._tx.objectStore.apply(this._tx,arguments));};proxyProperties(Transaction,'_tx',['objectStoreNames','mode']);proxyMethods(Transaction,'_tx',IDBTransaction,['abort']);function UpgradeDB(db,oldVersion,transaction){this._db=db;this.oldVersion=oldVersion;this.transaction=new Transaction(transaction);}
UpgradeDB.prototype.createObjectStore=function(){return new ObjectStore(this._db.createObjectStore.apply(this._db,arguments));};proxyProperties(UpgradeDB,'_db',['name','version','objectStoreNames']);proxyMethods(UpgradeDB,'_db',IDBDatabase,['deleteObjectStore','close']);function DB(db){this._db=db;}
DB.prototype.transaction=function(){return new Transaction(this._db.transaction.apply(this._db,arguments));};proxyProperties(DB,'_db',['name','version','objectStoreNames']);proxyMethods(DB,'_db',IDBDatabase,['close']);['openCursor','openKeyCursor'].forEach(function(funcName){[ObjectStore,Index].forEach(function(Constructor){Constructor.prototype[funcName.replace('open','iterate')]=function(){var args=toArray(arguments);var callback=args[args.length-1];var nativeObject=this._store||this._index;var request=nativeObject[funcName].apply(nativeObject,args.slice(0,-1));request.onsuccess=function(){callback(request.result);};};});});[Index,ObjectStore].forEach(function(Constructor){if(Constructor.prototype.getAll)return;Constructor.prototype.getAll=function(query,count){var instance=this;var items=[];return new Promise(function(resolve){instance.iterateCursor(query,function(cursor){if(!cursor){resolve(items);return;}
items.push(cursor.value);if(count!==undefined&&items.length==count){resolve(items);return;}
cursor.continue();});});};});var exp={open:function(name,version,upgradeCallback){var p=promisifyRequestCall(indexedDB,'open',[name,version]);var request=p.request;request.onupgradeneeded=function(event){if(upgradeCallback){upgradeCallback(new UpgradeDB(request.result,event.oldVersion,request.transaction));}};return p.then(function(db){return new DB(db);});},delete:function(name){return promisifyRequestCall(indexedDB,'deleteDatabase',[name]);}};if(typeof module!=='undefined'){module.exports=exp;module.exports.default=module.exports;}
else{self.idb=exp;}}());let restaurant;let reviews;var map;document.addEventListener('DOMContentLoaded',(event)=>{window.lazySizesConfig=window.lazySizesConfig||{};lazySizesConfig.loadMode=1;});window.initMap=()=>{fetchRestaurantFromURL((error,restaurant)=>{if(error){console.error(error);}else{self.map=new google.maps.Map(document.getElementById('map'),{zoom:16,center:restaurant.latlng,scrollwheel:false});google.maps.event.addListener(self.map,"tilesloaded",function(){[].slice.apply(document.querySelectorAll('#map a,button')).forEach(function(item){item.setAttribute('tabindex','-1');});document.getElementsByTagName('iframe')[0].setAttribute('title','Google Maps for restaurant');});fillBreadcrumb();DBHelper.mapMarkerForRestaurant(self.restaurant,self.map);}});}
fetchRestaurantFromURL=(callback)=>{if(self.restaurant){callback(null,self.restaurant)
return;}
const id=getParameterByName('id');if(!id){error='No restaurant id in URL'
callback(error,null);}else{DBHelper.fetchRestaurantById(id,(error,restaurant)=>{self.restaurant=restaurant;if(!restaurant){console.error(error);return;}
fillRestaurantHTML();callback(null,restaurant)});}}
fetchReviews=()=>{const id=getParameterByName('id');if(!id){console.log('No ID in URL');return;}
DBHelper.fetchReviewsForRestaurant(id,(err,reviews)=>{self.reviews=reviews;if(err||!reviews){console.log('reviews fetch error',err);return;}
fillReviewsHTML();});}
setFavoriteButton=(status)=>{const favorite=document.getElementById('favBtn');if(status==='true'){favorite.title='Restaurant is Favorite';favorite.innerHTML='⭐️ Unfavorite';}else{favorite.title='Restaurant is not Favorite';favorite.innerHTML='☆ Favorite';}}
fillRestaurantHTML=(restaurant=self.restaurant)=>{const name=document.getElementById('restaurant-name');name.innerHTML=restaurant.name;setFavoriteButton(restaurant.is_favorite);const address=document.getElementById('restaurant-address');address.innerHTML=restaurant.address;const image=document.getElementById('restaurant-img');image.className='restaurant-img lazyload';image.alt='Photo of '+restaurant.name;image.setAttribute('data-src',DBHelper.imageUrlForRestaurant(restaurant));image.src='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';const cuisine=document.getElementById('restaurant-cuisine');cuisine.innerHTML=restaurant.cuisine_type;if(restaurant.operating_hours){fillRestaurantHoursHTML();}
fetchReviews();}
fillRestaurantHoursHTML=(operatingHours=self.restaurant.operating_hours)=>{const hours=document.getElementById('restaurant-hours');for(let key in operatingHours){const row=document.createElement('tr');const day=document.createElement('td');day.innerHTML=key;row.appendChild(day);const time=document.createElement('td');time.innerHTML=operatingHours[key];row.appendChild(time);hours.appendChild(row);}}
fillReviewsHTML=(reviews=self.reviews)=>{const container=document.getElementById('reviews-container');const title=document.createElement('h3');title.innerHTML='Reviews';container.appendChild(title);if(!reviews){const noReviews=document.createElement('p');noReviews.innerHTML='No reviews yet!';container.appendChild(noReviews);return;}
const ul=document.getElementById('reviews-list');reviews.forEach(review=>{ul.appendChild(createReviewHTML(review));});container.appendChild(ul);}
createReviewHTML=(review)=>{const li=document.createElement('li');li.setAttribute('role','listitem');const name=document.createElement('p');name.innerHTML=review.name;li.appendChild(name);const date=document.createElement('p');date.innerHTML=getHumanDate(review.createdAt);li.appendChild(date);const rating=document.createElement('p');rating.innerHTML=`Rating: ${review.rating}`;li.appendChild(rating);const comments=document.createElement('p');comments.innerHTML=review.comments;li.appendChild(comments);return li;}
fillBreadcrumb=(restaurant=self.restaurant)=>{const breadcrumb=document.getElementById('breadcrumb');const li=document.createElement('li');li.innerHTML=restaurant.name;li.setAttribute('aria-current','page');breadcrumb.appendChild(li);}
getParameterByName=(name,url)=>{if(!url)
url=window.location.href;name=name.replace(/[\[\]]/g,'\\$&');const regex=new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),results=regex.exec(url);if(!results)
return null;if(!results[2])
return'';return decodeURIComponent(results[2].replace(/\+/g,' '));}
getHumanDate=(ts)=>{let date=new Date(ts);return date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();}
navigator.serviceWorker.ready.then(function(swRegistration){let form=document.querySelector('#review-form');form.addEventListener('submit',e=>{e.preventDefault();let rating=form.querySelector('#rating');let review={restaurant_id:getParameterByName('id'),name:form.querySelector('#name').value,rating:rating.options[rating.selectedIndex].value,comments:form.querySelector('#comment').value};console.log(review);idb.open('review',1,function(upgradeDb){upgradeDb.createObjectStore('outbox',{autoIncrement:true,keyPath:'id'});}).then(function(db){var transaction=db.transaction('outbox','readwrite');return transaction.objectStore('outbox').put(review);}).then(function(){form.reset();return swRegistration.sync.register('sync').then(()=>{console.log('Sync registered');});});});});navigator.serviceWorker.ready.then(function(swRegistration){let btn=document.getElementById('favBtn');btn.addEventListener('click',e=>{const opposite=(self.restaurant.is_favorite==='true')?'false':'true';console.log('clicked');let res={resId:getParameterByName('id'),favorite:opposite};idb.open('favorite',1,function(upgradeDb){upgradeDb.createObjectStore('outbox',{autoIncrement:true,keyPath:'id'});}).then(function(db){var transaction=db.transaction('outbox','readwrite');return transaction.objectStore('outbox').put(res);}).then(function(){setFavoriteButton(opposite);self.restaurant.is_favorite=opposite;return swRegistration.sync.register('favorite').then(()=>{console.log('Favorite Sync registered');});});});});