'use strict';


angular.module("angularHypermedia")
.service("Siren",  ["$q", "$http", function (q, http) {	

	var sirenConfig = {
 		headers: {
 			accept:"application/vnd.siren+json"
 		}
	};

	function GetLinkUrlByRelVersion (links, relName, version) {
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
		var i;
		for (i = 0; i < actions.length; i++) {
			if (actions[i].name == actionName)
				return actions[i];
		}
		return undefined;
	};

	function ValidateActionData(action, actionData)
	{
		if (!actionData)
			return undefined;
		
		if (!action)
			throw "Invalid parameter 'action'";

		if (!action.fields || (angular.isArray(action.fields) && action.fields.length == 0))
			return undefined;

		var i;
		for (i = 0; i < action.fields.length; i++){
			var fieldName = action.fields[i].name;
			if (typeof actionData[fieldName] === "undefined")
				return "Action validation error: Supplied data doesn't contain field '" + fieldName + "'";
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
				return "Action validation error: Supplied data contains extra field '" + key + "'";
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

	return {
		GetLinkUrlByRelVersion: GetLinkUrlByRelVersion,
		CreateEntities: CreateEntities,
		GetActionByName : GetActionByName,
		ValidateActionData : ValidateActionData,
		SubstituteQueryParameters : SubstituteQueryParameters,

		transform: function t (data, protocolVersion) {
			var ctor = function (data, protocolVersion) {
				this.link = function(relName, version)
				{
					var url = GetLinkUrlByRelVersion(data.links, relName, version || protocolVersion);
					if (!url)
						throw "Siren provider is unable to get link for rel " + relName + " with version " + version;
					
					var defer = q.defer();

					http({method: 'GET', url: url, headers: sirenConfig.headers})
						.success(function(data, status, headers, config) {
					    	defer.resolve(t(data, protocolVersion));
					    })
					    .error(function(data, status, headers, config) {
					    	defer.reject(data);
					    });
					return defer.promise;
				}
				
				this.links =function()
				{
					return data.links;					
				}

				this.actions = function()
				{
					return data.actions;
				}

				this.action = function(actionName, actionData)
				{
					var action = GetActionByName(data.actions, actionName);
					
					if (!action)
						throw "Siren provider is unable to get action with name " + actionName;

					var validate = ValidateActionData(action, actionData);
					
					if (!!validate)
						throw "Action " + actionName + " has the following data errors: " + validate;

					var method = (action.method || 'GET').toUpperCase();
					
					var config = {method: method, url: action.href, headers: sirenConfig.headers};
					
					if (method === 'GET') {
						config.url = SubstituteQueryParameters(config.url, actionData);
					} else { 
						config.data = actionData;
					}

					var defer = q.defer();

					http(config)
						.success(function(data, status, headers, config) {
					    	defer.resolve(t(data, protocolVersion));
					    })
					    .error(function(data, status, headers, config) {
					    	defer.reject(data);
					    });
					return defer.promise;
				}

				angular.extend(this, data.properties);
				CreateEntities(data.entities, this, t, protocolVersion);
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
