'use strict';
//Tests validation functionality.

var _ = require('lodash');
var chai = require('chai');
var cheesefist = require('../');
var server = require('./util/server');

var expect = chai.expect;

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

function testShouldFail(request, execute){
  it(request.method+' '+request.url, function(done){
    execute(function(err){
      expect(err).to.exist;
      done();
    });
  });
}

function shouldExist(value){
  expect(value).to.exist;
}

function shouldNotExist(value){
  expect(value).to.not.exist;
}

describe('Test Result Validation', function(){

  describe('Default test validation', function(){
    var suite = '/test/users';
    cheesefist(server, suite, test);
  });

  describe('Default validation fails on non-200 response', function(){
    var suite = '/test/404';
    cheesefist(server, suite, testShouldFail)
      .done(shouldNotExist, shouldExist);
      //cheesefist promise will reject if any tests fail.
  });

  describe('Test validation can be skipped altogether', function(){
    var suite = [{
      url: '/test/bad',
      test: false
    },{
      url: '/test/bad',
      test: null
    }];
    cheesefist(server, suite, test);
  });

  describe('StatusCode test shortcut', function(){
    var suite = {
      url: '/test/bad',
      test: 404
    };
    cheesefist(server, suite, test);
  });

  describe('StatusCode shortcut fails on invalid response', function(){
    var suite = {
      url: '/test/users',
      test: 404
    };
    cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
  });

  describe('Result type validation should succeed normally', function(){
    var suite = {
      url: '/test/users',
      test: {
        type: 'array'
      }
    };
    cheesefist(server, suite, test);
  });

  describe('Result type validation should fail if type does not match', function(){
    var suite = {
      url: '/test/users',
      test: {
        type: 'object'
      }
    };
    cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
  });

  describe('Result array length validation should succeed normally', function(){
    var suite = {
      url: '/test/users',
      test: {
        type: 'array',
        length: 4
      }
    };
    cheesefist(server, suite, test);
  });

  describe('Result array length validation should fail if length does not match', function(){
    var suite = {
      url: '/test/users',
      test: {
        type: 'array',
        length: 99
      }
    };
    cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
  });

  describe('Manual validation function will be called', function(){
    var validateTriggered = false;
    var suite = {
      url: '/test/users',
      test: {
        validate: function(content, result, request, history){
          expect(content).to.be.an('array');
          expect(result).to.be.an('object');
          expect(request).to.be.an('object');
          expect(history).to.be.an('object');
          validateTriggered = true;
          return true;
        }
      }
    };
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err){
          expect(err).to.not.exist;
          expect(validateTriggered).to.equal(true);
          done();
        });
      });
    });
  });

  describe('Manual validation function can fail a test', function(){
    var validateTriggered = false;
    var suite = {
      url: '/test/users',
      test: {
        validate: function(content, result, request, history){
          expect(content).to.be.an('array');
          expect(result).to.be.an('object');
          expect(request).to.be.an('object');
          expect(history).to.be.an('object');
          validateTriggered = true;
          throw new Error('Intentionally throw in validate function!');
        }
      }
    };
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err){
          expect(err).to.exist;
          expect(validateTriggered).to.equal(true);
          done();
        });
      });
    }).done(shouldNotExist, shouldExist);
    //cheesefist promise will reject if any tests fail.
  });

  describe('Result validation', function(){
    describe('should succeed normally', function(){
      var suite = {
        url: '/test/users',
        test: {
          resultFields: ['user_id', 'username']
        },
        followBy:{
          url: '/test/users/{user_id}',
          test: {
            resultFields: ['user_id', 'username']
          }
        }
      };
      cheesefist(server, suite, test);
    });

    describe('should succeed if fields are not specified in resultFields', function(){
      var suite = {
        url: '/test/users',
        test: {
          resultFields: ['user_id']
        }
      };
      cheesefist(server, suite, test);
    });

    describe('should fail if result is not an object or array', function(){
      var suite = {
        url: '/test/return/string',
        test: {
          resultFields: ['user_id', 'username', 'invalid']
        }
      };
      cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
    });

    describe('should fail if fields are missing', function(){
      var suite = {
        url: '/test/users',
        test: {
          resultFields: ['user_id', 'username', 'invalid']
        }
      };
      cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
    });

    describe('should fail if fields are of the wrong type', function(){
      var suite = {
        url: '/test/users',
        test: {
          //note: object notation is not ideal,
          //resultFields validation will likely change in the near future
          resultFields: [{key:'user_id', type: 'string'}, 'username']
        }
      };
      cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
    });

    describe('should fail if fields are of the wrong value', function(){
      var suite = {
        url: '/test/users',
        test: {
          //note: object notation is not ideal,
          //resultFields validation will likely change in the near future
          resultFields: [{key:'user_id', value: 9999}, 'username']
        }
      };
      cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
    });

    describe('should fail if fields are of the wrong type and value', function(){
      var suite = {
        url: '/test/users',
        test: {
          //note: object notation is not ideal,
          //resultFields validation will likely change in the near future
          resultFields: [{key:'user_id', type: 'string', value: 9999}, 'username']
        }
      };
      cheesefist(server, suite, testShouldFail).done(shouldNotExist, shouldExist);
    });

  });


});
