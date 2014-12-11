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


// SSN hashed secret
$SSN_SECRET = hash('sha256', 'ABCDEF123456', false);

// angular http post sends json encoded data in a message body
$body = file_get_contents('php://input');
$input= json_decode($body, TRUE ); //convert JSON into array
$action = $input['action']; // what ACTION should we take?  See case statement below
$token = $input['token'];
$id = $input['id']; // was there an identity in the body? ;)

// local settings
$appid = 'https://dev.it.usf.edu/~jack/ExampleApp'; // this has to match the appid as defined inside token service - does NOT need to be real URL!
$token_service = 'https://authtest.it.usf.edu/AuthTransferService/webtoken';
$entitlement = 'itVipUser'; // needed for admin users
	
// validate token
$request = $token_service.'/validate';
error_log("(((1))) before POST /validate: ".$request." token:".urlencode($token));
$session = curl_init($request); 
// urlencode and concatenate the POST arguments 
$postargs = 'service='.urlencode($appid).'&token='.urlencode($token);
// Tell curl to use HTTP POST
curl_setopt ($session, CURLOPT_POST, true); 
// Tell curl that this is the body of the POST
curl_setopt ($session, CURLOPT_POSTFIELDS, $postargs);
// Tell curl not to return headers, but do return the response
curl_setopt($session, CURLOPT_HEADER, false); 
curl_setopt($session, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($session); 
curl_close($session);
error_log("CURL response: ". $response);
$rv = json_decode($response);

if ($rv->result == 'error') { // if there was a validation problem then return error
	$data = array('status' => 'error', 'reason' => $rv->reason, 'appid' => $appid, 'ts' => $token_service);
	error_log('ERROR:'.$rv->reason);
	header('HTTP/1.0 401 Unauthorized');
} else { // access to DB granted!
	$vip = new medoo(array(
		'database_type' => 'mysql',
		'database_name' => $SOR['VIP']['db'],
		'server' => $SOR['VIP']['host'],
		'username' => $SOR['VIP']['dbuser'],
		'password' => $SOR['VIP']['dbpassword']
	));

	// set user name
	$name = $rv->GivenName.' '.$rv->Surname;
	// set user role
	if (in_array($entitlement, $rv->eduPersonEntitlement)) {
		$role =  'Admin';
	} else {
		$role = $rv->eduPersonPrimaryAffiliation;
	}
	
	switch ($action) {
		case 'identity': // return name and role
			$data = array('status' => 'success', 'name' => $name, 'role' => $role);
			break;
		case 'search': // return one or more identity matches or 'mismatch'
			$aes_decrypt = "AES_DECRYPT(".$id['ssn'].", '".$SSN_SECRET."')";
			if ($role != 'Admin') { // only admin can access this feature
				$data = array('status' => 'error', 'reason' => 'Unauthorized Access', 'appid' => $appid, 'ts' => $token_service);
				error_log('ERROR: Unauthorized Access - '.$role);
				header('HTTP/1.0 401 Unauthorized');
			} else {
				// prepare input strings
				$fname = $vip->quote('%'.$input['name'].'%');
				$fdob = $vip->quote('%'.$input['dob'].'%');
				$fssn = $vip->quote($input['ssn']);
				$and = " WHERE ";

				$qstr = "SELECT vip_id, name_last, name_first, name_middle, dob, AES_DECRYPT(ssn, '".$SSN_SECRET."') as ssn,"
						. "email, phone, vp_area_gems_id, department_gems_id, program, notes,"
						. "start_date, end_date,"
						. "sponsor_netid, created_dt, updated_dt "
						. "FROM identity";
				if (strlen($fname) > 5) { // at least 2 character name
					$qstr.= $and."CONCAT(name_last,' ',name_first,' ',name_middle) LIKE ".$fname;
					$and = " AND ";
				}
				if (strlen($fdob) > 5) { // at least 2 digit date
					$qstr.= $and."dob LIKE ".$fdob;
					$and = " AND ";
				}
				if (strlen($fssn) == 11) { // exact ssn match
					$qstr.= $and."ssn = AES_ENCRYPT(".$fssn.", '".$SSN_SECRET."')";
					$and = " AND ";
				}
			
				error_log("DEBUG: ".$qstr);
				
				if ($and == " AND ") { // got at least one search criterium
					$data_r = $vip->query($qstr)->fetchAll();
				}
				
				if (count($data_r) < 1) {
					$data = array('status' => 'mismatch');
					error_log('MISMATCH:'.$fname."-".$fdob."-".$fssn);
				} else { // got a list
					$data = array('status' => 'success', 'count' => count($data_r), 'value' => $data_r);
					error_log('SUCCESS:'.count($data_r)." - ".print_r($data_r, true));
				}
			}
			break;
		case 'update':	// insert/update identity
			$aes_encrypt = "AES_ENCRYPT('".$id['ssn']."', '".$SSN_SECRET."')";
			if ($id['start_date'] == "") { // null date
				$start_date = null;
			} else {
				$start_date = substr($id['start_date'], 0, 10);
			}
			if ($id['end_date'] == "") { // null date
				$end_date = null;
			} else {
				$end_date = substr($id['end_date'], 0, 10);
			}
			error_log('UPDATE:'.print_r($id, true));
			if ($id['vip_id'] == "") { // insert
				$vip_id = $vip->insert("identity", array(
					"vip_id" => null,
					"name_last" => ucwords($id['name_last']),
					"name_first" => ucwords($id['name_first']),
					"name_middle" => ucwords($id['name_middle']),
					"dob" => substr($id['dob'], 0, 10),
					"#ssn" => $aes_encrypt,
					"email" => $id['email'],
					"phone" => $id['phone'],
					"vp_area_gems_id" => $id['vp_area_gems_id'],
					"department_gems_id" => $id['department_gems_id'],
					"program" => $id['program'],
					"notes" => $id['notes'],
					"sponsor_netid" => $id['sponsor_netid'],
					"start_date" => $start_date,
					"end_date" => $end_date,
					"created_dt" => null,
					"updated_dt" => null
				));
				if ($vip_id != "") {
				// get the timestamp for this new record
					$data_r = $vip->select("identity", array("updated_dt"), array("vip_id[=]" => $vip_id));
					$data = array('status' => 'success', 'action' => 'insert', 'vip_id' => $vip_id, 'updated_dt' => $data_r[0]['updated_dt']);
				} else {
					$data = array('status' => 'success', 'action' => 'none');
				}
			} else { // update
				$vip_id = $vip->update("identity", array(
					"name_last" => ucwords($id['name_last']),
					"name_first" => ucwords($id['name_first']),
					"name_middle" => ucwords($id['name_middle']),
					"dob" => substr($id['dob'], 0, 10),
					"#ssn" => $aes_encrypt,
					"email" => $id['email'],
					"phone" => $id['phone'],
					"vp_area_gems_id" => $id['vp_area_gems_id'],
					"department_gems_id" => $id['department_gems_id'],
					"program" => $id['program'],
					"notes" => $id['notes'],
					"sponsor_netid" => $id['sponsor_netid'],
					"start_date" => $start_date,
					"end_date" => $end_date
				), array("vip_id[=]" => $id['vip_id']));
				// get the timestamp for this updated record
				if ($vip_id != "") {
					$data_r = $vip->select("identity", array("updated_dt"), array("vip_id[=]" => $vip_id));
					$data = array('status' => 'success', 'action' => 'update', 'updated_dt' => $data_r[0]['updated_dt']);
				} else {
					$data = array('status' => 'success', 'action' => 'none');
				}
			}
			break;
		default:
			$data = array('status' => 'error', 'reason' => 'Unauthorized Access', 'appid' => $appid, 'ts' => $token_service);
			error_log('ERROR: Unauthorized Access - default');
			header('HTTP/1.0 401 Unauthorized');
			break;
	}
}
echo json_encode($data);
?>