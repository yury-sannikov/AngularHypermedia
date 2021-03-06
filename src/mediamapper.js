'use strict';

angular.module("angularHypermedia")
.service("Mediamapper",  ["$q", "$http", function (q, http) {	

	function PlainJsonMapper(data, baseUrl) {
		
		var payload = {};
		
		payload.properties = ResolveConflicts(angular.copy(data));

		payload.actions = [];
		payload.links = [];
		payload.actions.push({
			name: "post",
			title: "POST action",
			method: "POST",
			href: baseUrl
		});
		payload.actions.push({
			name: "put",
			title: "PUT action",
			method: "PUT",
			href: baseUrl
		});
		payload.actions.push({
			name: "path",
			title: "PATCH action",
			method: "PATCH",
			href: baseUrl
		});
		payload.actions.push({
			name: "delete",
			title: "DELETE action",
			method: "DELETE",
			href: baseUrl
		});

		return payload;
	}
	
	function SirenJsonMapper(payload) {
		payload = angular.copy(payload);
		payload.properties = ResolveConflicts(payload.properties);
		return payload;
	}

	function ResolveConflicts(payload) {
		if (!payload)
			return payload;
		var resolve = function(name, data) {
			if (!(name in data))
				return;
			data["_" + name] = data[name];
			delete data[name];
		}
		resolve("link", payload);
		resolve("links", payload);
		resolve("action", payload);
		resolve("actions", payload);

		return payload;
	}

	var mappers = [
		{
			accept: function(contentType) {
				if (!angular.isString(contentType))
					return false;
				return contentType.indexOf("application/vnd.siren+json") != -1;
			},
			mapper : SirenJsonMapper
		},
		{
			accept: function(contentType) {
				if (!angular.isString(contentType))
					return false;
				return contentType.indexOf("application/json") != -1;
			},
			mapper : PlainJsonMapper
		}
	];

	var problemJsonFromObject = function (err) {
		
		var result = {
			type: "about:blank",
			status: angular.isNumber(err) ? err : 500
		};

		if (angular.isString(err)) {
			result.title = err;
		} else if (angular.isObject(err)) {
			angular.extend(result, err);
		}

		return result;
	};

	return {
		get : function(headersFn){
			if (typeof headersFn != 'function')
				return null;
			
			var contentType = headersFn("content-type");
			if (!contentType)
				throw "Unknown content-type header value";

			for(var index in mappers) {
				var mapper = mappers[index];

				if (mapper.accept(contentType))
					return mapper.mapper;
			}

			return angular.noop;
		},
		
		problemJsonFromObject : problemJsonFromObject,

		problemJson : function(data, status, headers, config){
			var result = problemJsonFromObject(data);
			if (status)
				result.status = status;
			return result;
		}

	};
}]);
