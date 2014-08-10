<?php

require_once("data.php");

$CACHE_KEY = 'busplot';

function pointsFromDB() {
  $connection = getDBConnection();

  $points = array();
  $routeResults = pg_query($connection, "SELECT DISTINCT route FROM realtime");

  while($routeRow = pg_fetch_assoc($routeResults)) {
    $routeId = $routeRow['route'];
    $query = "SELECT lat, lon FROM realtime WHERE route='".pg_escape_string($routeId)."' ".
      "AND date > current_date - interval '7' day ORDER BY RANDOM() LIMIT 500";
    $results = pg_query($connection, $query);
    $route = array();
    while($row = pg_fetch_assoc($results)) {
      $route[] = $row;
    }
    $points[$routeId] = $route;
  }
  return $points;
}

function pointsFromMemcache() {
  global $CACHE_KEY;
  $memcache = new Memcache;
  $connected = $memcache->connect('localhost', 11211);
  if(!$connected)
    return false;

  $results = $memcache->get($CACHE_KEY);
  return $results;
}

function pointsToMemcache($points) {
  global $CACHE_KEY;
  $memcache = new Memcache;
  $connected = $memcache->connect('localhost', 11211);
  if(!$connected)
    return;

  $memcache->set($CACHE_KEY, $points);
}

function getPoints() {
  $points = pointsFromMemcache();
  if(!$points || isset($_GET['nocache']) && $_GET['nocache'] == 'true') {
    $points = pointsFromDB();
    pointsToMemcache($points);
  }
  return $points;
}

if($DEBUG == true) {
  header('Access-Control-Allow-Origin: *');
}

header('Content-type: application/json');
echo json_encode(getPoints());
