'use strict';

var _ = require('lodash');
var when = require('when');
var nodefn = require('when/node');
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
    return when.resolve(_.map(request.args, function(args){
      return {
        content: args,
        history: [{content: args}]
      }
    }));
  }else{
    return when.resolve([{
      content: request.args,
      history: [{content: request.args}]
    }]);
  }
}

function prepareOptions(options){
  options.validation = _.assign({}, validationSuite, options.validation);
  if(options.test === undefined){
    options.test = {
      statusCode: 200
    }
  }
}

function startTests(server, requests, options){
  var tests = [];

  if(_.isArray(requests)){
    _.forEach(requests, function(request){
      tests.push(testRunner(server, prepareRequest(request, options), prepareArgs(request), options));
    });
  }else if(_.isObject(requests) || _.isString(requests)){
    tests.push(testRunner(server, prepareRequest(requests, options), prepareArgs(requests), options));
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

  if(_.isFunction(options)){
    callback = options;
    options = {};
  }else if(_.isObject(options)){
    options = _.cloneDeep(options);
  }else{
    options = {};
  }
  options.testWrapper = testWrapper;
  prepareOptions(options);

  sanityCheck(requests, options);

  var results = startTests(server, requests, options);

  return nodefn.bindCallback(results, callback);
}

module.exports = cheesefist;
