'use strict';

var _ = require('lodash');
var history = require('./history');

function buildUrl (url, context, request) {
  return url.replace(/\{\[?(\d*)\]?\.?(\w+)\}/g, function(match, position, key){
    if(_.has(request.override, key)){
      if(_.isFunction(request.override[key])){
        return ''+request.override[key](key, context, request);
      }else{
        return ''+request.override[key];
      }
    }
    if(position){
      return history.lookupAtPosition(request, context, key, _.parseInt(position));
    }
    return history.lookup(request, context, key);
  });
}

module.exports = buildUrl;
