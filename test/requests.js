'use strict';
//Tests request functionality.

var _ = require('lodash');
var chai = require('chai');
var Hapi = require('hapi');
var cheesefist = require('../');
var server = require('./util/server');

var expect = chai.expect;

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

describe('Test Request Syntax', function(){

  describe('Default Request', function(){
    var suite = '/test/users';
    cheesefist(server, suite, test);
  });

  describe('StatusCode Test Shortcut', function(){
    var suite = {
      url: '/test/bad',
      test: 404
    };
    cheesefist(server, suite, test);
  });

  describe('Non-Object Responses', function(){
    var suite = {
      url: '/test/return/string'
    };
    cheesefist(server, suite, test);
  });

  describe('FollowBy Array', function(){
    var suite = {
      url: '/test/users',
      followBy: [{
          url: '/test/users/{user_id}'
        },{
          url: '/test/users/{user_id}/history'
        }
      ]
    };
    cheesefist(server, suite, test);
  });

  describe('Args Array', function(){
    var suite = {
      url: '/test/users/{user_id}',
      args: [{
        user_id: 1
      },{
        user_id: 2
      }]
    };
    cheesefist(server, suite, test);
  });

  describe('Overall Promise', function(){
    var passthrough = function(request, execute){
      execute(function(err, res){});
    };
    it('Promise resolves when all tests are successful', function(done){
      var suite = [
        '/test/users',
        '/test/history'
      ];
      cheesefist(server, suite, passthrough)
        .then(function(){
          //don't pass values through, mocha would fail the test.
          done();
        })
        .otherwise(done);
    });

    it('Promise rejected on failed run', function(done){
      var suite = '/test/bad';
      cheesefist(server, suite, passthrough)
      .done(function(res){
        done(new Error('Test suite finished without intended error'));
      },
      function(err){
        done();
      });
    });
  });

  describe('Missing Test Runner', function(){
    it('Throw if test runner is not provided', function(done){
      try{
        cheesefist(server, '/test/users');
      }catch(err){
        expect(err).to.exist;
        done();
      }
    });
  });

  describe('Invalid test case', function(){
    it('Throw if test case is invalid', function(done){
      try{
        cheesefist(server, 1, test);
      }catch(err){
        expect(err).to.exist;
        done();
      }
    });
  });

});
