Real-Time Map
=================

This code periodically checks a [CartoDB](http://www.cartodb.com) table and refreshes a map in real-time when it detects that the data was updated <sup><a href="#note">1</a></sup>.

### Usage

1. Signup for a CartoDB account.
2. Upload the data (you can use the csv files stored in ´´´data´´´).
3. Get this repo.
4. Update the CONFIG var to your needs: 

```

...

  // CartoDB user and main table name
  userName: 'viz2',
  tableName: 'counties',

  // We can observe another table and update the map when it's updated
  watchedUserName: 'viz2',
  watchedTableName: 'states_results',

  // number of ms between refreshes
  refreshInterval: 3000,

...


```

### Powered by

* [Leaflet 0.4.4](leafletjs.com)
* [CartoDB Leaflet](http://vizzuality.github.com/cartodb-leaflet)

### Demo

http://cartodb.github.com/real-time-map

--

<span id="note">1</span>: But you can bind the refresh code to anything you want!
