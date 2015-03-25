'use strict';

var _ = require('lodash');
var chai = require('chai');
var util = require('util');
var expect = chai.expect;

function validate(content, key, type, value){
  try{
    if(type && value !== undefined){
      expect(content).to.have.a.property(key, value).that.is.a(type);
    }else if(type){
      expect(content).to.have.a.property(key).that.is.a(type);
    }else if(value !== undefined){
      expect(content).to.have.a.property(key, value);
    }else{
      expect(content).to.have.a.property(key);
    }
  }catch(error){
    //display every validation failure, so we can track down multiple issues in a single execution
    return createError('ValidationError', error.message, util.inspect(content, {depth: 0}));
  }
}

function displayError(err){
  if(err){
    //TODO replace with chalk or something
    console.log('\x1B[31m'+err.toString()+'\x1B[0m');
    console.log('details:', err.details);
  }
}

function createError(name, message, details){
  var err = new Error(message);
  err.name = name;
  err.details = details;
  return err;
}

module.exports = function(validation, content, result, request) {
  var error;
  _.forEach(validation, function(field){
    var key, type, value;
    if(_.isString(field)){
      key = field;
    }else{
      key = field.key;
      type = field.type;
      value = field.value;
    }
    if(_.isArray(content)){
      _.forEach(content, function(result){
        var err = validate(result, key, type, value);
        //allow the rest of the validation tests to continue
        error = error || err;
        //display every validation failure, so we can track down multiple issues
        displayError(err);
      });
    }else if(_.isObject(content)){
      var err = validate(content, key, type, value);
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
};
