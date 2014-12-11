<?php
//phpinfo();
require '/usr/local/etc/USF_connections.php';
require 'medoo.min.php';

// 0. Restrict Access
//---------------------------------------------------------------------------------------------------
if (isset($_SERVER["REQUEST_METHOD"])) { // going through web server
	$brk = "<br/>";
} else {
	$brk = "\n";
}

date_default_timezone_set('America/New_York');
echo "STARTED ON ".date(DATE_RFC822).$brk.$brk;
$cnt = 0;


$query1 = "select distinct x.fieldvalue as u_vp_area, x.XLATLONGNAME as u_vp_area_name, x.EFFDT as effdt
    from XLATTABLE_VW x
    where x.EFFDT = (select x2.effdt from xlattable_vw x2 where x2.fieldname = x.fieldname and x2.FIELDVALUE = x.FIELDVALUE)
    and x.EFF_STATUS = 'A'
    and x.FIELDNAME = 'U_VP_AREA'";

$query2 = "select distinct d.deptid, d.descr, d.U_VP_AREA, d.EFFDT
    from ps_dept_tbl d
    where d.effdt = (select max(d2.effdt) from ps_dept_tbl d2 where d2.setid = d.setid and d2.deptid = d.deptid and d2.effdt <= sysdate)
    and d.eff_status = 'A'
    and d.setid = 'USFSI'";

$gems = new medoo(array('database_type' => 'oracle',
	'database_name' => $SOR['GEMS']['db'],
	'server' => $SOR['GEMS']['host'],
	'username' => $SOR['GEMS']['dbuser'],
	'password' => $SOR['GEMS']['dbpassword'],
	'port' => $SOR['GEMS']['dbport']
));

$vip = new medoo(array(
	'database_type' => 'mysql',
	'database_name' => $SOR['VIP']['db'],
	'server' => $SOR['VIP']['host'],
	'username' => $SOR['VIP']['dbuser'],
	'password' => $SOR['VIP']['dbpassword']
));

$data = $gems->query($query1)->fetchAll();
if (count($data) > 10) {
	$deleted_cnt = $vip->delete("vp_area",array());
	echo "Purged ".$deleted_cnt." records from vp_area table.".$brk;;
	foreach($data as $d) {
		$cnt++;
		$vip->insert("vp_area", array(
			"vp_area_gems_id" => $d[0],
			"vp_area_name" => $d[1]
		));
		echo "vp_area[".$d[0]."] name[".$d[1]."]".$brk;
	}
}
echo $cnt." records processed".$brk;
$cnt = 0;

$data = $gems->query($query2)->fetchAll();
if (count($data) > 10) {
	$deleted_cnt = $vip->delete("department", array());
	echo "Purged ".$deleted_cnt." records from department table.".$brk;;
	foreach($data as $d) {
		$cnt++;
		$vip->insert("department", array(
			"department_gems_id" => $d[0],
			"department_name" => $d[1],
			"vp_area_gems_id" => $d[2]
		));
		echo "department[".$d[0]."] name[".$d[1]."] vp_area[".$d[2]."]".$brk;
	}
}
echo $cnt." records processed".$brk;
echo $brk."FINISHED ON ".date(DATE_RFC822).$brk;
?>