'use strict';
/*global myApp*/
myApp
// landing page controller - just load vp areas and departments
	.controller('HomeCtrl', ['$scope', '$rootScope', '$http', '$location', 'myFactory', 'SERVER_VP_AREAS', 'SERVER_DEPARTMENTS', function ($scope, $rootScope, $http, $location, myFactory, SERVER_VP_AREAS, SERVER_DEPARTMENTS) {
		$rootScope.ls.server = 'SERVER_APP_ONE';
		$rootScope.ls.route = '/main';

		$http.get(SERVER_VP_AREAS).
			success(function(data) {
				$rootScope.vp_area_list = data.value;
		});
		
			$http.get(SERVER_DEPARTMENTS).
			success(function(data) {
				$rootScope.department_list = data.value;
		});
		
		$scope.getIdentity = function () {
			console.log('getIdentity');
			myFactory.getIdentity(	$rootScope.ls.service['SERVER_APP_ONE'].url,
									$rootScope.ls.service['SERVER_APP_ONE'].token,
									'identity').then(function(data) {
				if (data.status === 'success') {
					$rootScope.ls.name = data.name;
					$rootScope.ls.role = data.role;
					// enable the logout button
				}
				$location.path('/main');
			});
		};
	}])
// main controller - check the token and route accordingly
	.controller('MainCtrl', ['$rootScope', '$location', 'myFactory', function ($rootScope, $location, myFactory) {
		console.log('LSMainCtrl----> ' + JSON.stringify($rootScope.ls, null, '\t'));
		$rootScope.ls.server = 'SERVER_APP_ONE';

		// if appid is set and there is no token then request one from the token service
		if ($rootScope.ls.server !== '' && $rootScope.ls.service[$rootScope.ls.server].appid !== '' && $rootScope.ls.service[$rootScope.ls.server].token === '') {
			console.log('(((3))) before POST /request');
			myFactory.getToken($rootScope.ls.service[$rootScope.ls.server].ts, $rootScope.ls.service[$rootScope.ls.server].appid).then(function(data) {
				// set token
				console.log('(((3b))) AFTER');
				$rootScope.ls.service[$rootScope.ls.server].token = data;
			});
		}
		
		// if LS timestamp is older than 2 hours then revert to /home
		var newts = new Date().getTime();
		if (($rootScope.ls.timestamp + (2*60*60*1000)) < newts) {
			$rootScope.ls.route = '/home';
			$rootScope.ls.timestamp = newts;
		}
		$location.path($rootScope.ls.route);
	}])
// search page controller
	.controller('SearchCtrl', ['$rootScope', '$scope', '$location', 'myFactory', function ($rootScope, $scope, $location, myFactory) {
		$rootScope.ls.server = 'SERVER_APP_ONE';
		$rootScope.ls.route = $location.path(); // save the current route

		$scope.vipSearch = function () {
			myFactory.getData(	$rootScope.ls.service['SERVER_APP_ONE'].url,
								$rootScope.ls.service['SERVER_APP_ONE'].token,
								$rootScope.search.name,
								$rootScope.search.dob1 + $rootScope.search.dob2 + $rootScope.search.dob3,
								$rootScope.search.ssn1 + $rootScope.search.ssn2 + $rootScope.search.ssn3,
								'search').then(function(data) {
				if (data.status === 'mismatch') { // if not found then just enable the add button
					$rootScope.flags.add = true;
					console.log('SearchCtrl:mismatch');
				} else { // otherwiese, set the identity list
					console.log('SearchCtrl:success ' + data.value.length);
					$rootScope.identity_list = data.value;
					if (data.value.length > 1) { // list page
						$location.path('/list');
					} else { // detail page
						// populate detail
						$rootScope.detail.vip_id = data.value[0].vip_id;
						$rootScope.detail.name_last = data.value[0].name_last;
						$rootScope.detail.name_first = data.value[0].name_first;
						$rootScope.detail.name_middle = data.value[0].name_middle;
						$rootScope.detail.dob = data.value[0].dob;
						$rootScope.detail.ssn = data.value[0].ssn;
						$rootScope.detail.email = data.value[0].email;
						$rootScope.detail.phone = data.value[0].phone;
						$rootScope.detail.vp_area_gems_id = data.value[0].vp_area_gems_id;
						$rootScope.detail.department_gems_id = data.value[0].department_gems_id;
						$rootScope.detail.program = data.value[0].program;
						$rootScope.detail.notes = data.value[0].notes;
						$rootScope.detail.sponsor_netid = data.value[0].sponsor_netid;
						$rootScope.detail.start_date = data.value[0].start_date;
						$rootScope.detail.end_date = data.value[0].end_date;
						$rootScope.detail.created_dt = data.value[0].created_dt;
						$rootScope.detail.updated_dt = data.value[0].updated_dt;

						// jumpt to detail
						$location.path('/detail');
					}
				}
			});
		};
		
		$scope.vipAdd = function () { // create new identity form
			console.log('vipAdd');
			$rootScope.detail.vip_id = '';
			$rootScope.detail.name_last = $rootScope.search.name;
			$rootScope.detail.name_first = '';
			$rootScope.detail.name_middle = '';
			$rootScope.detail.dob = $rootScope.search.dob1 + $rootScope.search.dob2 + $rootScope.search.dob3;
			$rootScope.detail.ssn = $rootScope.search.ssn1 + $rootScope.search.ssn2 + $rootScope.search.ssn3;
			$rootScope.detail.email = '';
			$rootScope.detail.phone = '';
			$rootScope.detail.vp_area_gems_id = '';
			$rootScope.detail.department_gems_id = '';
			$rootScope.detail.program = '';
			$rootScope.detail.notes = '';
			$rootScope.detail.sponsor_netid = '';
			$rootScope.detail.start_date = '';
			$rootScope.detail.end_date = '';
			$rootScope.detail.created_dt = '';
			$rootScope.detail.updated_dt = '';
						
			// jumpt to detail
			$location.path('/detail');
		};
		
		$scope.reset = function() {
			$rootScope.search.name = '';
			$rootScope.search.dob1 = '';
			$rootScope.search.dob2 = '';
			$rootScope.search.dob3 = '';
			$rootScope.search.ssn1 = '';
			$rootScope.search.ssn2 = '';
			$rootScope.search.ssn3 = '';
			$rootScope.flags.add = false;
			$scope.vipSearchForm.$setPristine();
		};
	}])
