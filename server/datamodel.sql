DROP TABLE IF EXISTS identity;
CREATE TABLE identity (
vip_id INTEGER NOT NULL AUTO_INCREMENT,
name_last VARCHAR(128) NOT NULL,
name_first VARCHAR(128) NOT NULL,
name_middle VARCHAR(128) NOT NULL,
dob DATE NOT NULL,
ssn BLOB,
email VARCHAR(64),
phone VARCHAR(64),
vp_area_gems_id VARCHAR(16),
department_gems_id VARCHAR(16),
program VARCHAR(256),
notes VARCHAR(1024),
start_date DATE NULL,
end_date DATE NULL,
sponsor_netid VARCHAR(64),
created_dt TIMESTAMP NOT NULL DEFAULT 0,
updated_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (vip_id)
);
INSERT INTO identity VALUES(NULL, 'Doe','Jack','M','1970-01-01', '', 'jack@usf.edu','1231234','','','','',CURDATE(), NULL,'jack', NULL, NULL);

DROP TABLE IF EXISTS vp_area;
CREATE TABLE vp_area (
vp_area_gems_id VARCHAR(16) NOT NULL,
vp_area_name VARCHAR(128) NOT NULL,
PRIMARY KEY (vp_area_gems_id)
);

DROP TABLE IF EXISTS department;
CREATE TABLE department (
department_gems_id VARCHAR(16) NOT NULL,
department_name VARCHAR(128) NOT NULL,
vp_area_gems_id VARCHAR(16),
PRIMARY KEY (department_gems_id)
);