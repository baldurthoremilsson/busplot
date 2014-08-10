<?php

require_once("data.php");

function getCacheKey() {
  return 'busplot:'.date('Y-m-d');
}

function pointsFromDB() {
  $connection = getDBConnection();

  $points = array();
  $routeResults = pg_query($connection, "SELECT DISTINCT route FROM realtime");

  while($routeRow = pg_fetch_assoc($routeResults)) {
    $routeId = $routeRow['route'];
    $query = "SELECT lat, lon FROM realtime WHERE route='".pg_escape_string($routeId)."' ".
      "AND date > current_date - interval '7' day AND fix IN (1, 2) ".
      "ORDER BY RANDOM() LIMIT 500";
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
  $memcache = new Memcache;
  $connected = $memcache->connect('localhost', 11211);
  if(!$connected)
    return false;

  $results = $memcache->get(getCacheKey());
  return $results;
}

function pointsToMemcache($points) {
  $memcache = new Memcache;
  $connected = $memcache->connect('localhost', 11211);
  if(!$connected)
    return;

  $memcache->set(getCacheKey(), $points);
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
