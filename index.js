'use strict';

var _ = require('lodash');
var when = require('when');
var nodefn = require('when/node');
var sequence = require('when/sequence');
var testRunner = require('./lib/testRunner');
var prepareRequest = require('./lib/prepareRequest');

function prepareArgs(request){
  if(_.isArray(request.args)){
    return when.resolve(request.args);
  }else if(_.isObject(request.args)){
    return when.resolve([request.args]);
  }
  return when.resolve([{}]);
}

function startTests(server, requests, testWrapper, callback){
  var tests = [];
  if(!_.isFunction(testWrapper)){
    console.log('---NOTICE: No test framework integration provided.');
    console.log('---See Quickstart in readme to for details on integrating test frameworks (Mocha, Lab, ect).');
    throw new Error('Please provide test framework wrapper.');
  }
  if(_.isArray(requests)){
    _.forEach(requests, function(request){
      tests.push(testRunner(server, prepareRequest(request), prepareArgs(request), testWrapper));
    });
  }else if(_.isObject(requests) || _.isString(requests)){
    tests.push(testRunner(server, prepareRequest(requests), prepareArgs(requests), testWrapper));
  }else{
    throw new Error('Test case invalid: '+requests);
  }
  return nodefn.bindCallback(when.all(_.flatten(tests)), callback);
}

module.exports = startTests;
