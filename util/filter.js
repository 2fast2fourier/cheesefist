'use strict';

var _ = require('lodash');
var historyUtil = require('../lib/history');

module.exports = {
  valueExists: function(key){
    return function(result, request, res){
      return _.has(result, key);
    };
  },
  toBoolean: function(key){
    return function(result, request, res){
      return _.has(result, key) && !!result[key];
    };
  }
};
