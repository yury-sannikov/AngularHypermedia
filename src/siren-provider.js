'use strict';


angular.module("angularHypermedia")
.service("Siren",  ["$q", "$http", function (q, http) {	

	var sirenConfig = {
 		headers: {
 			accept:"application/vnd.siren+json"
 		}
	};

	function GetLinkUrlByRelVersion (links, relName, version) {

		//Rel is a URL. Return it back
		if (relName.indexOf("/") == 0 || relName.indexOf("http") == 0)
			return relName;

		version = version ? ("ver:" + version) : "latest-version";
		
		//This is O(n^2); if the API becomes large, we'll want to devise a map of rel -> link rather than searching each time
		var link = (function (links) {
			var ii, link;
			for (ii = 0; ii < links.length; ii++) {
				link = links[ii];
				if (-1 != link.rel.indexOf(relName)){
					
					if (link.rel.length == 1){
						return link;
					}
					
					if (-1 != link.rel.indexOf(version)) {
						return link;
					}
				}
			}
		})(links);
		
		return link ? link.href : undefined;
	};

	function CreateEntities (entities, resultObject, transformerFunction, protocolVersion) {
		var EntityFactory = function (entity) {
			var defer = q.defer();
			if (entity.properties) {
				// This is full entity so resolve it now
				defer.resolve(transformerFunction(entity, protocolVersion));
				return defer.promise;
			}

			http({method: 'GET', url: entity.href, headers: sirenConfig.headers})
				.success(function (data, status, headers, config) {
			    	defer.resolve(transformerFunction(data, protocolVersion));
			    })
			    .error(function(data, status, headers, config) {
			    	defer.reject({data: data, status: status, headers:headers, config: config});
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

		angular.forEach(entities, function (entity) {
			angular.forEach(entity.rel, function (rel) {
				CreateLazyProperty(resultObject, rel, function () {
					return EntityFactory(entity);
				});
			});
		});

	};

	function GetActionByName(actions, actionName)
	{
		if (!angular.isArray(actions))
			return undefined;

		var i;
		for (i = 0; i < actions.length; i++) {
			if (actions[i].name == actionName)
				return actions[i];
		}
		return undefined;
	};

	function ValidateActionData(action, actionData)
	{
		if (!action)
			throw "Invalid parameter 'action'";

		if (!action.fields || (angular.isArray(action.fields) && action.fields.length == 0))
			return undefined;

		if (!actionData)
			return "Data should be supplied";

		var i;
		for (i = 0; i < action.fields.length; i++){
			var fieldName = action.fields[i].name;
			if (typeof actionData[fieldName] === "undefined")
				return "Supplied data doesn't contain field '" + fieldName + "'";
		}

		for(var key in actionData) {
			for (i = 0; i < action.fields.length; i++){
				var fieldName = action.fields[i].name;
				if (key === fieldName){
					key = null;
					break;
				}
			}
			if (key)
				return "Supplied data contains extra field '" + key + "'";
		}

		return undefined;
	};

	function SubstituteQueryParameters(url, actionData)
	{
		if (!url)
			return url;
		var match = url.match(/=:[^&]+/g);
		if (!match)
			return url;
		var i;
		
		for(i = 0; i < match.length; i++) {
			var varNameUrl = match[i].replace("=", "");
			var varName = varNameUrl.slice(1);
			if (typeof actionData[varName] === "undefined")
				throw "Unable to substitute query parameter: unknow variable '" + varName + "'";

			var dataToReplace = encodeURIComponent(actionData[varName]);
			url = url.replace(new RegExp(varNameUrl, "g"), dataToReplace);
		}

		return url;
	}

	function SimulateHTTPErrorFromException(err) {
		
		var message = "An error occurred", 
			status = angular.isNumber(err) ? err : 500;
		
		if (angular.isString(err)) {
			message = err;
		} else if (angular.isObject(err)) {
			message = err.message || message;
			status = err.status || status; 
		}

		return {
			data: { 
				Message: message
			}, 
			status: status, 
			headers: angular.noop, 
			config: {}
		};
	}

	return {
		GetLinkUrlByRelVersion: GetLinkUrlByRelVersion,
		CreateEntities: CreateEntities,
		GetActionByName : GetActionByName,
		ValidateActionData : ValidateActionData,
		SubstituteQueryParameters : SubstituteQueryParameters,
		SimulateHTTPErrorFromException : SimulateHTTPErrorFromException,

		transform: function t (data, protocolVersion) {
			var ctor = function (data, protocolVersion) {
				this.link = function(relName, version)
				{
					var defer = q.defer();
					try {
						var urlVer = version || protocolVersion;
						var url = GetLinkUrlByRelVersion(data.links, relName, urlVer);
						if (!url)
							throw {status: 404, message: "Rel " + relName + "/" + urlVer + " not found."};

						http({method: 'GET', url: url, headers: sirenConfig.headers})
							.success(function(data, status, headers, config) {
						    	defer.resolve(t(data, protocolVersion));
						    })
						    .error(function(data, status, headers, config) {
						    	defer.reject({data: data, status: status, headers:headers, config: config});
						    });
					}
					catch(err) {
						defer.reject(SimulateHTTPErrorFromException(err));	
					}
					return defer.promise;
				}
				
				this.links =function()
				{
					return data.links || [];					
				}

				this.actions = function()
				{
					return data.actions || [];
				}

				this.action = function(actionName, actionData)
				{
					var defer = q.defer();
					try {
						var action = GetActionByName(data.actions, actionName);
						
						if (!action)
							throw {status: 403, message: "Action '" + actionName + "' forbidden."};

						var validate = ValidateActionData(action, actionData);
						
						if (!!validate)
							throw {status: 400, message: "Bad request '" + actionName + "'. Message: " + validate};

						var method = (action.method || 'GET').toUpperCase();
						
						var config = {method: method, url: action.href, headers: sirenConfig.headers};
						
						if (method === 'GET') {
							config.url = SubstituteQueryParameters(config.url, actionData);
						} else { 
							config.data = actionData;
						}

						http(config)
							.success(function(data, status, headers, config) {
						    	defer.resolve(t(data, protocolVersion));
						    })
						    .error(function(data, status, headers, config) {
						    	defer.reject({data: data, status: status, headers:headers, config: config});
						    });
					}
					catch(err) {
						defer.reject(SimulateHTTPErrorFromException(err));	
					}
					return defer.promise;
				}

				var isSiren = angular.isObject(data.properties) || angular.isArray(data.links) || angular.isArray(data.actions); 
				
				if (isSiren) {
					angular.extend(this, data.properties);
					CreateEntities(data.entities, this, t, protocolVersion);
				} else {
					angular.extend(this, data);
				}
			}
			

			if (!angular.isArray(data))
				return new ctor(data, protocolVersion);

			var result = [];
			for(var el in data)
				result.push(new ctor(data[el], protocolVersion));
			return result;
		}
	};
}]);
