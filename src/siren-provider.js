'use strict';


angular.module("angularHypermedia")
.service("Siren",  ["$q", "$http", function (q, http) {	

	function GetLinkUrlByRelVersion (links, relName, version) {
		version = version ? ("ver:" + version) : "latest-version";
		
		//This is O(n^2); if the API becomes large, we'll want to devise a map of rel -> link rather than searching each time
		var link = (function (links) {
			var ii, link;
			for (ii = 0; ii < links.length; ii++) {
				link = links[ii];
				if ((-1 != link.rel.indexOf(relName)) && (-1 != link.rel.indexOf(version))) {
					return link;
				}
			}
		})(links);
		
		return link ? link.url : undefined;
	}

	function CreateEntities (entities, resultObject, transformerFunction, protocolVersion) {
		var EntityFactory = function (entity) {
			var defer = q.defer();
			if (entity.properties) {
				// This is full entity so resolve it now
				defer.resolve(transformerFunction(entity, protocolVersion));
				return defer.promise;
			}

			http({method: 'GET', url: entity.href})
				.success(function (data, status, headers, config) {
			    	defer.resolve(transformerFunction(data, protocolVersion));
			    })
			    .error(function(data, status, headers, config) {
			    	defer.reject(data);
			    });						

			return defer.promise;
		};
		
		var CreateLazyProperty = function(target, propertyName, resolve) {
			var value, created;
			Object.defineProperty(target, propertyName, {
				get: function(){
					if(!created){
						created = true;
						value = resolve();
					}
					return value;
				},
				enumerable: true,
				configurable: true
			});
		};

		console.log(entities);
		angular.forEach(entities, function (entity) {
			angular.forEach(entity.rel, function (rel) {
				CreateLazyProperty(resultObject, rel, function () {
					return EntityFactory(entity);
				});
			});
		});

	};

	return {
		GetLinkUrlByRelVersion: GetLinkUrlByRelVersion,
		CreateEntities: CreateEntities,

		transform: function t (data, protocolVersion) {
			var value = {
				link: function(relName, version)
				{
					var url = GetLinkUrlByRelVersion(value.__$$data.data.links, relName, version || value.__$$data.proto);
					if (!url)
						throw "Siren provider is unable to get link for rel " + relName + " with version " + version;
					
					var defer = q.defer();

					http({method: 'GET', url: url})
						.success(function(data, status, headers, config) {
					    	defer.resolve(t(data, protocolVersion));
					    })
					    .error(function(data, status, headers, config) {
					    	defer.reject(data);
					    });
					return defer.promise;
				}
			}
			
			value.__$$data = {data: data, proto: protocolVersion};

			angular.extend(value, value.__$$data.data.properties);
			CreateEntities(value.__$$data.data.entities, value, t, protocolVersion);

			return value;
		}
	};

}]);
