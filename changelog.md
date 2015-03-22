## Changelog
### 0.1.0
Initial release, all breaking changes from this point on are listed below.

### 0.2.0 (in progress)
##### Breaking
- `test.validate` custom test function arguments changed to `(content, response, request, history)`. This simplifies the process to access response content, instead of needing to reference `response.result`. This also exposes request chain `history`.
- `test.validate` can no longer return `true`/`false`. Use  `throw new Error(message)` to fail the test instead. This is for clarity, a thrown error will propegate an error message while `true`/`false` cannot.

##### New Functionality
- The main `cheesefist()` method now returns a promise or accepts an optional callback. The promise/callback resolve based on the results of the full test run, if any test fails error state is the first thrown `Error`. The promise/callback can be safely ignored.
- An optional `options` argument can be passed into the main `cheesefist()` method as the 4th argument. The currently supported options are defined in `docs/settings.md`.
- The `options` object can have additional test plugins defined. See *Validation Plugins* in `docs/settings.md`.
