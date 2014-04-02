'use strict';


angular.module("angularHypermedia", [])
.provider("Hypermedia", function () {	
	
	var config = {
		apiRoot: null,
		currentVersion: null,
		hypermediaFormat: "Siren"
	};

	var apiRootObjectHolder = {};

	function setUp (newConfig) {
		angular.extend(config, newConfig);
	}

	function getConfig () {
		return config;
	}

	this.setUp = setUp;
	this.getConfig = getConfig;
	this.$get = ["$q", "$http", config.hypermediaFormat, function(q, http, transformerSvc) {

	
		var GetApiRoot = function() {
			var defer = q.defer();

			// apiRoot might be set up not as URL but as result object
			if (angular.isObject(config.apiRoot))
				apiRootObjectHolder.data = transformerSvc.transform(config.apiRoot, config.currentVersion);					

			if (apiRootObjectHolder.data) {
				defer.resolve(apiRootObjectHolder.data);
				return defer.promise;
			}

			http({method: 'GET', url: config.apiRoot})
				.success(function(data, status, headers, config) {
			    	apiRootObjectHolder.data = transformerSvc.transform(data, config.currentVersion);
			    	defer.resolve(data);
			    })
			    .error(function(data, status, headers, config) {
			    	defer.reject(data);
			    });
			
			return defer.promise;
		};

		return {
			setUp: setUp,
			getConfig: getConfig,

			getLink: function(relName, version) {
				
				var defer = q.defer();

				GetApiRoot().then(
					//success
					function(data) {
						data.link(relName, version).then(function(result) {
							defer.resolve(result);
						},
						function(failure) {
							console.log(failure);
							defer.reject(failure);
						});
					},
					//failure
					function(data) {
						console.log(data);
						defer.reject(data);
					}
				);

				return defer.promise;
			}
		};
	}]

});
