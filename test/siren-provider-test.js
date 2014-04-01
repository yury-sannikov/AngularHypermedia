'use strict';
describe("Siren provider", function () {

	var sirenProvider;
	var siren;
	var sirenData;
	var helperThis;

	beforeEach(function () {
		angular.module('testApp', function () {})
			.config(function (SirenProvider) {
				sirenProvider = SirenProvider;
			});

		module('angularHypermedia', 'testApp');

		inject(function (_Siren_) {siren = _Siren_;});
		
		sirenData = [{
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
						}];
		
		helperThis = {data: sirenData, proto: "0.0.1"};
	});


    it('GetLinkUrlByRelVersion', function () {
    	expect(typeof sirenProvider.GetLinkUrlByRelVersion).toBe("function");

    	var result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits");
    	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

		var helperThisNoVer = {data: sirenData, proto: null};

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThisNoVer, "benefits/mybenefits");
    	expect(result).toBe("http://localhost:55556/api/2/benefits/mybenefits");

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits", "0.0.1");
    	expect(result).toBe("http://localhost:55556/api/benefits/mybenefits");

    	result = sirenProvider.GetLinkUrlByRelVersion.call(helperThis, "benefits/mybenefits", "0.0.3");
    	expect(result).toBeUndefined();

	});

});

