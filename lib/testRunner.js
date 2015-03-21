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


function createHistory(results, previous){
  var finalResult = _.cloneDeep(results);
  var data = {
    _history: [],
    _override: previous._override || {}
  };
  if(_.isArray(previous._history)){
    data._history = _.cloneDeep(previous._history);
    data._history.push(_.omit(previous, '_history', '_override'));
  }else if(_.isObject(previous)){
    data._history = [_.omit(previous, '_history', '_override')];
  }
  if(_.isArray(finalResult)){
    _.forEach(finalResult, function(result){
      _.assign(result, data);
    });
  }else if(_.isObject(finalResult)){
    _.assign(finalResult, data);
  }else{
    finalResult = data;
  }
  return finalResult;
}

function runTest(server, request, history){
  return when.promise(function(resolve, reject){
    var url = buildUrl(request.url, history, request);
    var options = _.assign(
      {
        url: url,
        method: request.method
      },
      _.pick(request, ['headers', 'credentials'])
    );
    if(request.payload){
      options.payload = preparePayload(request, history);
    }
    server.inject(options, function(res){
      try{
        if(_.isObject(request.test)){
          testSuite(request.test, res);
        }
        resolve(createHistory(res.result, history));
      }catch(error){
        console.log('\x1B[31m'+error.toString()+'\x1B[0m');
        console.log('url:', url, res.statusCode);
        if(error.details){
          console.log('details:', error.details);
        }
        error.url = url;
        error.method = request.method;
        reject(error);
      }
    });
  });
}

function test(historyPromise, executor, resolve, reject, callback) {
  var promise = when.map(historyPromise, executor)
    .tap(function(results){
      resolve(results);
    })
    .otherwise(function(err){
      reject(err);
      return when.reject(err);
    });
  return nodefn.bindCallback(promise, callback);
}

function testRunner(server, request, historyPromise, testWrapper){
  var tests = [];
  
  var results = when.promise(function(resolve, reject){
    testWrapper(request, _.partial(test, historyPromise, _.partial(runTest, server, request), resolve, reject));
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
      tests.push(testRunner(server, prepareRequest(request), results, testWrapper));
    });
  }else if(_.isObject(request.followBy) || _.isString(request.followBy)){
    tests.push(testRunner(server, prepareRequest(request.followBy), results, testWrapper));
  }
  return _.flatten(tests);
}

module.exports = testRunner;
