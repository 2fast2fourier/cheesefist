'use strict';

var _ = require('lodash');
var historyUtil = require('../lib/history');

module.exports = {
  history: function(key){
    return function(field, history, request){
      return historyUtil.lookup(request, history, key || field);
    };
  },
  historyAt: function(position, key){
    return function(field, history, request){
      return historyUtil.lookupAtPosition(request, history, key || field, position);
    };
  }
};