// list controller
	.controller('ListCtrl', ['$rootScope', '$scope', '$location', function ($rootScope, $scope, $location) {
		$rootScope.ls.route = $location.path(); // save the current route
		//console.log('LSlist ----> '+ JSON.stringify($rootScope.ls, null, '\t'));
		$scope.vipDetails = function(id) { // populate identity form with a list data
			console.log(id);
			// populate detail
			$rootScope.detail.vip_id = id.vip_id;
			$rootScope.detail.name_last = id.name_last;
			$rootScope.detail.name_first = id.name_first;
			$rootScope.detail.name_middle = id.name_middle;
			$rootScope.detail.dob = id.dob;
			$rootScope.detail.ssn = id.ssn;
			$rootScope.detail.email = id.email;
			$rootScope.detail.phone = id.phone;
			$rootScope.detail.vp_area_gems_id = id.vp_area_gems_id;
			$rootScope.detail.department_gems_id = id.department_gems_id;
			$rootScope.detail.program = id.program;
			$rootScope.detail.notes = id.notes;
			$rootScope.detail.sponsor_netid = id.sponsor_netid;
			$rootScope.detail.start_date = id.start_date;
			$rootScope.detail.end_date = id.end_date;
			$rootScope.detail.created_dt = id.created_dt;
			$rootScope.detail.updated_dt = id.updated_dt;
			
			// jump to detail page
			$location.path('/detail');
		};
	}])
// detail controller - grab vp areas and department lists
	.controller('DetailCtrl', ['$rootScope', '$scope', '$location', 'myFactory', function ($rootScope, $scope, $location, myFactory) {
		$rootScope.ls.route = $location.path(); // save the current route
		//console.log('LSdetail ----> '+ JSON.stringify($rootScope.ls, null, '\t'));
		//console.log($rootScope.vp_area_list);
		//console.log($rootScope.department_list);
		$scope.vipUpdate = function() { // update the VIP database
			console.log('vipUpdate');
			myFactory.updateData(	$rootScope.ls.service['SERVER_APP_ONE'].url,
									$rootScope.ls.service['SERVER_APP_ONE'].token,
									$rootScope.detail,
									'update').then(function(data) {
				if (data.status === 'error') { // error
					console.log('DetailCtrl:error');
				} else {
					if (data.action === 'insert') { // inserted record
						$rootScope.detail.vip_id = data.vip_id;
						$rootScope.detail.created_dt = data.updated_dt; // same as updated
						$rootScope.detail.updated_dt = data.updated_dt;
					} else if (data.action === 'update') { // updated record
						$rootScope.detail.updated_dt = data.updated_dt;
					}
					console.log('DetailCtrl:success');
				}
			});
			// jump to detail page
			$location.path('/detail');
		};
	}])
// exit controller
	.controller('ExitCtrl', ['$rootScope', 'storage', function ($rootScope, storage) {
		storage.clearAll();
		//console.log('LSExitCtrl----> '+ JSON.stringify($rootScope.ls, null, '\t'));
	}])
// error controller
	.controller('ErrorCtrl', ['$rootScope', function ($rootScope) {
		$rootScope.ls.route = '/error';
	}])
	.controller('DatepickerCtrl', function ($scope) {
		$scope.today = function() {
		  $scope.dt = new Date();
		};
		$scope.today();

		$scope.clear = function () {
		  $scope.dt = null;
		};

		$scope.open = function($event) {
		  $event.preventDefault();
		  $event.stopPropagation();

		  $scope.opened = true;
		};
	});