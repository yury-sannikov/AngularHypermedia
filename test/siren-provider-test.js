'use strict';
describe("Siren provider", function () {

	var siren;
	var apiRootData;
	var sirenResponse; 
	var $injector;
	var $httpBackend;

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
	});

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
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

});
