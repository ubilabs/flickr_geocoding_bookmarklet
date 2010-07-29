(function(window, undefined){
  
  var BASE_URL = "http://localhost:8000/",
    JQUERY_SRC = "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js",
    GMAPS_API = "http://maps.google.com/maps/api/js?sensor=false&callback=?",
    STYLE_URL = BASE_URL + "main.css",
    PANEL_SRC = "/photo_geopanel_fragment.gne",
    magic_cookie,
    container,
    background;
  
  function initialize(){
    load_jquery();
  }
  
  function reload(){
    show();
  }
  
  function load_jquery(){
    var script = document.createElement("script");
    script.src = JQUERY_SRC;
    script.onload = script.onreadystatechange = jquery_loaded;
    document.body.appendChild(script);
  }

  function load_styles(){
    var style = $("<link />", {
      rel: "stylesheet",
      type: "text/css",      
      href: STYLE_URL
    });
    console.log(style);
    $("head").append(style);
  }
  
  function jquery_loaded(){
    console.log("jQuery loaded", $);
    load_styles();
    magic_cookie = $("input[name=magic_cookie]").val();
    $.getJSON(GMAPS_API, create_map);
  }
  
  function create_map(){
    console.log("MAP API loaded", google.maps);
    console.log("cookie", magic_cookie);
  
    $.get(PANEL_SRC, function(html){
      console.log(arguments);
      
      background = $("<div>", {
        id: 'flickr_bookmarklet_background',
        title: "Close"
      });
      background.click(hide);
      
      container = $("<div>", {id: 'flickr_bookmarklet'});
      container.html(html);
      
      container.find(".close").click(hide);
      
      $("body").append(container).append(background);
      
      var map = new google.maps.Map(container.find(".map")[0], {
        zoom: 8,
        center: new google.maps.LatLng(-34.397, 150.644),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
      
      
      
      
    });
  }

  function show(){
    background.show();
    container.show();
  }

  
  function hide(){
    background.hide();
    container.hide();
  }
    
  
  window.geocoding_bookmarklet = {
    initialize: initialize,
    reload: reload
  };
  
  initialize();
  
  console.log(window.geocoding_bookmarklet);
})(window);


