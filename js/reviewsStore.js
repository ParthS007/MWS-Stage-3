var reviewsStore = {
    db: null,
   
    init: function() {
      if (reviewsStore.db) { return Promise.resolve(reviewsStore.db); }
      return idb.open('revsidb', 1, function(UpgradeDb) {
        UpgradeDb.createObjectStore('revsidb', { autoIncrement : true, keyPath: 'id' });
      }).then(function(db) {
        return reviewsStore.db = db;
      });
    },
   
    revsidb: function(mode) {
      return reviewsStore.init().then(function(db) {
        return db.transaction('revsidb', mode).objectStore('revsidb');
      })
    }
  }
