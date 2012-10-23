CONFIG = {

  lat:     30.849,
  lng:    -28.371,
  zoom:    3,
  maxZoom: 9,
  minZoom: 4,
  userName: 'viz2',
  //userName: 'wsjgraphics02',
  tableName: 'cty0921md',
  refreshInterval: 3000,

  style: "#st0921md { line-width:1; line-opacity:1; } \
    [status='none'] { line-color: #ffffff; polygon-fill: #eeeeee;  } \
    [status='RR']   { line-color: #ffffff; polygon-fill: #c72535;  } \
    [status='R']    { line-color: #ffffff; polygon-fill: #c72535;  } \
    [status='D']    { line-color: #ffffff; polygon-fill: #5c94ba;  } \
    [status='DD']   { line-color: #ffffff; polygon-fill: #0073a2;  } \
    [status='I']    { line-color: #999999; polygon-fill: #FFEEC3;  } \
    [status='II']   { line-color: #999999; polygon-fill: #FFEEC3;  } \
    [status='U']    { line-color: #666666; polygon-fill: #ffffff;  }",

  polygonHoverStyle: { color: "#ff7800", weight: 5, opacity: 0.65, clickable:false },
  polygonClickStyle: { color: "red", weight: 5, opacity: 0.65, clickable:false }


};

var
hoverData       = null,
timeID          = null,
request         = null,
timer           = null,
lastUpdate      = null;

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

function createLayer(updatedAt, opacity) {

  var query = "SELECT st_name, st_usps, cty0921md.the_geom_webmercator, cty0921md.cartodb_id, states_results.gov_result as status, cty0921md.fips as thecode, cty0921md.st_usps as usps FROM cty0921md, states_results WHERE states_results.usps = cty0921md.st_usps";

  return new L.CartoDBLayer({
    map: map,
    user_name:  CONFIG.userName,
    table_name: CONFIG.tableName,
    tile_style: CONFIG.style,
    opacity:    opacity,
    query:      query,

    extra_params: {
      cache_buster: updatedAt
    },

    interactivity: "cartodb_id, status, st_usps",

    featureOver: onFeatureHover,
    featureOut: onFeatureOut,
    featureClick: onFeatureClick
  });

}

// Fade out the layer
function fadeOut(lyr) {

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

function onLayerLoaded(layerNew) {

  layerNew.off("load", null, layerNew); // unbind the load event
  showMessage("Map updated");

  if (oldIE) {

    map.removeLayer(layer);

    delete layer;
    layer = layerNew;

  } else {
    fadeOut(layerNew);
  }

}

function refresh() {

  var tableName = 'states_results';
  var url = "http://" + CONFIG.userName + ".cartodb.com/api/v2/sql?q=" + escape("SELECT updated_at FROM " + tableName + " ORDER BY updated_at DESC LIMIT 1");

  $.ajax({ url: url, cache: true, jsonpCallback: "callback", dataType: "jsonp", success: function(data) {

    if (!data.rows) {
      data = JSON.parse(data);
    }

    var updatedAt     = data.rows[0].updated_at;
    var updatedAtDate = moment(updatedAt);

    if (updatedAtDate > lastUpdate) { // Update the map

      if (!layer) { // create layer

        layer = createLayer(updatedAt, 1);

        map.addLayer(layer, false);

        startStopWatch();

      } else { // update layer

        showMessage("New data coming…");

        // old IE versions doesn't support opacity, in that case we create
        // a visible layer
        var opacity = (oldIE) ? 1 : 0;

        var layerNew = createLayer(updatedAt, opacity);

        map.addLayer(layerNew, false);

        layerNew.on("load", function() {
          onLayerLoaded(this);
        });

      }

      lastUpdate = updatedAtDate;
    }

  }});

  if (!timer) { // creates the timer
    timer = setInterval(refresh, CONFIG.refreshInterval);
  }
}

function getHoverData() {

  var url = "http://com.cartodb.uselections.s3.amazonaws.com/hover_geoms/cty0921md_01.js";

  $.ajax({ url: url, jsonpCallback: "callback", dataType: "jsonp", success: function(data) {
    hoverData = data;
  }});

}

function initialize() {

  setupStopWatch();

  // Initialize the popup
  popup = new L.CartoDBPopup();

  getHoverData();

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

  refresh(); // Start!
}

