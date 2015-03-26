'use strict';

var _ = require('lodash');
var historyUtil = require('../lib/history');

module.exports = {
  history: function(key){
    return function(field, context, request){
      return historyUtil.lookup(request, context, key || field);
    };
  },
  historyAt: function(position, key){
    return function(field, context, request){
      return historyUtil.lookupAtPosition(request, context, key || field, position);
    };
  }
};
