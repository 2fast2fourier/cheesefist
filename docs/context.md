## Request Context
A context object contains the result state of each request in the current chain. This object is useful if you need to write custom validation plugins or payload generation functions.

In any custom callback includes a `context` object, the `context` will either be the result state of the parent request (in payload/override generation), or the result state of the current request (in a validation plugin).

### Context Structure
```
{
  content: ..., //content for this specific object.
  body: ..., //full content body for this result set
  statusCode: 200,
  request: {

  },
  history: [ //see History Structure below ]
}
```
Each context object has the following fields:
- `content`: The content body object to be used. If a given request returns an array of objects that array will be split into multiple contexts, with each object becoming `content` in each `context`.
- `body`: The full result body from the request, in case you need to access sibling objects from the result.
- `statusCode`: The resulting statusCode from this request.
- `request`: The exact values generated for this test case, including `url`, `payload`, and/or `headers`. This contains the actual generated values for this request, the generic URL `/users/{user_id}` will become `/users/4` and is stored here.
- `history`: The request history for this chain, an array of `context` values for each parent test. See below for more detail.

### History Structure
```
{
  content: ...,
  body: ...,
  statusCode: 200,
  request: { ... },
  history: [
    { // args context
      content: { // url placeholder: {[0].keyname}
        // args values appear here
        // if args is not provided, this will be an empty object
        // so history[0] will always be the args position and maintain a stable order
      }
    },
    { // first request results context, url placeholder: {[1].keyname}
      content: { //results from root test },
      body: ...,
      statusCode: 200,
      request: { ... },
    },
    { // followBy results context, url placeholder: {[2].keyname}
      content: { //results from first followBy test },
      body: ...,
      statusCode: 200,
      request: { ... },
    },
    ...
  ]
}
```
