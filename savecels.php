<?php
/*
 * display_errors(1);
error_reporting(E_ALL);
*/
$celJSON = $_POST['celJSON'];
$file = fopen('./cel.json', 'w');
print_r($_POST);
fwrite($file, json_encode($celJSON, JSON_PRETTY_PRINT));
fclose($file);
