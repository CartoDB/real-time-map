var $ = require('jquery');
var http = require('http');

var numDecimals   = 3;
var table         = "cty0921md";
var cartodbUser   = "wsjgraphics";
var resultVarName = "c";

var host = cartodbUser + ".cartodb.com";
var path = "/api/v2/sql?dp="+numDecimals+"&format=geojson&q=" + escape("SELECT cartodb_id, ST_SIMPLIFY(cty0921md.the_geom, 0.1) as the_geom FROM cty0921md");

var outputObject = {};

var options = {
  host: host,
  path: path
};

callback = function(response) {
  var result = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    result += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    var data = JSON.parse(result);

    $.each(data, function(a, b) {
      $.each(b, function(x, y) {
        if (y.properties && y.properties.cartodb_id) {
          var cartodb_id = y.properties.cartodb_id
          var c = y.geometry.coordinates[0][0];
          c.pop();
          outputObject[cartodb_id] = c;
        }

      });
    });

    console.log("callback({c:"+JSON.stringify(outputObject).replace(/\"/g,"")+"});");

  });
}

http.request(options, callback).end();
