'use strict';

var _ = require('lodash');
var when = require('when');
var testRunner = require('./lib/testRunner');
var prepareRequest = require('./lib/prepareRequest');

function defaultWrapper(request, execute){
  console.log(request.method+' '+request.url);
  execute(function(err){
    if(err){
      console.log('Test Failed: '+request.method+' '+request.url);
      throw err;
    }
  });
}

function prepareArgs(request){
  if(_.isArray(request.args)){
    return when.resolve(request.args);
  }else if(_.isObject(request.args)){
    return when.resolve([request.args]);
  }
  return when.resolve([{}]);
}

function startTests(server, requests, testWrapper){
  if(!_.isFunction(testWrapper)){
    testWrapper = defaultWrapper;
  }
  if(_.isArray(requests)){
    _.forEach(requests, function(request){
      testRunner(server, prepareRequest(request), prepareArgs(request), testWrapper);
    });
  }else if(_.isObject(requests) || _.isString(requests)){
    testRunner(server, prepareRequest(requests), prepareArgs(requests), testWrapper);
  }
}

module.exports = startTests;
