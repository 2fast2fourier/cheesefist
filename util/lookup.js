'use strict';

var _ = require('lodash');
var historyUtil = require('../lib/history');

module.exports = {
  history: function(key){
    return function(field, args, request){
      return historyUtil.lookup(request, args, key || field);
    };
  },
  historyAt: function(position, key){
    return function(field, args, request){
      return historyUtil.lookupAtPosition(request, args, key || field, position);
    };
  }
};
