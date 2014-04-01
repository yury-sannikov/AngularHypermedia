'use strict';
describe("Siren provider", function () {

	var sirenProvider;
	var siren;
	var apiRootData;
	var helperThis;
	var sirenResponse; 
	var $injector;
	var $httpBackend;

	beforeEach(function () {
		angular.module('testApp', function () {})
			.config(function (SirenProvider) {
				sirenProvider = SirenProvider;
			});

		module('angularHypermedia', 'testApp');

		inject(function (_Siren_, _$injector_, _$httpBackend_) 
			{
				siren = _Siren_; 
				$injector = _$injector_;
				$httpBackend =_$httpBackend_;
			});
		
		apiRootData = {
							"links":[{
								"rel":[						// Link relations
									"ver:0.0.1",			// Version
									"benefits/mybenefits",	// API name
								],
								"url" : "http://localhost:55556/api/benefits/mybenefits"
							},
							{
								"rel":[						// Link relations
									"ver:0.0.2",			// Version
									"latest-version",		// API current version mark (http://tools.ietf.org/html/rfc5829#section-3.2)
									"benefits/mybenefits",	// API name
								],
								"url" : "http://localhost:55556/api/2/benefits/mybenefits"
							}
							]
						};
		
		helperThis = {data: apiRootData, proto: "0.0.1"};
		
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
				]
			};
	});

   afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
   });

    it('GetLinkUrlByRelVersion', function () {
    	expect(typeof sirenProvider.GetLinkUrlByRelVersion).toBe("function");

    	var result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits");
    	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

		var helperThisNoVer = {data: apiRootData, proto: null};

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThisNoVer, "benefits/mybenefits");
    	expect(result).toBe("http://localhost:55556/api/2/benefits/mybenefits");

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits", "0.0.1");
    	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits", "0.0.3");
    	expect(result).toBeUndefined();
	});
    
    it('CreateProperties', function () {
		var helperThisNoVer = {data: sirenResponse, proto: null};
		var result = {};
		sirenProvider.CreateProperties.call(helperThisNoVer, result);
		expect(result.orderNumber).toBe(42);
		expect(result.itemCount).toBe(3);
		expect(result.status).toBe('pending');
	});

    it('CreateEntities from requested data', inject(function ($rootScope) {
		var helperThisNoVer = {data: sirenResponse, proto: null};
		var result = {};
		sirenProvider.CreateEntities.call(helperThisNoVer, result, $injector, siren, "0.0.1");
		
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
		var helperThisNoVer = {data: sirenResponse, proto: null};
		var result = {};
		sirenProvider.CreateEntities.call(helperThisNoVer, result, $injector, siren, "0.0.1");
		
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
});

