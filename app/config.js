'use strict';
/*global myApp*/
myApp
	.constant('SERVER_APP_ONE_URL', 'http://localhost:8080/app.php')
	.constant('SERVER_VP_AREAS', 'http://localhost:8080/vp_areas.php')
	.constant('SERVER_DEPARTMENTS', 'http://localhost:8080/departments.php')
	.constant('UsfCAStokenAuthConstant', {
		'applicationUniqueId': 'f6765e988eb32cbda5dcd9ee2673c0a8',
		'applicationResources': {
			'exampleResource': 'https://localhost:8080/app.php'
		},
		'unauthorizedRoute': '/unauthorized'
	});