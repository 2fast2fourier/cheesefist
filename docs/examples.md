## Examples

#### List, Delete and Confirm
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

<a id="_payload"></a>
#### Payload/Override Generator Functions
If a `payload` or `override` value is replaced with a function, it will be executed to generate replacement values.
A set of utilities exist to lookup history values in `cheesefist/util/lookup`. [Faker](https://www.npmjs.com/package/faker) is useful for bulk generating test data.
```
var lookup = require('cheesefist/util/lookup');
var faker = require('faker');

{
  url: '/users',
  followBy: {
    url: '/users/{user_id}/email',
    method: 'POST',
    payload: {
      user_id: lookup.history('user_id'),
      email_address: function(field, context, request){
        return faker.internet.email();
      }
    },
    test: 201
  }
}
```
