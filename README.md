# Cheesefist
#### A recursive test runner for Hapi REST APIs
[![Build Status](https://travis-ci.org/2fast2fourier/cheesefist.svg?branch=master)](https://travis-ci.org/2fast2fourier/cheesefist)

Cheesefist executes requests against a set of endpoints, validating the response. Requests can be chained recursively,
with the results from previous requests available for keyword substitution in the url path. This is most useful for running requests against a large testing dataset, validating that every response is within expectations.

Cheesefist is designed to integrate with most test frameworks, like Mocha or Lab. See Quickstart for an example using Mocha.

##### NOTE:
This is an early release, syntax and functionality may change in the future. Response `test` cases are still in active development, expect new functionality and changes to existing features.

See [`changelog.md`](changelog.md) for a full list of breaking changes.

## Usage
The test framework uses a set of requests, executing each request and validating the output against expected.

Each request object represents a type of request, with a given `url` schema and (optionally) `payload`/`header` values. The optional `test` value is a set of rules that can be used to validate the response from the request. The results from each request can be passed onto a set of `followBy` tests, and those tests can use the result variables in their url construction.

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
    *  The execute function is also a promise, and mocha can handle promises.
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
##### Request
```
{
  method: 'GET',
  url: '/users/{user_id}',
  args: {
    user_id: 1
  },
  test: {
    type: 'object',
    statusCode: 200,
    resultFields: ['id', 'name', 'description']
  },
  followBy: [ TEST, ... ]
}
```
-   `url`: URL schema for request. Can use value placeholders `{key}` or `{[history].key}`, see <a href="#_urlcomposition">URL Composition</a>. (Required)
-   `method`: HTTP method for the request. GET, POST, PUT, ect. (Optional, default: `GET`)
-   `args`: An argument object to be used for URL composition, only valid on top-most request of a chain. If provided an array, the request will execute once for each element. (Optional)
-   `override`: An argument object to be used for URL composition, values contained here will override any history values when composing the URL. (Optional)
-   `payload`: Payload values for `POST`/`PUT` requests. Can use lookup/generator functions, see [Payload example](docs/examples.md#_payload) (Optional)
-   `test`: Test arguments, see <a href="#_testing">Testing</a>. (Optional, default: statusCode 200)
-   `followBy`: An array of tests to execute, with the results of the previous tests available for <a href="#_urlcomposition">URL composition</a>. (Optional)

<a id="_urlcomposition"></a>
### URL Composition
The `url` field in a request can include placeholders `{keyname}`, those placeholders are automatically replaced with values from `args`, `overrides`, or the result of any parent tests.

The order of precedence is as follows:
-  Values from the `overrides` object attached to that request. Overrides DO NOT propegate to child requests in a chain.
-  Response values from the request history of that test chain, starting from the immediate parent and working backwards to the beginning.
-  Values from the `args` object in the root request. These values are also available as `{[0].keyname}` as a history request.

Note: The `args` object is only valid on the first request of a chain, `args` values attached to `followBy` requests will be ignored.

##### Example
Given the following test suite:
```
{
  url: '/users',
  followBy: {
    method: 'PUT',
    url: '/users/{user_id}',
    payload: {
      name: ...
    }
  }
}
```
If the first request returns an array:
```
[
  {
    user_id: 5
  },
  {
    user_id: 7
  },
  {
    user_id: 8
  }
]
```
Then the `followBy` test will generate these requests:
```
PUT /users/5
PUT /users/7
PUT /users/8
```

The result set from each request is combined for the `followBy` tests, this means that recursively requesting against browse endpoints may generate a very large number of hits. Example:
```
{
  url: '/users',
  followBy: {
    url: '/users/{user_id}/email_addresses',
    followBy: {
      method: 'DELETE',
      url: '/users/{user_id}/email_addresses/{email_address_id}'
    }
  }
}
```
Assuming that each user has 3 email addresses, the innermost `followBy` test will generate this combined request set:
```
DELETE /users/5/email_addresses/1
DELETE /users/5/email_addresses/3
DELETE /users/5/email_addresses/4
DELETE /users/7/email_addresses/5
DELETE /users/7/email_addresses/7
DELETE /users/7/email_addresses/12
DELETE /users/8/email_addresses/13
DELETE /users/8/email_addresses/16
DELETE /users/8/email_addresses/23
```

#### History References
In case of key name conflicts, a placeholder can also reference a specific point in the request chain history using `{[x].keyname}`. `x` is a number referencing the position in the request chain. Specifying a history position bypasses the order of precedence described above. If the referenced key does not exist at the history position specified, the test will fail immediately.

The history position starts with `[0]`, which is the `args` value on the root test, and `[1]` is the result from the first request, `[2]` the results from the first `followBy` test, and so-on.

Example:
```
{
  url: '/users/{user_id}',
  args: [
  {
    user_id: 2
  },
  {
    user_id: 4
  }],
  followBy: {
    url: '/users/{user_id}/email_addresses',
    followBy: {
      method: 'DELETE',
      url: '/users/{user_id}/email_addresses/{email_address_id}'
    }
  }
}
```
At the point URL composition executes for `/users/{user_id}/email_addresses/{email_address_id}`:
-  `[0]` is the `args` field in `/users/{user_id}`. (`[0]` is always the root `args` object even if `args` was not included.)
-  `[1]` is the result from `/users/{user_id}`.
-  `[2]` is the result from `/users/{user_id}/email_addresses`.

Normally, the key search will start with the immediate parent result, `[2]`. If you had a `user_id` key name conflict between results `[1]` and `[2]` and wanted the value from `[1]`, you could specify `{[1].user_id}` to avoid it.

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
-  If `test` is a number, it is equivalent to `test: { statusCode: (number) }`.
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
