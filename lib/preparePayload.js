'use strict';

var _ = require('lodash');

module.exports = preparePayload;

function preparePayload(request, history) {
  var resolver = _.partial(resolveField, request, history);
  var payload = _.cloneDeep(request.payload, resolver);
  return payload;
}

function resolveField(request, history, value, field, collection){
  if(_.isFunction(value)){
    return value(field, history, request);
  }
}
