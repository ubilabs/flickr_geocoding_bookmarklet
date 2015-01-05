## What Is This?
**flickr_geocoding_bookmarklet** is a small script for geotagging Flickr photos using Google Maps.  Google Maps tends to offer superior zoom-in detail than Yahoo Maps which Flickr uses, so this script allows you to place your pictures on the map with greater accuracy.  It will also add a link to [loc.alize.us](https://loc.alize.us), a large Google Map that shows the most interesting Flickr photos in a given area, with your picture marked on the map as well.

## Usage
Follow these steps:

1. Create a new bookmark in your browser, and for the URL location copy the below text:

```
javascript:%20(function(){if(window.geocoding_bookmarklet){geocoding_bookmarklet.reload();return;}%20var%20script=document.createElement("script");script.src="https://cdn.rawgit.com/ubilabs/flickr_geocoding_bookmarklet/master/main.js?"%20+%20Math.random();document.body.appendChild(script);})();
```

2. Navigate to the details page of the Flickr photo you want to geotag
3. Click the bookmark
4. Place the arrow at the spot on the map where the picture was taken
5. Click "Save Location"
6. Done!

## More Information
Please see the [discussion on the Flickr forums about this bookmarklet](https://www.flickr.com/groups/geotagging/discuss/72157594165549916/) for more details or questions:
