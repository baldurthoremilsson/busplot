# BusPlot

A small page that uses data from [Strætó](http://www.straeto.is) to plot
the path of the buses on a [Leaflet](http://www.leafletjs.com) map.

See it in action over [here](https://www.baldur.biz/busplot).

## Setup

If you want to run it you must store the data in a
[PostgreSQL](http://www.postgresql.org) database, see file `table.sql`.
Then you create `data.php` similar to the following:

    <?php
    function getDBConnection() {
      return pg_connect("...connectstring...");
    }
    $DEBUG = false;

If `$DEBUG = true;` then `points.php` can be used cross-domains. This can be
handy when developing on localhost when the data is on another server, then
you can create `js/baseurl.js` pointing to the server that hosts the data:

    var BASEURL = 'http://www.example.com/busplot';

## Development

Issue reports and pull reuqests welcome :)
