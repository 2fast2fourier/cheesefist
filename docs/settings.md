## Settings
### Cheesefist `options` Object
Currently supported syntax:
```
{
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
  }
}
```

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
- `context` is the most recent response in the request chain, with `context.content` for accessing the data and `context.history` for accessing earlier requests.
