'use strict';

var _ = require('lodash');
var history = require('./history');

function buildUrl (url, args, request) {
  args = args || {};
  return url.replace(/\{\[?(\d*)\]?\.?(\w+)\}/g, function(match, position, key){
    if(position){
      return history.lookupAtPosition(request, args, key, _.parseInt(position));
    }
    return history.lookup(request, args, key);
  });
}

module.exports = buildUrl;
