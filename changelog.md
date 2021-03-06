## Changelog

### 0.2.0
##### Breaking
- `test.validate` custom test function arguments changed to `(content, response, request, context)`. This simplifies the process to access response content, instead of needing to reference `response.result`. This also exposes request chain `context` that includes `context.history` for accessing parent results.
- `test.validate` can no longer return `true`/`false`. Use  `throw new Error(message)` to fail the test instead. This is for clarity, a thrown error will propagate an error message while `true`/`false` cannot.
- Refactor `history` objects to simplify lookup and preserve more request values (url, payload, ect). Does not affect external functionality, but any custom functions that rely on manual history manipulation may need to change. Util `lookup` functions continue to work as expected.
- Rename `history` to [`context`](docs/context.md) in function callbacks and internal code, as the history array is actually in [`context.history`](docs/context.md#_history) and the context object contains other fields now. This won't affect most test cases, but any custom callbacks depending on the internal structure of history objects will need to be updated. The [`context`](docs/context.md) structure should be considered stable at this point.

##### New Functionality
- The main `cheesefist()` method now returns a promise or accepts an optional callback. The promise/callback resolve based on the results of the full test run, if any test fails error state is the first thrown `Error`. The promise/callback can be safely ignored.
- An optional `options` argument can be passed into the main `cheesefist()` method as the 4th argument. The currently supported options are defined in [*Global Options*](docs/settings.md).
- With the above changes, the full method signature is: `cheesefist(server, testSuite, testFramework, options, callback)`. `options` and `callback` are optional. Including `callback` disables promise functionality.
- The `options` object can have additional test plugins defined. See [*Validation Plugins*](docs/settings.md#_plugins).
- Fields in `payload` and `override` can be generated by using a generate function `function(fieldName, context, request)` for the field value. The function will execute at runtime, the return value will replace the function. Util functions for history lookup are provided in `util/lookup`. The full `payload` can be generated as well.
- The `options` object can have a `test` object with validation rules, they enable global testing for each rule. Validations defined in `request.test` override global values. `request.test = false` will still disable all tests on that request and `options.test = false` will disable all default validations. See [*Global Validation*](docs/settings.md#_global_validation).
