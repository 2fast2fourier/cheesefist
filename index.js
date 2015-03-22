'use strict';

var _ = require('lodash');
var when = require('when');
var nodefn = require('when/node');
var sequence = require('when/sequence');
var testRunner = require('./lib/testRunner');
var prepareRequest = require('./lib/prepareRequest');
var validationSuite = require('require-dir')('./validation');

function sanityCheck(requests, options){
  if(!_.every(options.validation, _.isFunction)){
    throw new Error('Invalid validation test included in options');
  }
  //TODO iterate through requests, throw on obviously invalid things
}

function prepareArgs(request){
  if(_.isArray(request.args)){
    return when.resolve(request.args);
  }else if(_.isObject(request.args)){
    return when.resolve([request.args]);
  }
  return when.resolve([{}]);
}

function startTests(server, requests, options){
  var tests = [];

  if(_.isArray(requests)){
    _.forEach(requests, function(request){
      tests.push(testRunner(server, prepareRequest(request), prepareArgs(request), options));
    });
  }else if(_.isObject(requests) || _.isString(requests)){
    tests.push(testRunner(server, prepareRequest(requests), prepareArgs(requests), options));
  }else{
    throw new Error('Test case invalid: '+requests);
  }

  return when.all(_.flatten(tests));
}

function cheesefist(server, requests, testWrapper, options, callback){
  if(!_.isFunction(testWrapper)){
    console.log('---NOTICE: No test framework integration provided.');
    console.log('---See Quickstart in readme to for details on integrating test frameworks (Mocha, Lab, ect).');
    throw new Error('Please provide test framework wrapper.');
  }

  options = options || {};
  if(_.isFunction(options)){
    callback = options;
    options = {};
  }
  options.testWrapper = testWrapper;
  options.validation = _.assign({}, validationSuite, options.validation);

  sanityCheck(requests, options);

  var results = startTests(server, requests, options);

  return nodefn.bindCallback(results, callback);
}

module.exports = cheesefist;
