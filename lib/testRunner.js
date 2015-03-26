'use strict';

var _ = require('lodash');
var chai = require('chai');
var when = require('when');
var util = require('util');
var nodefn = require('when/node');
var buildUrl = require('./buildUrl');
var testSuite = require('./testSuite');
var preparePayload = require('./preparePayload');
var prepareRequest = require('./prepareRequest');

chai.config.showDiff = false;
var expect = chai.expect;

function generateResult(content, previous, res, requestValues, body){
  var history = _.clone(previous.history);
  var result = {
    content: content,
    body: body,
    statusCode: res.statusCode,
    request: requestValues
  };
  history.push(_.clone(result));
  result.history = history;
  return result;
}

function createContext(res, previous, generatedRequest){
  var requestVal = _.cloneDeep(generatedRequest);
  var content = _.cloneDeep(res.result);
  if(_.isArray(content)){
    return _.map(content, function(item){
      return generateResult(item, previous, res, requestVal, content);
    });
  }else {
    return [generateResult(content, previous, res, requestVal, content)];
  }
}

function filterResults(context, filter, request, res) {
  if(_.isFunction(filter)){
    return _.filter(context, function(result){
      return filter(result.content, request, res);
    });
  }else{
    return context;
  }
}

function runTest(server, request, options, context){
  var errUrl = request.url;
  var inject = {
    method: request.method
  };
  return when.try(buildUrl, request.url, context, request)
    .then(function(url){
      errUrl = url;
      inject.url = url;
      if(request.payload){
        inject.payload = preparePayload(request, context);
      }
      _.assign(inject,
        _.pick(request, ['headers', 'credentials'])
      );
      return when.promise(function(resolve, reject){
        //when/callback.call doesn't seem to work for server.inject
        server.inject(inject, resolve);
      });
    })
    .then(function(res){
      if(_.isObject(request.test)){
        testSuite(res, request, context, options);
      }
      return filterResults(createContext(res, context, inject), request.filter, request, res);
    })
    .otherwise(function(error){
      console.log('\x1B[31m'+error.toString()+'\x1B[0m');
      console.log('url:', errUrl);
      if(error.details){
        console.log('details:', error.details);
      }
      error.url = errUrl;
      error.method = request.method;
      return when.reject(error);
    });
}

function test(contextPromise, executor, resolve, reject, callback) {
  var promise = when.map(contextPromise, executor)
    .tap(function(results){
      resolve(results);
    })
    .otherwise(function(err){
      reject(err);
      return when.reject(err);
    });
  return nodefn.bindCallback(promise, callback);
}

function testRunner(server, request, contextPromise, options){
  var tests = [];
  
  var results = when.promise(function(resolve, reject){
    options.testWrapper(request, _.partial(test, contextPromise, _.partial(runTest, server, request, options), resolve, reject));
  })
  .then(_.flatten)
  .otherwise(function(err){
    //if we have children tests, pass failure state to them so they can short-circuit
    var parentError = new Error('Parent test failed: '+err.method+' '+err.url);
    parentError.url = err.url;
    parentError.method = err.method;
    return when.reject(parentError);
  });

  tests.push(results);

  if(_.isArray(request.followBy)){
    _.forEach(request.followBy, function(request){
      tests.push(testRunner(server, prepareRequest(request, options), results, options));
    });
  }else if(_.isObject(request.followBy) || _.isString(request.followBy)){
    tests.push(testRunner(server, prepareRequest(request.followBy, options), results, options));
  }
  return _.flatten(tests);
}

module.exports = testRunner;
