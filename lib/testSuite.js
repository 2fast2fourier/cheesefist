'use strict';

var _ = require('lodash');
var chai = require('chai');
var when = require('when');
var util = require('util');
var buildUrl = require('./buildUrl');

chai.config.showDiff = false;
var expect = chai.expect;

function validate(result, key, type, value){
  try{
    if(type && value !== undefined){
      expect(result).to.have.a.property(key, value).that.is.a(type);
    }else if(type){
      expect(result).to.have.a.property(key).that.is.a(type);
    }else if(value !== undefined){
      expect(result).to.have.a.property(key, value);
    }else{
      expect(result).to.have.a.property(key);
    }
  }catch(error){
    return createError('ValidationError', error.message, util.inspect(error.actual, {depth: 0}));
  }
}

function validateFields(test, res){
  var error;
  _.forEach(test.resultFields, function(field){
    var key, type, value;
    if(_.isString(field)){
      key = field;
    }else{
      key = field.key;
      type = field.type;
      value = field.value;
    }
    if(_.isArray(res.result)){
      _.forEach(res.result, function(result){
        var err = validate(result, key, type, value);
        //allow the rest of the validation tests to continue
        error = error || err;
        //display every validation failure, so we can track down multiple issues
        displayError(err);
      });
    }else if(_.isObject(res.result)){
      var err = validate(res.result, key, type, value);
      error = error || err;
      displayError(err);
    }else{
      throw new Error('ResultsField validation specified but result is not an object');
    }
  });
  if(error){
    //use the first encountered error to fail the whole test.
    throw error;
  }
}

function resultValidation (test, result) {
  if(test.type){
    expect(result).to.be.an(test.type);
  }
  if(test.length !== undefined){
    expect(result).to.be.an('array').with.length(test.length);
  }
}

function testSuite(test, res, request, history){
  //only default to 200 if statusCode is undefined,
  //if statusCode is false or null skip the test
  var statusCode = test.statusCode === undefined ? 200 : test.statusCode;
  if(statusCode && statusCode !== res.statusCode){
    throw createError('StatusCodeError', 'Result is '+res.statusCode+', Expected '+statusCode);
  }
  resultValidation(test, res.result);
  if(test.resultFields){
    validateFields(test, res);
  }
  if(_.isFunction(test.validate)){
    expect(test.validate(res, request, history)).to.equal(true);
  }
}

function createError(name, message, details){
  var err = new Error(message);
  err.name = name;
  err.details = details;
  return err;
}

function displayError(err){
  if(err){
    //TODO replace with chalk or something
    console.log('\x1B[31m'+err.toString()+'\x1B[0m');
    /* istanbul ignore else */
    if(err.details){
      console.log('details:', err.details);
    }
  }
}

module.exports = testSuite;
