CartoDB Real-Time Map Template
==============================

This repository is a template project to create a map with CartoDB that is dynamic. With dynamic we mean that the map auto updates when data is changed on the CartoDB table that is serving it. It is just a template to showcase what can you do and is expected that you will change it to adapt it to your needs.

The main functionality of the template is the following:

- Map updates itself when it detects updates on CartoDB tables. This is done by using a "heartbeat" request asking for the latest time a table has changed (looking at the latest updated_at value on the table).

- When the map detects changes it starts loading the tiles for the map on the background and only when everything is loaded it replace the current ones. That makes possible the blending effect when data changes. We have events for when new data starts coming and for when is all loaded.

- We have a technique here to do hover effects over the polygons that work nicely in old browsers (Im looking at you IE). Basically we have a pregenerated JSON with the geometries of the polygons to represent highly simplified and in a data structure that will be fast to access. When hovering, we know the cartodb_id of the polygon because of the interactivity, we look at this cache of geometries and get the coordinates, make a polygon with it and add it. To create the JSON cache of the geometries we used a node.js script that is also available here. TODO: We could further optimize here so that mobile devices do not load this.

There are two preprocessed common tables that could be used in USA: states and counties. They are also added on this repo. Thanks to the WSJ for creating this nice geometries. You can also find the shapefiles for those datasets in the repo so that you can import them on your CartoDB.

![Map](http://cartodb.s3.amazonaws.com/tumblr/posts/election_animated_map.gif)

### Usage

1. [Sign up for a CartoDB](http://www.cartodb.com/signup) account.
2. Upload some data (you can use the CSV files stored in the ```data``` folder <sup><a href="#note-2">2</a></sup>).
3. Download this repo.
4. Edit the ```CONFIG``` hash in [js/app.js](https://github.com/CartoDB/real-time-map/blob/master/js/app.js#L1) with your CartoDB username.
5. Open the page in a browser.
6. Update some data from the table ```CONFIG.watchedTableName``` and watch how the map refreshes itself.

### Powered by

* [Leaflet 0.4.4](leafletjs.com)
* [CartoDB Leaflet](http://vizzuality.github.com/cartodb-leaflet)

### Demo

http://cartodb.github.com/real-time-map

### Changelog

0.1: 10/23/2012 - Release

### Browser support

Chrome, Safari 5, Firefox 15, Opera 12, IE 7+.

--

<span id="note-1">1</span>: However you can bind the refresh code to anything you want!    
<span id="note-2">2</span>: But bear in mind that that is just fake data for testing purposes.
