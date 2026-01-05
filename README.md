# ⚠️ ARCHIVED - This repository is no longer maintained

**This repository has been archived and is no longer actively maintained.**

This project was last updated on 2014-03-17 and is preserved for historical reference only.

- 🔒 **Read-only**: No new issues, pull requests, or changes will be accepted
- 📦 **No support**: This code is provided as-is with no support or updates
- 🔍 **For reference only**: You may fork this repository if you wish to continue development

For current CARTO projects and actively maintained repositories, please visit: https://github.com/CartoDB

---

CartoDB Real-Time Map Template
==============================

This repository is a template project to create a map with **CartoDB** that is dynamic. With dynamic we mean that the map auto updates when data is changed on the **CartoDB** table that is serving it. It is just a template to showcase what can you do and is expected that you will change it to adapt it to your needs.

The main functionality of the template is the following:

- Map updates itself when it detects updates on **CartoDB** tables. This is done by using a "heartbeat" request asking for the latest time a table has changed (looking at the latest ```updated_at``` value on the table).

- When the map detects changes it starts loading the tiles for the map on the background and only when everything is loaded it replace the current ones. That makes possible the blending effect when data changes. We have events for when new data starts coming and for when is all loaded.

- We have a technique here to do hover effects over the polygons that work nicely in old browsers (I'm looking at you, IE). Basically we have a pregenerated JSON with the geometries of the polygons to represent highly simplified and in a data structure that will be fast to access. When hovering, we know the ```cartodb_id``` of the polygon because of the interactivity, we look at this cache of geometries and get the coordinates, make a polygon with it and add it. To create the JSON cache of the geometries we used a node.js script that is also available here (see below). TODO: we could further optimize here so that mobile devices do not load this.

There are two preprocessed common tables that could be used in USA: states and counties. You'll find the shapefiles of the two tables in the ```data``` folder. Thanks to the WSJ for creating this nice geometries. You can also find the shapefiles for those datasets in the repo so that you can import them on your **CartoDB**.

![Map](http://cartodb.s3.amazonaws.com/tumblr/posts/election_animated_map.gif)


### How to generate the geometries

1. ```cd``` into the ```bin``` directory.
2. ```npm install```
3. ```./creategeomdatafile```

The geometries will be then stored in a file named ```data.min.json```.

### Powered by

* [Leaflet 0.4.4](leafletjs.com)
* [CartoDB Leaflet](http://vizzuality.github.com/cartodb-leaflet)

### Demo

http://cartodb.github.com/real-time-map

### Changelog

0.1: 10/23/2012 - Release
0.1.1: 10/30/2012 - Several bug fixes

### Browser support

Chrome, Safari 5, Firefox 15, Opera 12, IE 7+.

--

<span id="note-1">1</span>: However you can bind the refresh code to anything you want!    
<span id="note-2">2</span>: But bear in mind that that is just fake data for testing purposes.
