'use strict';


angular.module("angularHypermedia")
.provider("Siren", function () {	
	var sirenProvider = {
		
		GetLinkUrlByRelVersion:function(relName, version)
		{
			
			version = version || this.proto;
			version = version ? ("ver:" + version) : "latest-version";
			
			var link = _.find(this.data[0].links, function(link) {
				return (-1 != _.indexOf(link.rel, relName)) && (-1 != _.indexOf(link.rel, version));
			});
			
			return link ? link.url : undefined;
		},

		$get: ["$injector", function($injector)
		{
			var q = $injector.get("$q");
			var transformerFunction = function(data, protocolVersion)
			{
				var result = {
					link: function(relName, version)
					{
						var url = sirenProvider.GetLinkUrlByRelVersion.call(result.__$$data, relName, version);
						if (!url)
							throw "Siren provider is unable to get link for rel " + relName + " with version " + version;

						var http = $injector.get("$http");
						
						var defer = q.defer();

						http({method: 'GET', url: url})
							.success(function(data, status, headers, config) {
						    	defer.resolve(transformerFunction(data, protocolVersion));
						    })
						    .error(function(data, status, headers, config) {
						    	defer.reject(data);
						    });						

						
						defer.resolve(data);
						return defer.promise;
					}
				}
				
				result.__$$data = {data: data, proto: protocolVersion};

				return result;
			}
			return transformerFunction;
		}]
	}

	return sirenProvider;

});
