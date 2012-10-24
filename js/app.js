CONFIG = {

  lat:     30.849,
  lng:    -28.371,
  zoom:    3,
  maxZoom: 9,
  minZoom: 4,

  // CartoDB user and main table name
  userName: 'viz2',
  tableName: 'counties',

  // number of ms between refreshes
  refreshInterval: 3000,

  // We can observe another table and update the map when it's updated
  watchedUserName: 'viz2',
  watchedTableName: 'states_results',

  style: "#counties { line-width:1; line-color: #ffffff; } \
    [status='none']  { polygon-fill: #eeeeee; } \
    [status='RR']    { polygon-fill: #c72535; } \
    [status='R']     { polygon-fill: #c72535; } \
    [status='D']     { polygon-fill: #5c94ba; } \
    [status='DD']    { polygon-fill: #0073a2; } \
    [status='I']     { polygon-fill: #FFEEC3; } \
    [status='II']    { polygon-fill: #FFEEC3; } \
    [status='U']     { polygon-fill: #ffffff; } ",

  polygonHoverStyle: { color: "#ff7800", weight: 5, opacity: 0.65, clickable:false },
  polygonClickStyle: { color: "red",     weight: 5, opacity: 0.65, clickable:false }

};

var
hoverData       = null,
timeID          = null,
request         = null,
timer           = null,
lastEpoch      = null;

var
popup           = null,
map             = null;

var // layers
layer           = null,
geojsonLayer    = new L.GeoJSON(null),
clickLayer      = new L.GeoJSON(null);

var oldIE = ($.browser.msie && $.browser.version < 9) ? true : false;

// Request animation frame
window.cancelRequestAnimFrame = ( function() {
  return window.cancelAnimationFrame       ||
  window.webkitCancelRequestAnimationFrame ||
  window.mozCancelRequestAnimationFrame    ||
  window.oCancelRequestAnimationFrame      ||
  window.msCancelRequestAnimationFrame     ||

  function( callback ){
    window.clearTimeout(timeID);
  };

})();

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame   ||
  window.mozRequestAnimationFrame      ||
  window.oRequestAnimationFrame        ||
  window.msRequestAnimationFrame       ||

  function( callback ){
    timeID = window.setTimeout(callback, 1000 / 60);
  };

})();


// Stop watch methods
function setupStopWatch() {
  $('.last-update').stopwatch({format: 'Last update: <strong>{Minutes} and {seconds} ago</strong>'});
}

function startStopWatch() {
  $(".last-update").stopwatch('start');
}

function resetStopWatch() {
  $(".last-update").stopwatch('reset');
}

function showMessage(message) {

  $(".message").html(message);

  $(".message").animate({ opacity: 1, top: 0 }, { duration: 250, complete: function() {

    setTimeout(function() {
      $(".message").animate({ opacity: 0, top: "-40px" }, 250);
    }, 3000);

  }});
}

// Adds a polygon in the area where the user clicked
function addClickPolygon(data) {

  if (!hoverData) return;

  map.removeLayer(clickLayer);

  var polygon = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [hoverData[data.cartodb_id]]
    }
  };

  clickLayer = new L.GeoJSON(polygon, { style: CONFIG.polygonClickStyle });
  map.addLayer(clickLayer);

  clickLayer.cartodb_id = data.cartodb_id;
}

// Adds a hihglighted polygon
function highlightPolygon(data) {

  if (!hoverData) return;

  // Show the hover polygon if it is a different feature
  map.removeLayer(geojsonLayer);

  var polygon = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [hoverData[data.cartodb_id]]
    }
  };

  geojsonLayer = new L.GeoJSON(polygon, { style: CONFIG.polygonHoverStyle });
  map.addLayer(geojsonLayer);

  geojsonLayer.cartodb_id = data.cartodb_id;

}

function onFeatureClick(e, latlng, pos, data) {

  if (typeof( window.event ) != "undefined" ) { // IE
    e.cancelBubble=true;
  } else { // Rest
    e.preventDefault();
    e.stopPropagation();
  }

  // Set popup content
  popup.setContent(data);

  // Set position
  popup.setLatLng(latlng);

  // Show the popup
  map.openPopup(popup);
  addClickPolygon(data);
}

function onFeatureOut() {

  if (!hoverData) return;

  document.body.style.cursor = "default";

  geojsonLayer.cartodb_id = null;
  geojsonLayer.off("featureparse");
  map.removeLayer(geojsonLayer)

}

