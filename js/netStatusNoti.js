function isOnline() {
    var connectionStatus = document.getElementById('connectionStatus');
    if (navigator.onLine){
      connectionStatus.innerHTML = 'You are currently online!';
      connectionStatus.style = "color:green; font-weight:bolder;";
    }
    else{
      connectionStatus.innerHTML = 'Offline! Requests will be synced when online again.';
      connectionStatus.style = "color:red; font-weight:bolder;";
    }
  }
  window.addEventListener('online', isOnline);
  window.addEventListener('offline', isOnline);
  isOnline();