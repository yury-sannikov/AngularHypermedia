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
			return function(data, protocolVersion)
			{
				var result = {
					link: function(relName, version)
					{
						
						var url = sirenProvider.GetLinkUrlByRelVersion.call(result.__$$data, relName, version);
						var defer = q.defer();
						defer.resolve(data);
						return defer.promise;
					}
				}
				
				result.__$$data = {data: data, proto: protocolVersion};

				return result;
			}
		}]
	}

	return sirenProvider;

});
