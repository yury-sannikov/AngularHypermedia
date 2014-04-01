'use strict';


angular.module("angularHypermedia")
.provider("Siren",  function() {	
	var sirenProvider = {
		
		GetLinkUrlByRelVersion:function(relName, version)
		{
			version = version ? ("ver:" + version) : "latest-version";
			
			var link = _.find(this.links, function(link) {
				return (-1 != _.indexOf(link.rel, relName)) && (-1 != _.indexOf(link.rel, version));
			});
			
			return link ? link.url : undefined;
		},

		CreateProperties: function(resultObject)
		{
			if (!this.properties)
				return;
			angular.forEach(this.properties, function(value, key){
				resultObject[key] = value;
			});
		},

		CreateEntities: function(resultObject, $injector, transformerFunction)
		{
			if (!this.entities)
				return;
			var q = $injector.get("$q"), http = $injector.get("$http");

			var EntityFactory = function(entity)
			{
				var defer = q.defer();
				if (entity.properties)
				{
					// This is full entity so resolve it now
					defer.resolve(transformerFunction(entity));
					return defer.promise;
				}

				http({method: 'GET', url: entity.href})
					.success(function(data, status, headers, config) {
				    	defer.resolve(transformerFunction(data));
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

			angular.forEach(this.entities, function(entity){
				angular.forEach(entity.rel, function(rel){
					CreateLazyProperty(resultObject, rel, EntityFactory, entity);
				});
			});

		},

		$get: ["$injector", function($injector)
		{
			var q = $injector.get("$q");
			var transformerFunction = function(data)
			{
				var value = {
					link: function(relName, version)
					{
						var Hypermedia = $injector.get("Hypermedia");
						var protocolVersion = Hypermedia.getConfig().currentVersion;

						var url = sirenProvider.GetLinkUrlByRelVersion.call(value.__$$data, relName, version || protocolVersion);
						if (!url)
							throw "Siren provider is unable to get link for rel " + relName + " with version " + version;

						var http = $injector.get("$http");
						
						var defer = q.defer();

						http({method: 'GET', url: url})
							.success(function(data, status, headers, config) {
						    	defer.resolve(transformerFunction(data));
						    })
						    .error(function(data, status, headers, config) {
						    	defer.reject(data);
						    });						
						return defer.promise;
					}
				}
				

				value.__$$data = data;

				sirenProvider.CreateProperties.call(value.__$$data, value);
				sirenProvider.CreateEntities.call(value.__$$data, value, $injector, transformerFunction);

				return value;
			}
			return transformerFunction;
		}]
	}

	return sirenProvider;

});