function onFeatureHover(e, latlng, pos, data) {
  document.body.style.cursor = "pointer";

  highlightPolygon(data);
}

function createLayer(epoch, opacity) {

  var query = "SELECT st_name, st_usps, counties.the_geom_webmercator, counties.cartodb_id, states_results.gov_result as status, counties.fips as thecode, counties.st_usps as usps FROM counties, states_results WHERE states_results.usps = counties.st_usps";

  return new L.CartoDBLayer({
    map: map,

    user_name:  CONFIG.userName,
    table_name: CONFIG.tableName,
    tile_style: CONFIG.style,
    opacity:    opacity,
    query:      query,

    extra_params: {
      cache_buster: epoch
    },

    interactivity: "cartodb_id, status, st_usps",

    featureOver:  onFeatureHover,
    featureOut:   onFeatureOut,
    featureClick: onFeatureClick
  });

}

// Fade in and switch the layers
function fadeIn(lyr) {

  var
  deleted = false,
  opacity = 0;

  (function animloop(){

    request = requestAnimFrame(animloop);

    lyr.setOpacity(opacity);

    opacity += .05;

    if (!deleted && opacity >= 1 ) {

      opacity = 0;
      deleted = true;

      resetStopWatch();

      cancelRequestAnimFrame(request);

      // Switch layers
      map.removeLayer(layer);

      delete layer;
      layer = lyr;

      map.invalidateSize(false);
    }

  })();
}

// When the new layer is fully loaded, we show it gradually.
// Then we remove the old layer.
function onLayerLoaded(layerNew) {

  layerNew.off("load", null, layerNew); // unbind the load event
  showMessage("Map updated");

  if (oldIE) { // since IE<9 doesn't support opacity, we just remove the layer

    map.removeLayer(layer);

    delete layer;
    layer = layerNew; // layer switch

  } else {
    fadeIn(layerNew);
  }

}

function refresh() {

  // We ping this URL every 3000 ms (or the number defined in CONFIG.refreshInterval) and if the table was updated we create a new layer.
  var url = "http://" + CONFIG.watchedUserName + ".cartodb.com/api/v2/sql?q=" + escape("SELECT EXTRACT(EPOCH FROM updated_at) AS epoch_updated FROM " + CONFIG.watchedTableName + " ORDER BY updated_at DESC LIMIT 1");

  $.ajax({ url: url, cache: true, jsonpCallback: "callback", dataType: "jsonp", success: function(data) {

    try {

      if (!data.rows) {
        data = JSON.parse(data);
      }

    } catch(e) {
      // console.log(e);
      return;
    }

    var epoch = data.rows[0].epoch_updated;

    if (epoch > lastEpoch) { // Update the map

      if (!layer) { // create layer

        layer = createLayer(epoch, 1);

        map.addLayer(layer, false);

        startStopWatch();

      } else { // update layer

        showMessage("New data coming…");

        var opacity = (oldIE) ? 1 : 0; // since IE<9 versions don't support opacity we just create a visible layer

        var layerNew = createLayer(epoch, opacity);

        map.addLayer(layerNew, false);

        layerNew.on("load", function() {
          onLayerLoaded(this);
        });

      }

      lastEpoch = epoch;
    }

  }});

  if (!timer) { // creates the timer
    timer = setInterval(refresh, CONFIG.refreshInterval);
  }
}

// To maximize the feature hover/out speed we load the geometries of the counties in a hash
function getHoverData() {

  var url = "http://com.cartodb.uselections.s3.amazonaws.com/hover_geoms/cty0921md_01.js";

  $.ajax({ url: url, jsonpCallback: "callback", dataType: "jsonp", success: function(data) {
    hoverData = data;
  }});

}

function init() {

  setupStopWatch();

  // Initialize the popup
  popup = new L.CartoDBPopup();

  // Get the counties' geometries
  getHoverData();

  // Set the map options
  var mapOptions = {
    center: new L.LatLng(CONFIG.lat, CONFIG.lng),
    zoom: CONFIG.zoom,
    maxZoom: CONFIG.maxZoom,
    minZoom: CONFIG.minZoom,
    zoomAnimation: true,
    fadeAnimation: true
  };

  map = new L.Map('map', mapOptions);

  map.on("popupclose", function() {
    map.removeLayer(clickLayer);
  });

  refresh(); // Go!
}
