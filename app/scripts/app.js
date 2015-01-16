'use strict';
var myApp = angular.module('myApp', ['ngRoute', 'ngSanitize', 'angularLocalStorage', 'ui.bootstrap']) // <-- dependency injection!
	.config(function ($routeProvider) {
		// route access is not implemented since we use has-role directives to disable restricted elements and real authorization takes place server-side anyway.
		$routeProvider
			.when('/', {
				templateUrl: 'views/home.html',
				controller: 'HomeCtrl'
			})
			.when('/main', {
				templateUrl: 'views/main.html', // view is blank
				controller: 'MainCtrl'
			})
			.when('/search', {
				templateUrl: 'views/search.html',
				controller: 'SearchCtrl'
			})
			.when('/list', {
				templateUrl: 'views/list.html',
				controller: 'ListCtrl'
			})
			.when('/detail', {
				templateUrl: 'views/detail.html',
				controller: 'DetailCtrl'
			})
			.when('/error', {
				templateUrl: 'views/error.html',
				controller: 'ErrorCtrl'
			})
			.when('/unauthorized', {
				templateUrl: 'views/error.html',
				controller: 'ErrorCtrl'
			})
			.when('/exit', {
				templateUrl: 'views/exit.html',
				controller: 'ExitCtrl'
			})
			.otherwise({
				redirectTo: '/'
			});
		})
	.config(['$httpProvider', function($httpProvider) {
		$httpProvider.interceptors.push('myInterceptor');
	}]);

// initialize/bind to local storage
myApp.run(['$rootScope', '$location', 'storage', '$log', 'SERVER_APP_ONE_URL', function($rootScope, $location, storage, $log, SERVER_APP_ONE_URL) {
	// persistent local storage
	storage.bind($rootScope, 'ls', {defaultValue: {
		name: '',
		role: '',
		host: $location.absUrl(),
		route: '/home', // set the default route to splash screen
		server: '', // last service called
		timestamp: new Date().getTime(), // last activity
		vp_area_list: {},
		department_list: {},
		identity_list: {},
		search: {
			name: '',
			dob1: '',
			dob2: '',
			dob3: '',
			ssn1: '',
			ssn2: '',
			ssn3: ''
		},
		detail: {
			vip_id: '',
			name_last: '',
			name_first: '',
			name_middle: '',
			dob: '',
			ssn: '',
			email: '',
			phone: '',
			vp_area_gems_id: '',
			department_gems_id: '',
			program: '',
			notes: '',
			sponsor_netid: '',
			start_date: '',
			end_date: '',
			created_dt: '',
			updated_dt: ''
		},
		// search and detail	
		flags: {identity_add: false},
		service: {
			'SERVER_APP_ONE' : {
				'url' : SERVER_APP_ONE_URL,
				'ts' : '',
				'appid' : '',
				'token' : ''}
		}
	} , storeName: 'vipir'});
	$log.info('run: '+ JSON.stringify($rootScope.ls, null, '\t'));
}]);

// define html5 directive for authorization
myApp.directive('hasRole', ['myRole', function(myRole) {
	return {
		link: function(scope, element, attrs) {
			var value = attrs.hasRole.trim();
			var notRoleFlag = value[0] === '!';
			
			if (notRoleFlag) {
				value = value.slice(1).trim();
			}
 
			function toggleVisibilityBasedOnRole() {
				var hasrole = myRole.hasRole(value);
 
				if (hasrole && !notRoleFlag || !hasrole && notRoleFlag) {
					element.show();
				} else {
					element.hide();
				}
			}
			
			toggleVisibilityBasedOnRole();
			scope.$on('roleChanged', toggleVisibilityBasedOnRole);
		}
	};
}]);

// iu-bootstrap datepicker formatting fix (01/09/2015)
myApp.directive('datepickerPopup', function () {
  return {
    restrict: 'EAC',
    require: 'ngModel',
    link: function(scope, element, attr, controller) {
      //remove the default formatter from the input directive to prevent conflict
      controller.$formatters.shift();
	}
  };
});