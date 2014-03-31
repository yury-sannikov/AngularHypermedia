'use strict';


angular.module("angularHypermedia", [])
.provider("Hypermedia", function () {	
	
	var config = {
		apiRoot: null,
		currentVersion: null
	};

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
			return {


			};
		}]
	};

});
