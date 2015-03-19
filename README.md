#Cheesefist
####A recursive test runner for Hapi REST APIs

Cheesefist executes requests against a set of endpoints, validating the response object. Requests can be chained recursively,
with the results of the previous tests available for keywork substitution in the path.

##Usage
The test framework uses a set of requests, executing each request and validating the output against expected.

Each request object represents a type of request, with a given `url` schema and (optionally) `payload`/`header` values. The optional `test` value is a set of rules that can be used to validate the response from the request. The results from each request can be passed onto a set of `followBy` tests, and those tests can use the result variables in their url construction.

##Quickstart
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

  //Call the execute() method,
  // optionally passing in a callback or the 'done' method from your test framework.
  it('TEST '+request.method+' '+request.url, function(done){
    execute(done);
    /*
    *  The execute function is also a promise, and mocha can handle promises.
    *  So you can just 'return execute()'' instead of using the 'done' callback.
    *  Or shorten further:
    *  it('Testing '+request.method+' '+request.url, execute);
    */
  })
}

describe('API Tests', function(){
  //Execute cheesefist, which will call the runTest method to integrate your test framework.
  cheesefist(server, testSuite, runTest)
});
```

##Example
This test grabs a list of objects, deletes every id in that list, then validates that a read against each id will fail.
```
{
  //This step queries the browse endpoint, returning a full array of 'things'
  url: '/things',
  test: {
    statusCode: 200,
    type: 'array'
  },
  followBy: {
    /*
    * The results of the parent request is used to generate paths for DELETE requests,
    *  a request will be generated for each item in parent results array.
    */
    method: 'DELETE',
    url: '/things/{thing_id}',
    headers: {
      'auth-token': 'tolkien'
    },

    //Our DELETE endpoint returns 204 on success, no body to validate.
    test: 204, //only test statusCode

    /*
    *  'followBy' can be an array, each followup test will run independently.
    *  This can be usful for reducing redundancy in your tests.
    */
    followBy: [

      /*
      *  Since a DELETE request was sent for every object returned by the first '/things' request,
      *  we can validate that a read request for each thing_id will fail.
      */
      {
        /*
        * Our DELETE endpoint doesn't return a body, but URL composition will
        * travel up the history chain and use the thing_id from the first test results. 
        */
        url: '/things/{thing_id}',

        method: 'GET',
        test: 404 //expect a 404 since this specific thing_id was deleted.
      },

      /*
      *  We can also browse '/things' again and validate that zero objects are returned.
      *  (This probably won't work if your browse endpoint is paged or limit/offset,
      *   but you get the idea)
      */
      {
        method: 'GET',
        url: '/things',
        test: {
          statusCode: 200,
          type: 'array',
          length: 0 //we should have 0 results now
        }
      }
    ]
  }
}
```

##Syntax
#####Request
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
-   `args`: An argument list to be used for URL composition, only valid on top-most request of a chain. If provided an array, the request will execute once for each element. (Optional)
-   `override`: An argument list to be used for URL composition, values contained here will any URL building values in the chain. (Optional)
-   `test`: Test arguments, see <a href="#_testing">Testing</a>. (Optional, default: statusCode 200)
-   `followBy`: An array of tests to execute, with the results of the previous tests available for <a href="#_urlcomposition">URL composition</a>. (Optional)

<a id="_urlcomposition"></a>
###URL Composition
TODO

<a id="_testing"></a>
###Testing
TODO
#####Array Validation
```
{
  url: '/things',
  test: {
    statusCode: 200, //(optional)
    type: 'array', //(optional) require result to be an array
    resultFields: ['thing_id', 'name', 'description'], //(optional) require field to exist on each array element
    length: 4  //(optional) check array length
  }
}
```
#####Single-object Validation
```
{
  url: '/things/{thing_id}',
  test: {
    statusCode: 200, //(optional)
    type: 'object', //(optional) require result to be an object
    resultFields: ['thing_id', 'name', 'description'] //(optional) require field to exist on result object
  }
}
```
#####Status Code test shortcut:
```
{
  method: 'DELETE',
  url: '/things/{thing_id}',
  ...
  test: 204 //(optional) shortcut for statusCode
}
```
#####Defaults
If `test` is undefined, it will default to `test: { statusCode: 200 }`.

To disable testing altogether, use `test: false` or `test: null`.

####Short Definition
If you use a string instead of a full request object, it will default to a simple `GET` test:

`'/status'` becomes:
```
{
  method: 'GET',
  url: '/status',
  test: 200
}
```
