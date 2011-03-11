/*  
  Written by Martin Kleppe, modified by Ken Mayer 2010.  
  Neither party is responsible for damage or loss due to use.
  http://www.flickr.com/groups/geotagging/discuss/72157594165549916/
*/
(function(window, undefined){
  
  var $,
    // BASE_URL = "http://192.168.1.208:8000/",
    BASE_URL = "http://github.com/ubilabs/flickr_geocoding_bookmarklet/raw/master/",
    JQUERY_SRC = "http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js",
    GMAPS_API = "http://maps.google.com/maps/api/js?sensor=false&callback=?",
    CONFIRM_URL = "http://www.flickr.com/flickrmap_locationconfirm_fragment.gne",
    SAVE_URL = "http://www.flickr.com/services/rest/?jsoncallback=?",
    POST_URL = "http://www.ﬂickr.com/services/rest/",
    BOOKMARK_URL = "http://www.flickr.com/groups/geotagging/discuss/72157594165549916/",
    MAGIC_COOKIE,
    API_KEY,
    API_SECRET,
    AUTH_TOKEN,
    AUTH_HASH,
    IS_OWNER,
    USER_NSID,
    PHOTO_ID,
    STYLE_URL = BASE_URL + "main.css?" + Number(new Date()),
    MARKER_SRC = BASE_URL + "/arrow.png",
    PANEL_SRC = "/photo_geopanel_fragment.gne",
    map,
    lat, 
    lng, 
    zoom,
    map_type,
    initial_position,
    address,
    marker,
    geocoder,
    $map,
    $input,
    $spinner,
    $container,
    $background,
    $save, 
    $cancel,
    $submit_form,
    THE_TAGS,
    THE_DESCRIPTION,
    THE_TITLE,
    LAST_TAG_REMOVED=false;
    
    
  function log(){
    if (window.console && typeof window.console.log == "function"){
      console.log.apply(console, arguments);
    }
  }
  
  function initialize(){
    
    if (!document.location.href.match("flickr.com")){
      if (document.location.href.match("github") || document.location.href.match("sumaato")) {
        // if he click the bookmarklet link at typolis, show him some infos who to use bookmarklets
        alert(
          "Localize Bookmarklet HowTo: \n " +
          "- Drag this link to your bookmarks. \n " +
          "- Rename it if you want. \n " +
          "- Visit your Flickr photo page. \n " +
          "- Click the bookmarklet to inject the fancy code."
        );
        
      } else {
        // ask user if he wants to move to Flickr
        var goto_flickr = confirm(
          "This bookmarklet does not work at this page.\n" +
          "Do you want to move over to Flickr?"
        );
        if (goto_flickr){
          document.location.href = "http://flickr.com/";
        }
      }
      return;
    }

    load_jquery();
    
    window.geocoding_bookmarklet = {
      initialize: initialize,
      reload: reload
    };

  }
  
  function reload(){
    show();
    $input.select();
    if (map){
      google.maps.event.trigger(map, "resize");
    }
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
    
    var script, match, get_secrets;
    
    script = $("script").not("[src]").last().html();

    get_secrets = function(key){     
      var regex, match;
      regex = new RegExp('"' + key + '":"([^"]*)"', "i");
      match = script.match(regex);
      return match && match[1];
    };
    
    MAGIC_COOKIE = $("input[name=magic_cookie]").val();
    
    API_SECRET = get_secrets("secret");
    API_KEY = get_secrets("api_key");
    AUTH_TOKEN = get_secrets("auth_token");
    AUTH_HASH = get_secrets("auth_hash");
    PHOTO_ID = get_secrets("photo_id");
    USER_NSID = get_secrets("nsid");
    IS_OWNER = /isOwner:\s*true/.test(script);  
        
    /* 
    * REGEX to match braces
    * \(\{(?:(?!\}).)*\}\);
    * 
    * photo_conf = script.match(/Y\.photo(\(\{[^\)]*\));/);
    * api_conf = script.match(/flickrAPI\:([^(\})]*\})/);
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
      get_initial_position();
      draw_panel(html);
      update_clicks();

      init_form();
      $spinner.hide();
      
      $.getJSON(GMAPS_API, function(){
        init_map();
        init_marker();
      });

    });
  }
  
  
  function update_clicks(){
    $("#photo-story-copyright").click(function(){
      reload();
      return false;
    });
  }
  
  function draw_empty_panel(){
    $container.addClass("no_location");
    $container.html(
      "<div>Uuuh no, this photo has no location :(</div>"
    );
    
    $cancel = $("<button class='Butt'>CLOSE THIS MESSAGE</button>");
    $container.append($cancel);
    $cancel.click(hide);
  }
  
  function draw_panel(html){
    
    var $close, $maximize;
    
    $background = $("<div>", {
      id: 'flickr_bookmarklet_background',
      title: "Close"
    });
    
    $background.click(hide);
    
    $container = $("<div>", {id: 'flickr_bookmarklet'});
    $container.html(html);
    
    $close = $container.find(".close");
    
    $close.click(hide);
    $maximize = $("<span class='maximize'>maximize</span>");
    
    $close.before($maximize);
    
    var maximized = false;
    $maximize.toggle(function(){
      var center = map.getCenter();
      $container.addClass("maximized");
      $maximize.html("restore");
      $map.height($(window).height() -140);
      google.maps.event.trigger(map, 'resize');
      map.setCenter(center);
    }, function(){
      var center = map.getCenter();
      $maximize.html("maximize");
      $container.removeClass("maximized");
      $map.height(400);
      google.maps.event.trigger(map, 'resize');
      map.setCenter(center);
    });
    
    $container.find(".breadcrumb h3").html(
      'Location for "'+
      $("meta[name='title']").attr("content") +
      '":'
    );

    $("body").append($container).append($background);
  }
  
  function init_form(){
    var $form, $button, $link;

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
    $save = $("<button class='Butt'>SAVE LOCATION</button>");
    
      $cancel = $("<button class='CancelButt'>CANCEL</button>");
      $container.append($save);
      $save.click(save_position);
    
    $link = $("<a href='http://www.flickr.com/groups/geotagging/discuss/72157594165549916/' target='_blank' class='link'>Feedback</a>");
    
    $submit_form = $("<div>", {id: "submit_form"});
    $container.append($cancel).append($spinner).append($submit_form).append($link);

    $cancel.click(cancel);
  }
  
  function getQueryVariable(variable, string) {
	  var vars = string.split("&");
	  for (var i=0; i<vars.length; i++) {
	    var pair = vars[i].split("=");
	    if (pair[0] == variable) {
	      return pair[1]; 
	    }
		}
		return "";
	}
	 
  function get_initial_position(){
    var src, match, last_location, parts = [];    
    src = $("#photo-story-map-zoom-street").attr("src");
    if (!src || src.indexOf("&clat")<1) {
      src = $("#photo-story-map-zoom-street").attr("data-defer-src");
    }
    
    if (src && getQueryVariable("clat", src)){
      initial_position = {    
	      lat :parseFloat(getQueryVariable("clat", src), 10),
	      lng :parseFloat(getQueryVariable("clon", src), 10),
	      zoom :20
     	};
    } else { 	
   		 // checks to see if the location is stored in geotags
   		 var theLinksText = $("#sidecar a").text();
   		 if (theLinksText.indexOf("geo:lat")>0) {
   			tagTrash = theLinksText.split("geo:lat=");
   			var clat=tagTrash[1].split("[")[0];
    		if (theLinksText.indexOf("geo:lon")>0) {
    			tagTrash = theLinksText.split("geo:lon=");
   				var clon=tagTrash[1].split("[")[0];
			  }
     		if (clat && clon){
		      initial_position = {    
			      lat :parseFloat(clat, 10),
			      lng :parseFloat(clon, 10),
			      zoom :20
		     	};
	      }
			}
   	}			
     
    last_location = get_cookie("location");
    
    if (last_location) {
      parts = last_location.split(",");
    } 
    
    if (initial_position){
      lat = initial_position.lat;
      lng = initial_position.lng;
      zoom = initial_position.zoom;
    } else {
      lat = parseFloat(parts[0], 10) || 30;
      lng = parseFloat(parts[1], 10) || 0;
      zoom = parseFloat(parts[2], 10) || 2;
    }
    
    map_type = parts[3];
    
    address = $("#photoGeolocation-storylink").html() || 
      get_cookie("address") || 
      "Enter place name or address.";
      address = address.replace(/&nbsp;/g," ");
  }
  
  function init_map(){
    $map = $container.find(".map");
    
    map = new google.maps.Map($map[0], {
      zoom: zoom,
      center: new google.maps.LatLng(lat, lng),
      mapTypeId: map_type || google.maps.MapTypeId.ROADMAP,
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
      title: "Drag me!" ,
      draggable: true,
      visible: true,
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
    check_position();
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
      magic_cookie: MAGIC_COOKIE,
      viewgeo: 0
    };
    
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
  
  function save_position(){
    var theDescription ="";
    var theTitle="";
    
    if ($save.hasClass("DisabledButt")){ return; }
    
    $save.removeClass("Butt").addClass("DisabledButt");
    var data = {}, form; 
    
    form = $submit_form.find(".flickrmap_locationconfirm");
    $.each(form.serializeArray(), function(){
      data[this.name] = this.value;
    });
    
    $spinner.show();
    
    $.post(CONFIRM_URL, data, function(confirmResponse){
                  
    }, "json");

    data = {
      format: "json",
      clientType: "yui-3-flickrapi-module",
      api_key: API_KEY,
      auth_hash: AUTH_HASH,
      auth_token: AUTH_TOKEN,
      secret: API_SECRET,
      photo_id: PHOTO_ID,
      lat: lat,
      lon: lng,
      accuracy: Math.min(16, map.getZoom()),
      method: "flickr.photos.geo.setLocation",
      cachebust: Number(new Date())
    };
    
    if (IS_OWNER) {
    	$.getJSON(SAVE_URL, data, function(saveResponse){		      
	      if (saveResponse.stat == "ok"){
	        form.html("Location Saved");
	        getInfo();
	      } else {
	        form.html("Error: " + saveResponse.message);
	      }
	    });
  	} else {
		  getInfo();
  	}
  }

  // gets the photo title, description, and tags       
  function getInfo() {
    var data = {
      format: "json",
      clientType: "yui-3-flickrapi-module",
      api_key: API_KEY,
      auth_hash: AUTH_HASH,
      auth_token: AUTH_TOKEN,
      secret: API_SECRET,
      photo_id: PHOTO_ID,
      method: "flickr.photos.getInfo",
      cachebust: Number(new Date())
    };

    $.getJSON(SAVE_URL, data, function(infoResponse){
      if (infoResponse.stat == "ok"){
        THE_TAGS = infoResponse.photo.tags.tag;
     	  THE_DESCRIPTION = infoResponse.photo.description._content;    	
     	  THE_TITLE = infoResponse.photo.title._content;
        removeTags(THE_TAGS);
      } else {
        form.html("Error getting data: " + infoResponse.message);
      }
    });
  }

  function removeTags(tagArray) {
		var removeArray = [];
		
		if (IS_OWNER) {
			$.each(tagArray, function() {
			  if (this.raw.indexOf("geo:")>-1) {
			    removeArray.push(this.id);  
			  }
			});
		} else {
			$.each(tagArray, function() {
			  if (this.raw.indexOf("geo:")>-1 && this.author==USER_NSID){
			    removeArray.push(this.id);
			  }
			});
		}
 			
 		while (removeArray.length > 0) { 
			var removeMe=removeArray.shift();
	  
	    if (removeArray.length == 0) { 
	      LAST_TAG_REMOVED = true;
	    }
	      
	    data = {
	      format: "json",
	      clientType: "yui-3-flickrapi-module",
	      api_key: API_KEY,
	      auth_hash: AUTH_HASH,
	      auth_token: AUTH_TOKEN,
		    secret: API_SECRET,
	      photo_id: PHOTO_ID,
	   	  tag_id: removeMe,
	      method: "flickr.photos.removeTag",
	      cachebust: Number(new Date())  
	    };
	    
		  $.getJSON(SAVE_URL, data, function(removeResponse){
		    if (removeResponse.stat == "ok" && LAST_TAG_REMOVED) { 
			    saveGeotags(); 
			  }
		  });
		}
		if (!LAST_TAG_REMOVED) {
		  saveGeotags(); 
		  // if there were no tags to remove
		}
 	}

  // saves the geotags
  function saveGeotags() {
    var data, theTag = "geo:lat=" + lat + " geo:lon=" + lng + " geotagged";
    data = {
      format: "json",
      clientType: "yui-3-flickrapi-module",
      api_key: API_KEY,
      auth_hash: AUTH_HASH,
      auth_token: AUTH_TOKEN,
      secret: API_SECRET,
      photo_id: PHOTO_ID,
      tags: theTag,
      method: "flickr.photos.addTags",
      cachebust: Number(new Date())
    };
    
    $.getJSON(SAVE_URL, data, function(tagResponse){
     var form = $submit_form.find(".flickrmap_locationconfirm");
      if (tagResponse.stat == "ok"){
        form.html("Geotags saved.");
        if (IS_OWNER){
          setDescription();
        } else {
          addComment(theTag);
        }
      } else {
        form.html("Geotag error: " + tagResponse.message);
        if (!IS_OWNER) {
          theTag = "http://maps.google.com/maps?q=loc:" + theTag;
        	addComment(theTag);
        }
      }
    });
  }

	// puts the loc.alize.us link in a comment
  function addComment(theTag) {
    var theComment = "See where this picture was taken.";
    
    if (theTag.indexOf("google.com")>0){
    	theTag = theTag.replace("geo:lat=","");
    	theTag = theTag.replace("geo:lon=",",");
		  theTag = theTag.replace(" geotagged","&z=18");
		  theTag = theTag.replace(/ /g,"");
		  theComment = theComment + ": " + theTag + " <a href='" + BOOKMARK_URL + "'>[?]</a>";
		} else {
		  theComment = "<a href='http://loc.alize.us/#/flickr:" + PHOTO_ID + "'>" + theComment + ".</a> <a href='" + BOOKMARK_URL + "'>[?]</a>";
		}
		
   	var data = {
      format: "json",
      clientType: "yui-3-flickrapi-module",
      api_key: API_KEY,
      auth_hash: AUTH_HASH,
      auth_token: AUTH_TOKEN,
	    secret: API_SECRET,
      photo_id: PHOTO_ID,
      comment_text: theComment,
      method: "flickr.photos.comments.addComment",
      cachebust: Number(new Date())
    };
    
    $.getJSON(SAVE_URL, data, function(comResponse){
      var form = $submit_form.find(".flickrmap_locationconfirm");
      if (comResponse.stat == "ok"){
        form.html("Comment saved");
        window.location.reload();  
        // closes the map window after saving all locations and tags
      } else {
        form.html("Comment error: " + comResponse.message);
      }
    });
  }     

  // appends the loc.alize.us link to the description
  function setDescription() {
    var theDescription = expungeLocalize(THE_DESCRIPTION);
    theDescription = theDescription + "\r\r<a href='http://loc.alize.us/#/flickr:" + PHOTO_ID + "'>See where this picture was taken.</a> <a href='" + BOOKMARK_URL + "'>[?]</a>";
    
   	var data = {
      format: "json",
      clientType: "yui-3-flickrapi-module",
      api_key: API_KEY,
      auth_hash: AUTH_HASH,
      auth_token: AUTH_TOKEN,
	    secret: API_SECRET,
      photo_id: PHOTO_ID,
      description: theDescription,
      title:THE_TITLE,
      method: "flickr.photos.setMeta",
      cachebust: Number(new Date())
    };
    
    $.getJSON(SAVE_URL, data, function(localResponse){
      var form = $submit_form.find(".flickrmap_locationconfirm");

      if (localResponse.stat == "ok"){
        form.html("Saved");
        window.location.reload();  // closes the map window after saving all locations and tags
      } else {
        form.html("Loc.alize.us error: " + localResponse.message);
      }
    });
  }     
 
  function expungeLocalize(theString) {
		var regEx = new RegExp("<a.*/a>", "gi");
		var theLinks = theString.match(regEx);
		if (theLinks) {
  		for (var i=0;i<theLinks.length;i++){
  			if (theLinks[i].indexOf("geolicker")>0) {
  			  theString = theString.replace(theLinks[i],"");
  			}
  		}  		  
		}
		return theString;
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
    $background && $background.show();
    $container && $container.show();
  }
  
  function hide(){
  	window.location.reload();
  }
  
  initialize();

})(window);