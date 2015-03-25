'use strict';

var _ = require('lodash');
var chai = require('chai');
var when = require('when');
var buildUrl = require('./buildUrl');

chai.config.showDiff = false;
var expect = chai.expect;


function validation(request, res, options, history) {
  if(_.isFunction(request.test.validate)){
    request.test.validate(res.result, res, request, history);
  }
  if(_.isFunction(options.validate)){
    options.validate(res.result, res, request, history);
  }
  _.forEach(options.validation, function(validation, name){
    if(_.has(request.test, name)){
      validation(request.test[name], res.result, res, request, history);
    }
  });
}

function testSuite(res, request, history, options){
  //only default to 200 if statusCode is undefined,
  //if statusCode is false or null skip the test
  var statusCode = request.test.statusCode === undefined ? 200 : request.test.statusCode;
  if(statusCode && statusCode !== res.statusCode){
    var err = new Error('Result is '+res.statusCode+', Expected '+statusCode);
    err.name = 'StatusCodeError';
    if(res.statusCode >= 400){
      err.details = res.result;
    }
    throw err;
  }
  validation(request, res, options, history);
}

module.exports = testSuite;
