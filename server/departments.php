<?php
require '/usr/local/etc/USF_connections.php';
require 'medoo.min.php';

// Allow CORS from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: *"); // '*" disallows cookies which makes it more secure
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	error_log('OPTIONS HEADERS:'.$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
	exit;
}

$vip = new medoo(array(
	'database_type' => 'mysql',
	'database_name' => $SOR['VIP']['db'],
	'server' => $SOR['VIP']['host'],
	'username' => $SOR['VIP']['dbuser'],
	'password' => $SOR['VIP']['dbpassword']
));

$data_r = $vip->select('department',array('department_gems_id', 'department_name', 'vp_area_gems_id'), array('ORDER' => array('department_name ASC')));
if (count($data_r) > 1) { // got something
	$data = array('status' => 'success', 'value' => $data_r);
} else { // this should never happen
	$data = array('status' => 'error', 'reason' => 'Database Error', 'appid' => $appid, 'ts' => $token_service);
	error_log('ERROR: Database Error');
}
echo json_encode($data);
?>