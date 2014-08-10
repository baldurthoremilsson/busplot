<?php

require_once("data.php");

$connection = getDBConnection();
$results = pg_query($connection, "SELECT route, count(*) as count FROM realtime GROUP BY route ORDER BY route");

$total = 0;

echo "<table>";
while($row = pg_fetch_array($results)) {
  $total += $row['count'];
  echo "<tr><th>$row[route]</th><td>$row[count]</td></tr>";
}
echo "<tr><th>total</th><td>$total</td></tr>";
echo "</table>";
