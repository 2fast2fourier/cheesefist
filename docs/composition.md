<a id="_urlcomposition"></a>
## URL Composition
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
