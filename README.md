# AngularHypermedia

## An AngularJS provider hides REST hypermedia complexity

### Developer Local Setup

1. Install Node.JS. Test to make sure `node` and `npm` are both on the system path.
2. Install Git.
3. Make sure that `node`, `npm`, `git` are all on your path. This is particularly an issue on Windows, where installing programs tends not to set up the path by default.
4. Clone the repository.
5. From the repository folder: `npm install`

Now you can run `grunt` from the client folder to test

### Usage

The following code need to be added:

```javascript
angular.module("your-application", ["angularHypermedia"]);

app.config(function (AngularHypermediaProvider) {
    AngularHypermediaProvider.setUp({
		apiRoot : "http:/link/to/apiroot.json",
		currentVersion: "0.0.1"
	});
});
```

Library will perform GET request to apiRoot URL to retrieve API information. 

Suppose we have the following API root: 

```json
[
{
	"links":[{
		"rel":[						// Link relations
			"ver:0.0.1",			// Version
			"latest-version",		// API current version mark (http://tools.ietf.org/html/rfc5829#section-3.2)
			"benefits/mybenefits",	// API name
		],
		"url" : "http://localhost:55556/api/benefits/mybenefits"
	}
	]
}
]
```
You can access My Benefits list using the following code

```javascriot
angular.module('gems.myinsurance', [])
.controller('MyInsuranceCtrl', function ($scope, hypermediaProvider) {

	// Link method returns a promise
    $scope._mybenefits = hypermediaProvider.link("benefits/mybenefits")
		.catch(function error(data)
		{
			//Handle error
		});
    
    // When promise resolved, child entities is accessible as promises
    // child emtities can be embedded or have links on it.
    // This is transparent for client code
    $scope._mybenefits.then(function(benefits){
        $scope.some_benefits_details = benefits.details
        .catch(function(data)
        {
        });
    });
	...
});

```
