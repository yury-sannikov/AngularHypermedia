'use strict';
describe("Angular Hypermedia provider", function () {

	var hypermediaProvider;
	var hypermedia;

	beforeEach(function () {
		angular.module('testApp', function () {})
			.config(function (HypermediaProvider) {
				hypermediaProvider = HypermediaProvider;
			});

		module('angularHypermedia', 'testApp');

		inject(function (_Hypermedia_) {hypermedia = _Hypermedia_;});
	});

    it('test setUp', function () {
        hypermediaProvider.setUp({});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: null, currentVersion: null, hypermediaFormat: "Siren"});

        hypermediaProvider.setUp({apiRoot: 'path/to/api/root'});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: 'path/to/api/root', currentVersion: null, hypermediaFormat: "Siren"});

        hypermediaProvider.setUp({currentVersion: '0.0.1'});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: 'path/to/api/root', currentVersion: '0.0.1', hypermediaFormat: "Siren"});
    });
    
    it('should have link function', function () {
		expect(typeof hypermedia.getLink).toBe("function");
	});

});

describe("Angular Hypermedia provider, API root as object", function () {

	var hypermediaProvider;
	var hypermedia;
	var apiRootObject;
	var $httpBackend;

	beforeEach(function () {
		angular.module('testApp', function () {})
			.config(function (HypermediaProvider) {
				hypermediaProvider = HypermediaProvider;
			});

		module('angularHypermedia', 'testApp');

		inject(function (_Hypermedia_, _$httpBackend_) {
			hypermedia = _Hypermedia_;
			$httpBackend = _$httpBackend_;
		});
		
		apiRootObject = {
			"links":[
        {
					"rel":[						// Link relations
						"ver:0.0.1",			// Version
						"latest-version",		// API current version mark (http://tools.ietf.org/html/rfc5829#section-3.2)
						"benefits/mybenefits",	// API name
					],
					"href" : "http://localhost:55556/api/benefits/mybenefits"
				}
			]
		};

		hypermediaProvider.setUp({apiRoot: apiRootObject});

	});

   afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
   });

    it('resolve link', inject(function ($rootScope) {
    	$httpBackend.when('GET','http://localhost:55556/api/benefits/mybenefits').respond(apiRootObject);
		
		var linkResult = hypermedia.getLink("benefits/mybenefits");
		expect(typeof linkResult).toBe("object");
		expect(typeof linkResult.then).toBe("function");
		
		var responseData;
		linkResult.then(function(data) {
			responseData = data;
		});
		
		$rootScope.$apply();
		$httpBackend.flush();
		
		expect(typeof responseData).toBe("object");
		// Check that response was wrapped into object
		var links = responseData.links();
		expect(links).toEqual(apiRootObject.links);
	}));

});