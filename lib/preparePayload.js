'use strict';

var _ = require('lodash');

module.exports = preparePayload;

function preparePayload(request, context) {
  var resolver = _.partial(resolveField, request, context);
  return _.cloneDeep(request.payload, resolver);
}

// this is used by cloneDeep() to translate function callbacks into results, for payload field generation
function resolveField(request, context, value, fieldName){
  if(_.isFunction(value)){
    return value(fieldName, context, request);
  }
}
