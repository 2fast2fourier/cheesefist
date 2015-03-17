'use strict';

var _ = require('lodash');
var when = require('when');
var testRunner = require('./lib/testRunner');
var prepareRequest = require('./lib/prepareRequest');

function defaultWrapper(request, execute){
  console.log(request.method+' '+request.url);
  return execute();
}

function startTests(server, requests, testWrapper){
  if(!_.isFunction(testWrapper)){
    testWrapper = defaultWrapper;
  }
  if(_.isArray(requests)){
    _.forEach(requests, function(request){
      testRunner(server, prepareRequest(request), when.resolve(request.args), testWrapper);
    });
  }else if(_.isObject(requests)){
    testRunner(server, prepareRequest(requests), when.resolve(requests.args), testWrapper);
  }
}

module.exports = startTests;
