'use strict';


angular.module("angularHypermedia")
.provider("Siren",  function() {	
	var sirenProvider = {
		
		GetLinkUrlByRelVersion:function(relName, version)
		{
			version = version || this.proto;
			version = version ? ("ver:" + version) : "latest-version";
			
			var link = _.find(this.data.links, function(link) {
				return (-1 != _.indexOf(link.rel, relName)) && (-1 != _.indexOf(link.rel, version));
			});
			
			return link ? link.url : undefined;
		},

		CreateProperties: function(resultObject)
		{
			if (!this.data.properties)
				return;
			angular.forEach(this.data.properties, function(value, key){
				resultObject[key] = value;
			});
		},

		CreateEntities: function(resultObject, $injector, transformerFunction, protocolVersion)
		{
			if (!this.data.entities)
				return;
			var q = $injector.get("$q"), http = $injector.get("$http");

			var EntityFactory = function(entity)
			{
				var defer = q.defer();
				if (entity.properties)
				{
					// This is full entity so resolve it now
					defer.resolve(transformerFunction(entity, protocolVersion));
					return defer.promise;
				}

				http({method: 'GET', url: entity.href})
					.success(function(data, status, headers, config) {
				    	defer.resolve(transformerFunction(data, protocolVersion));
				    })
				    .error(function(data, status, headers, config) {
				    	defer.reject(data);
				    });						

				return defer.promise;
			};
			
			var CreateLazyProperty = function(target, propertyName, callback, callbackParameter){
				var value, created;
				Object.defineProperty(target, propertyName, {
					get: function(){
						if(!created){
							created = true;
							value = callback.call(target, callbackParameter);
						}
						return value;
					},
					enumerable: true,
					configurable: true
				});
			};

			angular.forEach(this.data.entities, function(entity){
				angular.forEach(entity.rel, function(rel){
					CreateLazyProperty(resultObject, rel, EntityFactory, entity);
				});
			});

		},

		$get: ["$injector", function($injector)
		{
			var q = $injector.get("$q");
			var transformerFunction = function(data, protocolVersion)
			{
				var value = {
					link: function(relName, version)
					{
						var url = sirenProvider.GetLinkUrlByRelVersion.call(value.__$$data, relName, version);
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
						return defer.promise;
					}
				}
				
				value.__$$data = {data: data, proto: protocolVersion};

				sirenProvider.CreateProperties.call(value.__$$data, value);
				sirenProvider.CreateEntities.call(value.__$$data, value, $injector, transformerFunction, protocolVersion);

				return value;
			}
			return transformerFunction;
		}]
	}

	return sirenProvider;

});
