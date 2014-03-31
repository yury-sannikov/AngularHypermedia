'use strict';
describe("Angular Hypermedia provider", function () {

	var hypermediaProvider;

	beforeEach(function () {
		angular.module('testApp', function () {})
			.config(function (HypermediaProvider) {
				hypermediaProvider = HypermediaProvider;
			});

		module('angularHypermedia', 'testApp');

		inject(function () {});
	});

    it('test setUp', function () {
        hypermediaProvider.setUp({});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: null, currentVersion: null});

        hypermediaProvider.setUp({apiRoot: 'path/to/api/root'});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: 'path/to/api/root', currentVersion: null});

        hypermediaProvider.setUp({currentVersion: '0.0.1'});
        expect(hypermediaProvider.getConfig()).toEqual({apiRoot: 'path/to/api/root', currentVersion: '0.0.1'});
    });

});
