'use strict';

var _ = require('lodash');
var history = require('./history');

function buildUrl (url, args, request) {
  return url.replace(/\{\[?(\d*)\]?\.?(\w+)\}/g, function(match, position, key){
    if(_.has(request.override, key)){
      if(_.isFunction(request.override[key])){
        return ''+request.override[key](key, args, request);
      }else{
        return ''+request.override[key];
      }
    }
    if(position){
      return history.lookupAtPosition(request, args, key, _.parseInt(position));
    }
    return history.lookup(request, args, key);
  });
}

module.exports = buildUrl;
