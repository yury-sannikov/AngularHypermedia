'use strict';


angular.module("angularHypermedia")
.provider("Siren", function () {	
	var sirenProvider = {
		
		GetLinkUrlByRelVersion:function(relName, version, sirenData)
		{


		},

		$get: ["$injector", function($injector)
		{
			var q = $injector.get("$q");
			return function(data)
			{
				var result = {
					link: function(relName, version)
					{
						
						var url = sirenProvider.GetLinkUrlByRelVersion(relName, version, result.__$$data);
						var defer = q.defer();
						defer.resolve(data);
						return defer.promise;
					}
				}
				
				result.__$$data = data;

				return result;
			}
		}]
	}

	return sirenProvider;

});
