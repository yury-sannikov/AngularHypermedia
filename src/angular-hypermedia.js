'use strict';


angular.module("angularHypermedia", [])
.provider("Hypermedia", function () {	
	
	var config = {
		apiRoot: null,
		currentVersion: null,
		hypermediaFormat: "Siren"
	};

	var apiRootObjectHolder = {};

	return {
		setUp: function(newConfig)
		{
			angular.extend(config, newConfig);
		},

		getConfig: function()
		{
			return config;
		},

		$get: ["$injector", function($injector)
		{
			
			var GetApiRoot = function()
			{
				var q = $injector.get("$q");
				
				var transformerFunction = $injector.get(config.hypermediaFormat);

				var defer = q.defer();

				// apiRoot might be set up not as URL but as result object
				if (angular.isObject(config.apiRoot))
					apiRootObjectHolder.data = transformerFunction(config.apiRoot);					

				if (apiRootObjectHolder.data)
				{
					defer.resolve(apiRootObjectHolder.data);
					return defer.promise;
				}

				var http = $injector.get("$http");

				http({method: 'GET', url: config.apiRoot})
					.success(function(data, status, headers, config) {
				    	apiRootObjectHolder.data = transformerFunction(data);
				    	defer.resolve(apiRootObjectHolder.data);
				    })
				    .error(function(data, status, headers, config) {
				    	defer.reject(data);
				    });
				
				return defer.promise;
			};

			return {
				link: function(relName, version)
				{
					
					var q = $injector.get("$q");
					
					var defer = q.defer();

					GetApiRoot().then(function(data){
						data.link(relName, version).then(function(result){
							defer.resolve(result);
						}, function(failure)
						{
							console.log(failure);
							defer.reject(failure);
						});
					}, function(data){
						console.log(data);
						defer.reject(data);
					});

					return defer.promise;
				},
				getConfig: function()
				{
					return config;
				}
			};
		}]
	};

});
