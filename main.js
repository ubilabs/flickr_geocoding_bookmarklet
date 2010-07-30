(function(window, undefined){
  
  var $,
    BASE_URL = "http://192.168.1.208:8000/",
    JQUERY_SRC = "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js",
    GMAPS_API = "http://maps.google.com/maps/api/js?sensor=false&callback=?",
    CONFIRM_URL = "http://www.flickr.com/flickrmap_locationconfirm_fragment.gne",
    API_KEY = "995363218486416e071f63716270f2b8",
    API_SECRET = "b4564eec14c76652",
    AUTH_TOKEN = "",
    AUTH_HASH = "56c4fe04a1435245b80bc3d2866777ff",    
    STYLE_URL = BASE_URL + "main.css",
    MARKER_SRC = BASE_URL + "/arrow.png",
    PANEL_SRC = "/photo_geopanel_fragment.gne",
    magic_cookie,
    map,
    lat, 
    lng, 
    zoom,
    map_type,
    initial_position,
    address,
    marker,
    geocoder,
    $input,
    $spinner,
    $container,
    $background,
    $save, 
    $cancel,
    $submit_form;
    
  function log(){
    if (window.console && typeof window.console.log == "function"){
      console.log.apply(console, arguments);
    }
  }
  
  function initialize(){
    load_jquery();
  }
  
  function reload(){
    show();
    $input.select();
    google.maps.event.trigger(map, "resize");
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
    $("head").append(style);
  }
  
  function get_secrets(){
    
    var script, match;
    
    magic_cookie = $("input[name=magic_cookie]").val();
  
    script = $("script").not("[src]").last().html();
    
    match = script.match(/auth_hash: '([A-Za-z0-9]+)'/);
    
    alert(match && match[1]);
    
    /*  
      http://code.google.com/p/patr/source/browse/trunk/flickrpage.js
      http://www.flickr.com/services/rest/?format=json
        clientType=yui-3-flickrapi-module
        api_key=995363218486416e071f63716270f2b8
        auth_hash=3494b85736b63e6f1c44cbf7ea147440
        auth_token=
        secret=b4564eec14c76652
        lat=53.536813370674
        lon=9.9630017278832
        accuracy=13
        context=last
        method=flickr.people.geo.setLocation
        jsoncallback=YUI.flickrAPITransactions.flapicb4
        cachebust=1280495962408


      http://www.flickr.com/services/rest/?format=json
        clientType=yui-3-flickrapi-module
        api_key=995363218486416e071f63716270f2b8
        auth_hash=3494b85736b63e6f1c44cbf7ea147440
        auth_token=
        secret=b4564eec14c76652
        is_public=1
        is_contact=1
        is_friend=1
        is_family=1
        photo_id=4811794241
        method=flickr.photos.geo.setPerms
        jsoncallback=YUI.flickrAPITransactions.flapicb6
        cachebust=1280495963647



      ftxt.match(/api_key: '([A-Za-z0-9]+)'/);
      ftxt.match(/auth_hash: '([A-Za-z0-9]+)'/);
      ftxt.match(/nsid: '(.*)'/g);
      ftxt.match(/photos_url: '(.*)'/g);


    */
    
    
    /* 
    * REGEX to match braces
    * \(\{(?:(?!\}).)*\}\);
    * 
    * photo_conf = script.match(/Y\.photo(\(\{[^\)]*\));/);
    * api_conf = script.match(/flickrAPI\:([^(\})]*\})/);
    *
    * 
    * 
    * console.log(api_conf && api_conf[1], photo_conf && photo_conf[1]);
    * console.log(eval(photo_conf[1]));
    * console.log(eval("(" + api_conf[1] + ")"));
    * 
    */
    
    
  }
  
  function jquery_loaded(){
    
    $ = jQuery;
    $.noConflict();
    load_styles();
    get_secrets();
    
    $.get(PANEL_SRC, function(html){
      draw_panel(html);
      $.getJSON(GMAPS_API, function(){
        init_map();
        init_marker();
      });

      init_form();
      $spinner.hide();
    });
  }
    
  function draw_panel(html){
    
    log("magic cookie", magic_cookie, 1234);
    
    $background = $("<div>", {
      id: 'flickr_bookmarklet_background',
      title: "Close"
    });
    
    $background.click(hide);
    
    $container = $("<div>", {id: 'flickr_bookmarklet'});
    $container.html(html);
    $container.find(".close").click(hide);
    $container.find(".breadcrumb h3").html(
      'Choose your location for "'+
      $("meta[name='title']").attr("content") +
      '":'
    );


    $("body").append($container).append($background);
  }
  
  function init_form(){
    var $form, $button;

    $form = $container.find("form[name=location_search]");
    $input = $form.find("input");
    $button = $form.find("button");
    
    $form.prepend($("<label>", {
      "for": $input.attr("id")      
    }).html("Search:"));
    
    $form.submit(function(){
      address = $input.val();
      find(address);
      set_cookie("address", address);
      return false;
    });
    
    $spinner = $("<div class='spinner'/>");
    $save = $("<button class='DisabledButt'>SAVE LOCATION</button>");
    $cancel = $("<button class='CancelButt'>CANCEL</button>");
    $submit_form = $("<div>", {id: "submit_form"});
    $container.append($save).append($cancel).append($spinner).append($submit_form);
    
    $save.click(save_postion);
    $cancel.click(cancel);
  }
  
  function get_initial_position(){
    var src, match, last_location, parts = [];
    
    src = $("#photo-story-map img:last").attr("src") || "";
    match = src.match(/clat=([\d.-]*)&clon=([\d.-]*)&zoom=([\d.-]*)/);
    
    if (match){
      initial_position = {
        lat: parseFloat(match[1], 10),
        lng: parseFloat(match[2], 10),
        zoom: parseFloat(match[3], 10)
      };
    }
    
    last_location = get_cookie("location");
    
    if (last_location) {
      parts = last_location.split(",");
    } 
    
    if (initial_position){
      lat = initial_position.lat;
      lng = initial_position.lng ;
      zoom = initial_position.zoom;
    } else {
      lat = parseFloat(parts[0], 10) || 30;
      lng = parseFloat(parts[1], 10) || 0;
      zoom = parseFloat(parts[2], 10) || 2;
    }
    
    map_type = parts[3] || google.maps.MapTypeId.ROADMAP;
    
    address = $("#photoGeolocation-storylink").html() || 
      get_cookie("address") || 
      "Enter place name or address.";
  }
  
  function init_map(){
    
    get_initial_position();
    
    map = new google.maps.Map($container.find(".map")[0], {
      zoom: zoom,
      center: new google.maps.LatLng(lat, lng),
      mapTypeId: map_type,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }
    });
    
    geocoder = new google.maps.Geocoder();
    
    $input.val(address).select();
  }
  
  function init_marker(){
    var icon, shadow, infowindow, message, show_info, hide_info, info_hidden;
      
    icon = new google.maps.MarkerImage(MARKER_SRC,
      new google.maps.Size(21, 29),
      new google.maps.Point(0,0),
      new google.maps.Point(9, 28)
    );

    shadow = new google.maps.MarkerImage(MARKER_SRC,
      new google.maps.Size(21, 18),
      new google.maps.Point(0,29),
      new google.maps.Point(2, 17)
    );
    
    marker = new google.maps.Marker({
      map: map,
      title: "Drag me!",
      draggable: true,
      visible: !!initial_position,
      icon: icon,
      position: map.getCenter(),
      shadow: shadow
    });
    
    message = "<h3>Drag me</h3>";
    
    infowindow = new google.maps.InfoWindow();
    info_hidden = true;
    
    show_info = function() {
      infowindow.setContent(message);
      infowindow.open(map, marker);
      info_hidden = false;
    };
    
    hide_info = function(){
      infowindow.close();
      info_hidden = true;
    };

    google.maps.event.addListener(marker, 'click', function(){
      if (info_hidden){
        show_info();
      } else {
        hide_info();
      }
    });
    
    google.maps.event.addListener(marker, 'dragend', function(){
      position(marker.getPosition());
    });
    
    google.maps.event.addListener(map, 'click', function(event) {
      if (event.latLng){
        hide_info();
        position(event.latLng);
      }
    });
  }
  
  function position(latLng, skip_server){
    
    marker.setPosition(latLng);
    
    lat = latLng.lat();
    lng = latLng.lng();
    
    if (!marker.getVisible()){
      marker.setVisible(true);
    }
    
    var info = [
      latLng.toUrlValue(),
      map.getZoom(),
      map.getMapTypeId()
    ];
    
    set_cookie("location", info.join(","));
    
    if (!skip_server){
      check_position();
    }
  }
  
  function check_position(){
    
    var data, edit_mode;
    
    edit_mode = initial_position ? "edit" : "add";
    
    data = {
      accuracy: map.getZoom(),
      center_map: true,
      edit_mode: "0," + edit_mode,
      latitude: lat,
      longitude: lng,
      magic_cookie: magic_cookie,
      viewgeo: 0
    };
    
    console.log(data);
    
    $spinner.show();
    $submit_form.html("");
    
    $.post(CONFIRM_URL, data, function(html){
     
      $submit_form.html(html);
      
      $submit_form.find("fieldset div div").html("Location:");
      $submit_form.find("[name=save_perm_viewgeo]").parent().parent().hide();
      
      $spinner.hide();     
      $save.removeClass("DisabledButt").addClass("Butt");
    });
  }
  
  function save_postion(){
    
    if ($save.hasClass("DisabledButt")){ return; }
    
    var data = {}, form; 
    
    form = $submit_form.find(".flickrmap_locationconfirm");
    
    $.each(form.serializeArray(), function(){
      data[this.name] = this.value;
    });
    
    $.post(CONFIRM_URL, data, function(html){
     
      console.log(arguments);
      $spinner.hide();     
      $save.addClass("DisabledButt").removeClass("Butt");
    }, "json");
  }

  
  function find(address){
    var options = {
      address: address,
      bounds: map.getBounds()
    };
    
    geocoder.geocode(options, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var geometry = results[0].geometry;
        map.fitBounds(geometry.viewport);
        position(geometry.location);
      } else {
        alert("Could not find location.");
        $input.select();
      }
    });
  }
  
  function set_cookie(name, value){
    var one_year = 365*60*60*24*200,
      expire = new Date((new Date().getTime()) + one_year);
    
    document.cookie = "ubilabs_" +  
      name + "=" + 
      escape(value) + "; expires=" + 
      expire.toGMTString() + "; path=/";
  }
  
  function get_cookie(name){
    var regex, match;
    
    regex = new RegExp("ubilabs_" + name + "[^\=]*=([^\;]*)");
    match = document.cookie.match(regex);
    
    return match && unescape(match[1]);
  }

  function cancel(){
    
    var latLng;
    
    if (initial_position){
      latLng = new google.maps.LatLng(
        initial_position.lat, 
        initial_position.lng
      );
      position(latLng, true);
      map.setCenter(latLng);
      map.setZoom(initial_position.zoom);
    } else {
      marker.setVisible(false);
    }
    
    $save.removeClass("Butt").addClass("DisabledButt");
    $submit_form.html("");
    hide();  
  }

  function show(){
    $background.show();
    $container.show();
  }
  
  function hide(){
    $background.hide();
    $container.hide();
  }
  
  window.geocoding_bookmarklet = {
    initialize: initialize,
    reload: reload
  };
  
  initialize();

})(window);


