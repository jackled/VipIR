'use strict';
/*global myApp*/
myApp
	.factory('myFactory', ['$http', '$q', function($http, $q) {
		return {
			'getIdentity': function(lsUrl, lsToken, action) { // request data from the app server
				console.log('myFactory.getIdentity: ' + lsUrl + ' using token: ' + lsToken);
				var deferred = $q.defer();
				$http({
					method: 'POST',
					url: lsUrl,
					data: {action: action, token: lsToken}
				}).success(function(response) {
					deferred.resolve(response);
				}).error(function(){
					deferred.reject('ERROR');
				});
                //Returning the promise object
				return deferred.promise;
			},
			'getData': function(lsUrl, lsToken, fname, fdob, fssn, action) { // request data from the app server
				console.log('myFactory.getData: ' + lsUrl + ' using token: ' + lsToken + ' fname:' + fname + ' fdob:' + fdob + ' fssn:' + fssn +' action:' + action);
				var deferred = $q.defer();
				$http({
					method: 'POST',
					url: lsUrl,
					data: {action: action, token: lsToken, name: fname, dob: fdob, ssn: fssn}
				}).success(function(response) {
					deferred.resolve(response);
				}).error(function(){
					deferred.reject('ERROR');
				});
                //Returning the promise object
				return deferred.promise;
			},
			'updateData': function(lsUrl, lsToken, id, action) { // sent id to the app server
				console.log('myFactory.updateData: ' + lsUrl + ' using token: ' + lsToken + ' id:' + id + ' action:' + action);
				var deferred = $q.defer();
				$http({
					method: 'POST',
					url: lsUrl,
					data: {action: action, token: lsToken, id: id}
				}).success(function(response) {
					deferred.resolve(response);
				}).error(function(){
					deferred.reject('ERROR');
				});
                //Returning the promise object
				return deferred.promise;
			},
			'getVpList': function(lsUrl, lsToken, action) { // request data from the app server
				console.log('myFactory.getVpList: ' + lsUrl + ' using token: ' + lsToken);
				var deferred = $q.defer();
				$http({
					method: 'POST',
					url: lsUrl,
					data: {action: action, token: lsToken}
				}).success(function(response) {
					deferred.resolve(response);
				}).error(function(){
					deferred.reject('ERROR');
				});
                //Returning the promise object
				return deferred.promise;
			},
			'getToken': function(lsTs, lsAppid) { // request token for the appid from the token service
				//lsTs = lsTs + '/request?service=' + lsAppid;
				lsTs = lsTs + '/request';
				console.log('myFactory.getToken: ' + lsTs + ' for appid: ' + lsAppid);
				var deferred = $q.defer();
				$http({
					method: 'POST',
					url: lsTs,
					withCredentials: true,
					data: {'service': lsAppid}
				}).success(function(response) {
					deferred.resolve(response);
				}).error(function(){
					deferred.reject('ERROR');
				});
                //Returning the promise object
				return deferred.promise;
			}
		};
	}])
	.factory('myInterceptor', ['$rootScope', '$location', '$q', function($rootScope, $location, $q) {
		return {
			'responseError': function(response) {
				console.log('RESPONSE ERROR INTERCEPTOR:' + response.status);
				if (response.status === 401) {
					// set AppID and TS in local storage and clear the TOKEN for the most recent server data request
					$rootScope.ls.service[$rootScope.ls.server].appid = response.data.appid;
					$rootScope.ls.service[$rootScope.ls.server].ts = response.data.ts;
					$rootScope.ls.service[$rootScope.ls.server].token = '';
					
					// now redirect to a token service which will then re-enter the spa at main screen.
					var redirect = response.data.ts + '/login?service=' + response.data.appid + '&redirectURL=' + $rootScope.ls.host + '#/main';
					console.log('(((2))) before GET /login');
					window.location = redirect;
				} else {
					$rootScope.error = 'Critical service error.  Please try again later.';
					$location.path('/error');
				}
				return $q.reject(response);
			}
		};
	}])
	.factory('myRole', ['$rootScope', function ($rootScope) {
		// set and check user role in local storage
		return {
			setRole: function(role) {
				$rootScope.ls.role = role;
				$rootScope.$broadcast('rolesChanged');
			},
			hasRole: function (role) {
				role = role.trim();
				return $rootScope.ls.role === role;
			}
		};
	}]);