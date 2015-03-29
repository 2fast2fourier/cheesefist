# Cheesefist
#### A recursive, exhaustive and branching test runner for Hapi REST-like APIs
[![Build Status](https://travis-ci.org/2fast2fourier/cheesefist.svg?branch=master)](https://travis-ci.org/2fast2fourier/cheesefist)

##### Recursive
Each request set can be followed by children requests (`followBy`), the results of each request are made available to their children. A 'request chain' is the logical progression of requests, from the first test to the last child in that branch. Any given test may include multiple `followBy` requests, causing a *Branch*.

##### Exhaustive
If a request returns an array of objects, each object is used to execute the next stage. This means a request to a browse-style endpoint followed by another request, will trigger an execution of that followBy request for EVERY object from the browse request. This also implies that recursive calls to multi-item endpoints will potentially create very large execution sets, but this can also be desirable for exaustively testing a dataset.

##### Branching
Any request can have any number of `followBy` requests. All of those children share the same parent state but are *independent* of each sibling. This means you can effectively branch your test suite, allowing each branch to continue down separate test paths. This can be useful for de-duplicating the early parts of a request chain.


*Please note:* This is an early release, syntax and functionality may change in the future. Response `test` cases are still in active development, expect new functionality and changes to existing features.

See [`changelog.md`](changelog.md) for a full list of breaking changes.

## Usage
Cheesefist is designed to integrate with most test frameworks, like Mocha or Lab. See Quickstart for an example using Mocha.

#### Syntax
The `cheesefist(server, testSuite, testFn, options, callback)` call will start execution on a recursive [`testSuite`](#_syntax), calling `testFn` to integrate into a test framework, with optional `options` and/or `callback`.
- `server` is a composed Hapi instance that exposes `server.inject()` for executing requests. It is not necessary to `start()` this server.
- A `testSuite` is comprised of one or more [*Requests*](#_syntax), each of which may recurse to create a request chain.
- The `testFn` is a function that can invoke the external test framework (like Mocha or Lab). See [*Quickstart*](#_quickstart) below. It will be executed once for every request object in `testSuite` and may be responsible for multiple hits to `server.inject` in a single call. 
- [`options`](docs/settings.md) allows for custom validation plugins and global validation settings, with other features to be added in the future. 
- `callback` provides a node-style callback for the full execution run. If any error throws, if will be passed into the `err` field of the callback. Including `callback` disables promise functionality.
- The `cheesefist()` call returns a promise, fullfilled with the same values as `callback`. Both callback and promise are optional and can be safely ignored.

<a id="_quickstart"></a>
## Quickstart
```
var cheesefist = require('cheesefist');

var server = ...;//configure a Hapi server and routes (or build via glue)

/*
*  This test suite will hit a browse endpoint,
*  then send a request to the individual read for each result from the first request.
*
*  See Syntax and Examples for more info.
*/
var testSuite = [
  {
    url: '/users'
    test: {
      statusCode: 200,
      type: 'array',
      resultFields: ['id', 'username', 'description']
    },
    followBy: {
      url: '/users/{user_id}',
      test: {
        statusCode: 200,
        type: 'object',
        resultFields: ['id', 'username', 'description']
      }
    }
  }
];

/*
* The 'runTest' method is passed into cheesefist,
* which will call this method for each request step.
*
* This examle uses Mocha as the test framework, you can use other frameworks as well.
*/
function runTest(request, execute){
  //This function will be called with each request in the suite,
  // and the target endpoint may be hit multiple times during a single execute().

  //Call the execute() method, optionally passing in a callback
  // or the 'done' method from your test framework.
  it('TEST '+request.method+' '+request.url, function(done){
    execute(done);
    /*
    *  The execute function will return a promise, and mocha can handle a promise.
    *  So you can just 'return execute()'' instead of using the 'done' callback.
    *  Or shorten further:
    *  it('Testing '+request.method+' '+request.url, execute);
    */
  });
}

describe('API Tests', function(){
  //Execute cheesefist, which will call the runTest method to integrate your test framework.
  cheesefist(server, testSuite, runTest);
});
```
See [Examples](docs/examples.md) for detailed test cases.

## Syntax
<a id="_syntax"></a>
##### Request
A test suite is comprised of one or more *Requests*, each representing a potential set of requests. If requests are defined recursively via `followBy`, values can be assigned from previous requests in that chain via URL `{placeholders}` or `payload`/`override` lookup functions.
```
{
  method: 'GET',
  url: '/users/{user_id}',
  args: {
    user_id: 1
  },
  //override: {...},
  //payload: {...},
  test: {
    type: 'object',
    statusCode: 200,
    resultFields: ['id', 'name', 'description']
  },
  followBy: [ REQUEST, ... ]
}
```
-   `url`: URL schema for request. Can use value placeholders `{key}` or `{[history].key}`, see <a href="#_urlcomposition">URL Composition</a>. (Required)
-   `method`: HTTP method for the request. GET, POST, PUT, ect. (Optional, default: `GET`)
-   `args`: An argument object to be used for URL composition, only valid on top-most request of a chain. If provided an array, the request will execute once for each element. (Optional)
-   `override`: An argument object to be used for URL composition, values contained here will override any history values when composing the URL. (Optional) Can use lookup/generator functions, see [Generator example](docs/examples.md#_payload)
-   `payload`: Payload values for `POST`/`PUT` requests. (Optional) Can use lookup/generator functions, see [Generator example](docs/examples.md#_payload)
-   `test`: Test arguments, see <a href="#_testing">Testing</a>. (Optional, default: statusCode 200)
-   `followBy`: An array of tests to execute, with the results of the previous tests available for [URL Composition](docs/composition.md). (Optional)

*Important:* See [URL Composition](docs/composition.md) docs for details on how URLs and requests are generated.

## URL Composition
The `url` field in a request can include placeholders `{keyname}` or `{[historyPosition].keyname}`, those placeholders are automatically replaced with values from `args`, `overrides`, or the result of any parent tests. See [URL Composition](docs/composition.md) for more detail.

<a id="_testing"></a>
### Testing
Validation rules specified in `test` are applied to every request, if any validation test fails it will also cancel any child tests in that chain. Custom validation plugins can be added to the test suite, see [Settings](docs/settings.md) for custom test plugins and global test cases.
##### Validation Syntax
```
{
  url: '/things',
  ...
  test: {
    //(optional) Require status code to match.
    statusCode: 200,

    //(optional) Require response to be a type, available types: 'array', 'object'.
    type: 'array',

    //(optional) Require field to exist on each array element.
    //NOTE: resultFields is currently in a state of flux, more functionality is coming.
    resultFields: ['thing_id', 'name', 'description'], 

     //(optional) Arrays only, require array to have given length.
    length: 4 
  }
}
```
##### Validation Defaults
-  If `test` is a number, it is equivalent to `test: { statusCode: (number) }`. `statusCode: false` will disable the statusCode check.
-  If `test` is undefined, it will default to `test: { statusCode: 200 }`.
-  To disable testing altogether, use `test: false` or `test: null`.

### Short Definition
If you use a string instead of a full request object, it will default to a simple `GET` test:

`'/status'` becomes:
```
{
  method: 'GET',
  url: '/status',
  test: 200
}
```

## Contribution
Create any pull requests against `master`. If your feature branch is behind upstream master please attempt to rebase/merge, we can help resolve merge conflicts if there are any issues. Feel free to add yourself to the contribution section in `package.json` in your PR.
