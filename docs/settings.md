## Settings
### Cheesefist `options` Object
Current supported syntax:
```
var options = {
  validate: function(content, response, request, context){
    // This will execute with every request call, allowing for global validations.
    // To fail a test:
    // throw new Error(message)
    // The error instance will propegate up to the test framework.
  },
  validation: {
    testName: function(value, content, result, request, context){
      // This allows for test-object plugins.
      // See Validation Plugins below.
    }
  },
  test: {// Specify a set of default validation cases to apply to all requests
    statusCode: 201, // expect 201 as our default statusCode check instead of 200
    type: 'array' // enables the `type` check on all requests, expecting an 'array'
  }
};

cheesefist(server, testSuite, testFramework, options);
```

<a id="_global_validation"></a>
### Global Validation
An `options` object may contain a `test` object, which has the same syntax and options as the request `test` objects. If a test case is enabled here, it will apply to all requests unless otherwise overridden at the request level.

For example:
```
var options = {
  test: {
    statusCode: false, //disable default statusCode test
    type: 'array'
  }
}

var testSuite = [
  {
    url: '/users',
    followBy: {
      url: '/users/{user_id}/history',
      test: {
        statusCode: 200
      }
    }
  }
]
```
With these rules, the `/users` test case will be validated against the global tests in `options`. The `/users/{user_id}/history` request will validate against the locally-defined `statusCode: 200` test, and also validate with the globally-defined `type` test.

In addition, if `test: false` is defined for any specific request, it will skip globally-defined tests. If `options.test = false`, all default tests are disabled (such as statusCode).

<a id="_plugins"></a>
### Validation Plugins
Additional `test` functionality can be added as plugins via the `options` object. When a test plugin is added, and a request test case specifies a value for that test plugin, it will be executed during response validation.

To include a test plugin in the validation suite, add it to the `options` object when executing `cheesefist()`:
```
var options = {
  validations: {
    nameContains: function(value, content, result, request, context){
      if(content.username.indexOf(value) === -1){
        throw new Error('Name does not contain '+value);
      }
    }
  }
}

cheesefist(server, testSuite, testFn, options);
```

To use the test plugin, provide a value as part of a request `test` object.
```
var testSuite = {
  url: '/users/',
  test: {
    nameContains: 'John'
  }
}
```
Any tests that include a rule with the same name as the custom plugin will be executed, with the `value` of that rule passed into the plugin function. The plugin also has access to the full response from Hapi [`server.inject`](http://hapijs.com/api#serverinjectoptions-callback), as well as the `request` rule object and execution `history` leading up to this point.

##### Plugin Callback Arguments
- `value` is the argument bound to the `test` case that matches this plugin. In the example above this would be `'John'`.
- `content` is the content body from the [`server.inject`](http://hapijs.com/api#serverinjectoptions-callback) result object, `res.result`.
- `result` is the full response object from [`server.inject`](http://hapijs.com/api#serverinjectoptions-callback).
- `request` is the request ruleset for this specific stage in the test suite, including `test` object.
- `context` is the most recent response in the request chain, with `context.content` for accessing the content body and `context.history` for accessing earlier requests.
