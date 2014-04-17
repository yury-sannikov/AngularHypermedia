'use strict';
describe("Siren provider", function () {

	var siren;
	var apiRootData;
	var sirenResponse; 
	var $injector;
	var $httpBackend;
	var sirenArrayResponse;

	beforeEach(function () {
		module('angularHypermedia');

		inject(function (_Siren_, _$injector_, _$httpBackend_) 
			{
				siren = _Siren_; 
				$injector = _$injector_;
				$httpBackend =_$httpBackend_;
			});
		
		apiRootData = {
			"links": [
				{
					"rel":[						// Link relations
						"ver:0.0.1",			// Version
						"benefits/mybenefits",	// API name
					],
					"href" : "http://localhost:55556/api/benefits/mybenefits"
				},
				{
					"rel":[						// Link relations
						"ver:0.0.2",			// Version
						"latest-version",		// API current version mark (http://tools.ietf.org/html/rfc5829#section-3.2)
						"benefits/mybenefits",	// API name
					],
					"href" : "http://localhost:55556/api/2/benefits/mybenefits"
				}
			]
		};
		

		
		sirenResponse =   
			{
				"class": [ "order" ],
				"properties": { 
					"orderNumber": 42, 
					"itemCount": 3,
					"status": "pending"
				},
				"entities": [
					{ 
						"class": [ "items", "collection" ], 
						"rel": [ "orderItems", "items" ], 
						"href": "http://localhost:55556/api/benefits/myorders"
					},
					{ 
						"class": [ "shipping", "customer" ], 
						"rel": [ "shipping" ], 
						"href": "http://localhost:55556/api/benefits/shipping",
						"properties": { 
							"city": "New York", 
							"zip": 12345
						}
					},
				],
				"actions": [
				{
					"name": "add-item",
					"title": "Add Item",
					"method": "POST",
					"href": "http://api.x.io/orders/42/items",
					"type": "application/x-www-form-urlencoded",
					"fields": [
						{ "name": "orderNumber", "type": "hidden", "value": "42" },
						{ "name": "productCode", "type": "text" },
						{ "name": "quantity", "type": "number" }
					]
				}
				]
			};

		sirenArrayResponse = [
		  {
		    "properties": {
		      "benefittype": "Medical",
		      "employername": "NRECA",
		      "coverage": "Employee"
		    },
		    "class": [
		      "benefits",
		      "list"
		    ],
		    "links": [
		      {
		        "rel": [
		          "self"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits/list"
		      },
		      {
		        "rel": [
		          "parent"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits"
		      }
		    ],
		    "actions": []
		  },
		  {
		    "properties": {
		      "benefittype": "Dental",
		      "employername": "NRECA",
		      "coverage": "Employee + Spouse"
		    },
		    "class": [
		      "benefits",
		      "list"
		    ],
		    "links": [
		      {
		        "rel": [
		          "self"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits/list"
		      },
		      {
		        "rel": [
		          "parent"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits"
		      }
		    ],
		    "actions": []
		  },
		  {
		    "properties": {
		      "benefittype": "Vision",
		      "employername": "NRECA",
		      "coverage": "Employee + Spouse"
		    },
		    "class": [
		      "benefits",
		      "list"
		    ],
		    "links": [
		      {
		        "rel": [
		          "self"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits/list"
		      },
		      {
		        "rel": [
		          "parent"
		        ],
		        "href": "http://localhost:55556/api/benefits/mybenefits"
		      }
		    ],
		    "actions": []
		  }
		]		
	});

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.resetExpectations();
  });

  it('GetLinkUrlByRelVersion', function () {
  	expect(typeof siren.GetLinkUrlByRelVersion).toBe("function");

  	var result = siren.GetLinkUrlByRelVersion(apiRootData.links, "benefits/mybenefits", "0.0.1");
  	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

    	result = siren.GetLinkUrlByRelVersion(apiRootData.links, "benefits/mybenefits");
    	expect(result).toBe("http://localhost:55556/api/2/benefits/mybenefits");

    	result = siren.GetLinkUrlByRelVersion(apiRootData.links, "benefits/mybenefits", "0.0.1");
    	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

    	result = siren.GetLinkUrlByRelVersion(apiRootData.links, "benefits/mybenefits", "0.0.3");
    	expect(result).toBeUndefined();
	});
    
  it('CreateEntities from requested data', inject(function ($rootScope) {
		var result = {};
		siren.CreateEntities(sirenResponse.entities, result, siren.transform, "0.0.1");
		
		// Entities are always properties. First access triggers data request
		expect("orderItems" in result).toBe(true);
		expect("items" in result).toBe(true);

		//Check that access to property invokes http request and return promise
		$httpBackend.when('GET','http://localhost:55556/api/benefits/myorders').respond({
				"properties": { 
					"parentOrderId": 54
				}			
		});

		expect(typeof result.orderItems.then).toBe("function");

		// Check that order items has good props
		var orderData;
		result.orderItems.then(function(data) {
			orderData = data;
		});
		
		$rootScope.$apply();
		$httpBackend.flush();

		expect(orderData.parentOrderId).toBe(54);
	}));
    
  it('CreateEntities from embedded data', inject(function ($rootScope) {
		var result = {};
		siren.CreateEntities(sirenResponse.entities, result, siren.transform, "0.0.1");
		
		// Entities are always properties. First access triggers data request
		expect("orderItems" in result).toBe(true);
		expect("items" in result).toBe(true);
		expect("shipping" in result).toBe(true);

		expect(typeof result.shipping.then).toBe("function");

		var shippingData;
		result.shipping.then(function(data) {
			shippingData = data;
		});
		
		$rootScope.$apply();

		expect(shippingData.city).toBe("New York");
		expect(shippingData.zip).toBe(12345);
	}));
	
	it('get links', inject(function ($rootScope) {
		expect(typeof siren.transform).toBe("function");

		var transformed = siren.transform(apiRootData, "0.0.1");

		expect(typeof transformed.links).toBe("function");

		var links = transformed.links();
		expect(links.length).toBe(apiRootData.links.length);
		expect(links).toEqual(apiRootData.links);
	}));

	it('get actions', inject(function ($rootScope) {
		expect(typeof siren.transform).toBe("function");

		var transformed = siren.transform(sirenResponse, "0.0.1");

		expect(typeof transformed.actions).toBe("function");

		var actions = transformed.actions();
		expect(actions.length).toBe(sirenResponse.actions.length);
		expect(actions).toEqual(sirenResponse.actions);
	}));

	it('get action by name', inject(function ($rootScope) {
		expect(typeof siren.GetActionByName).toBe("function");
		var action = siren.GetActionByName(sirenResponse.actions, "add-item");
		expect(action).toEqual(sirenResponse.actions[0]);
	}));

	it('transform array', inject(function ($rootScope) {
		expect(typeof siren.transform).toBe("function");

		var transformed = siren.transform(sirenArrayResponse, "0.0.1");

		expect(angular.isArray(transformed)).toBe(true);
		expect(transformed.length).toBe(sirenArrayResponse.length);
		for(var idx in transformed) {
			var item = transformed[idx];
			expect(typeof item.links).toBe("function");
		}

	}));

	describe("validate action data", function () {
		it('with empty data', inject(function ($rootScope) {
			var validateResult = siren.ValidateActionData({}, null);
			expect(validateResult).toBe(undefined);
			
			validateResult = siren.ValidateActionData({}, undefined);
			expect(validateResult).toBe(undefined);
		}));
		
		it('empty action should throw', inject(function ($rootScope) {
			expect(function(){ siren.ValidateActionData(null, {})}).toThrow();
		}));

		it('empty fields should yeild validation success', inject(function ($rootScope) {
			expect(siren.ValidateActionData({}, {})).toBe(undefined);
			expect(siren.ValidateActionData({fields:null}, {})).toBe(undefined);
			expect(siren.ValidateActionData({fields:undefined}, {})).toBe(undefined);
			expect(siren.ValidateActionData({fields:[]}, {})).toBe(undefined);
		}));

		it('validation success on matching fields', inject(function ($rootScope) {
			expect(siren.ValidateActionData({fields:[{"name":"id"}]}, {id:1})).toBe(undefined);
			expect(siren.ValidateActionData({fields:[{"name":"id"},{"name":"value"}]}, {id:1, value:null})).toBe(undefined);
			expect(siren.ValidateActionData({fields:[{"name":"value"}, {"name":"id"}]}, {id:null, value:1})).toBe(undefined);
		}));

		it('validation fail on lack of data fields', inject(function ($rootScope) {
			expect(siren.ValidateActionData({fields:[{"name":"id"},{"name":"value"}]}, {id:1})).not.toBe(undefined);
			expect(siren.ValidateActionData({fields:[{"name":"value"}, {"name":"id"}]}, {value:1})).not.toBe(undefined);
		}));

		it('validation fail on extra data fields', inject(function ($rootScope) {
			expect(siren.ValidateActionData({fields:[{"name":"id"}]}, {id:1, value:null})).not.toBe(undefined);
			expect(siren.ValidateActionData({fields:[{"name":"id"},{"name":"value"}]}, {id:1, value:null, extra:null})).not.toBe(undefined);
			expect(siren.ValidateActionData({fields:[{"name":"value"}, {"name":"id"}]}, {id:null, value:1, extra:0})).not.toBe(undefined);
		}));
	
	});

	describe("query substitution", function () {
		it('no query no substitution', inject(function ($rootScope) {
			var url = "http://path/to/api?id=1&name=test";
			expect(siren.SubstituteQueryParameters(url, {id:1, name:'scope'})).toEqual(url);
		}));
		
		it('partial substitution should throw', inject(function ($rootScope) {
			var url = "http://path/to/api?id=:id&name=:name";
			expect(function(){ siren.SubstituteQueryParameters(url, {id:1})}).toThrow();
		}));

		it('should works', inject(function ($rootScope) {
			var url = "http://path/to/api?id=:id&name=:name&id=:id";
			expect(siren.SubstituteQueryParameters(url, {id:1, name:"test"})).toBe("http://path/to/api?id=1&name=test&id=1");
			var complexName = "complex Name !@#$%^&*()<>";
			url = "http://path/to/api?id=:id&name=:name";
			expect(siren.SubstituteQueryParameters(url, {id:1, name:complexName})).toBe("http://path/to/api?id=1&name=" + encodeURIComponent(complexName));
		}));
	});

	describe("action integration", function () {
		
		it('get', inject(function ($rootScope) {

			var source = {
				actions: [
					{
						"name": "search-item",
						"title": "Search Item",
						"method": "GET",
						"href": "http://api.x.io/orders?orderNumber=:orderNumber&productCode=:productCode&quantity=:quantity",
						"type": "application/x-www-form-urlencoded",
						"fields": [
							{ "name": "orderNumber", "type": "hidden", "value": "42" },
							{ "name": "productCode", "type": "text" },
							{ "name": "quantity", "type": "number" }
						]						
					}
				]
			};

			var trasfromed = siren.transform(source, "0.0.1");


			$httpBackend.when('GET','http://api.x.io/orders?orderNumber=1&productCode=IER&quantity=5').respond({
					"properties": { 
						"Id": 1
					}			
			});

			var promice = trasfromed.action("search-item", {orderNumber:1, productCode:"IER", quantity:5});
			
			var orderData;
			promice.then(function(data) {
				orderData = data;
			});

			$rootScope.$apply();
			$httpBackend.flush();

			expect(orderData.Id).toBe(1);
		}));
		
		it('non get', inject(function ($rootScope) {

			var source = {
				actions: [
					{
						"name": "create-item",
						"title": "Create Item",
						"method": "POST",
						"href": "http://api.x.io/orders",
						"type": "application/x-www-form-urlencoded",
						"fields": [
							{ "name": "orderNumber", "type": "hidden", "value": "42" },
							{ "name": "productCode", "type": "text" },
							{ "name": "quantity", "type": "number" }
						]						
					}
				]
			};

			var trasfromed = siren.transform(source, "0.0.1");


			$httpBackend.when('POST','http://api.x.io/orders', {orderNumber:10, productCode:"ASF", quantity:1}).respond({
					"properties": { 
						"Id": 2
					}			
			});

			var promice = trasfromed.action("create-item", {orderNumber:10, productCode:"ASF", quantity:1});
			
			var orderData;
			promice.then(function(data) {
				orderData = data;
			});

			$rootScope.$apply();
			$httpBackend.flush();

			expect(orderData.Id).toBe(2);
		}));
	});
	
	describe("handle non-siren object", function () {
		it('transform function', inject(function ($rootScope) {

			var source = {
				id: 1,
				name: 'test',
				value: 507.65
			};

			var trasfromed = siren.transform(source, "0.0.1");
			expect(trasfromed.id).toBe(source.id);
			expect(trasfromed.name).toBe(source.name);
			expect(trasfromed.value).toBe(source.value);
		}));

		it('transform function actions', inject(function ($rootScope) {

			var source = {
				id: 1,
				name: 'test',
				value: 507.65
			};

			var trasfromed = siren.transform(source, "0.0.1", "/api");
			expect(trasfromed.actions()[0].method).toBe("POST");
			expect(trasfromed.actions()[0].title).toBe("POST action");
			expect(trasfromed.actions()[0].name).toBe("post");
			expect(trasfromed.actions()[0].href).toBe("/api");
		}));

		it('POST action invocation', inject(function ($rootScope) {

			var source = {
				id: 1,
				name: 'test',
				value: 507.65
			};
			
			$httpBackend.when('POST', '/api', {orderNumber:1, productCode:"IER", quantity:5}).respond({
					"properties": { 
						"Id": 56
					}			
			});
			
			var trasfromed = siren.transform(source, "0.0.1", "/api");

			var promice = trasfromed.action("post", {orderNumber:1, productCode:"IER", quantity:5});
			
			var orderData;
			promice.then(function(data) {
				orderData = data;
			})
			.catch(function(data) {
				console.log(data);
			});

			$rootScope.$apply();
			$httpBackend.flush();

			expect(orderData.Id).toBe(56);
		}));

		it('PUT action invocation', inject(function ($rootScope) {

			var source = {
				id: 1,
				name: 'test',
				value: 507.65
			};
			
			$httpBackend.when('PUT', '/api/17', {orderNumber:17, productCode:"IER", quantity:5}).respond({
					"properties": { 
						"Id": 56
					}			
			});
			
			var trasfromed = siren.transform(source, "0.0.1", "/api");

			var promice = trasfromed.action("put", {orderNumber:17, productCode:"IER", quantity:5, __urlTransformer:function(url) {return url + '/' + this.orderNumber;} });
			
			var orderData;
			promice.then(function(data) {
				orderData = data;
			})
			.catch(function(data) {
				console.log(data);
			});

			$rootScope.$apply();
			$httpBackend.flush();

			expect(orderData.Id).toBe(56);
		}));

		it('DELETE action invocation', inject(function ($rootScope) {

			var source = {
				id: 1,
				name: 'test',
				value: 507.65
			};
			
			$httpBackend.when('DELETE', '/api/17').respond({
					"properties": { 
						"Id": 56
					}			
			});
			
			var trasfromed = siren.transform(source, "0.0.1", "/api");

			var promice = trasfromed.action("delete", {__urlTransformer:function(url) {return url + '/17';} });
			
			var orderData;
			promice.then(function(data) {
				orderData = data;
			})
			.catch(function(data) {
				console.log(data);
			});

			$rootScope.$apply();
			$httpBackend.flush();

			expect(orderData.Id).toBe(56);
		}));
	});
	
	describe("error handling", function () {
		it('convert exception to HTTP error', inject(function ($rootScope) {

			var err = siren.SimulateHTTPErrorFromException();
			expect(err).toEqual({data:{Message:"An error occurred"}, status:500, headers: angular.noop, config: {}});

			err = siren.SimulateHTTPErrorFromException(405);
			expect(err).toEqual({data:{Message:"An error occurred"}, status:405, headers: angular.noop, config: {}});

			err = siren.SimulateHTTPErrorFromException("shit happens");
			expect(err).toEqual({data:{Message:"shit happens"}, status:500, headers: angular.noop, config: {}});

			err = siren.SimulateHTTPErrorFromException({message: "shit happens"});
			expect(err).toEqual({data:{Message:"shit happens"}, status:500, headers: angular.noop, config: {}});

			err = siren.SimulateHTTPErrorFromException({message: "shit happens", status: 502});
			expect(err).toEqual({data:{Message:"shit happens"}, status:502, headers: angular.noop, config: {}});

			err = siren.SimulateHTTPErrorFromException({status: 502});
			expect(err).toEqual({data:{Message:"An error occurred"}, status:502, headers: angular.noop, config: {}});

			var err = siren.SimulateHTTPErrorFromException({});
			expect(err).toEqual({data:{Message:"An error occurred"}, status:500, headers: angular.noop, config: {}});

			var err = siren.SimulateHTTPErrorFromException([]);
			expect(err).toEqual({data:{Message:"An error occurred"}, status:500, headers: angular.noop, config: {}});
		}));

		it('no link error', inject(function ($rootScope) {
			var transformed = siren.transform(apiRootData, "0.0.1");

			var link = transformed.link("no-rel-found");

			var result;
			link.catch(function(err) {result = err;});
			$rootScope.$apply();

			expect(result).toEqual({data:{Message: 'Rel no-rel-found/0.0.1 not found.'}, status: 404, headers: angular.noop, config: {}});
		}));

		it('no action error', inject(function ($rootScope) {
			var transformed = siren.transform(apiRootData, "0.0.1");

			var link = transformed.action("nonexistent-action");

			var result;
			link.catch(function(err) {result = err;});
			$rootScope.$apply();

			expect(result).toEqual({data:{Message: "Action 'nonexistent-action' forbidden."}, status: 403, headers: angular.noop, config: {}});
		}));

		it('action invalid parameters error', inject(function ($rootScope) {
			var transformed = siren.transform(sirenResponse, "0.0.1");

			var link = transformed.action("add-item");

			var result;
			link.catch(function(err) {result = err;});
			$rootScope.$apply();

			expect(result).toEqual({data:{Message: "Bad request 'add-item'. Message: Data should be supplied"}, status: 400, headers: angular.noop, config: {}});

			link = transformed.action("add-item", {id: 1});
			link.catch(function(err) {result = err;});
			$rootScope.$apply();

			expect(result).toEqual({data:{Message: "Bad request 'add-item'. Message: Supplied data doesn't contain field 'orderNumber'"}, status: 400, headers: angular.noop, config: {}});
		}));

	});


});
