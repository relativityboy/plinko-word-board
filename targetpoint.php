<?php

session_start();
$_SESSION['x'] = (array_key_exists('x', $_SESSION))? $_SESSION['x'] + 1 : 0;
$_SESSION['y'] = (array_key_exists('y', $_SESSION))? $_SESSION['x'] * 1.5 : 1;
print($_SESSION['x'] . ',' . $_SESSION['y']);
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

