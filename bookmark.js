(function() {
  if (window.geocoding_bookmarklet){
    geocoding_bookmarklet.reload();
    return;
  }
  var script = document.createElement("script");
  script.src = "http://localhost:8000/main.js";
  document.body.appendChild(script);
})();


// javascript:var%20bookmarkletURL=%22http://labs.sumaato.net/scripts/localizeBookmarklet.js%22;if(typeof%20localizeBookmarklet==%22undefined%22)%7Bvar%20script=document.createElement(%22script%22);script.type=%22text/javascript%22;script.src=bookmarkletURL;var%20head=document.getElementsByTagName(%22head%22)%5B0%5D;head.appendChild(script);%7Delse%7BlocalizeBookmarklet.show();%7Dvoid%200;
// javascript:%7Dvoid%200;

javascript:%20(function(){if(window.geocoding_bookmarklet){geocoding_bookmarklet.reload();return;}%20var%20script=document.createElement("script");script.src="http://github.com/ubilabs/flickr_geocoding_bookmarklet/raw/master/main.js?" + Math.random();document.body.appendChild(script);})();