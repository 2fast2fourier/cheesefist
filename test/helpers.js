'use strict';
//Tests helper functionality.

var _ = require('lodash');
var chai = require('chai');
var cheesefist = require('../');
var server = require('./util/server');
var filter = require('../util/filter');

var expect = chai.expect;

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

function simpleTest(request, execute){
  execute();
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


describe('Test Helper Validation', function(){

  describe('Filter function will filter the result array.', function(){
    it('should limit results to 3', function(done){
      var suite = {
        url: '/test/users',
        filter: function(result, request, res){
          return result.user_id % 2 === 0;
        }
      };
      cheesefist(server, suite, simpleTest)
      .then(function(results){
        expect(results[0]).to.be.an('array').with.length(2);
        done();
      }).otherwise(done);
    });
  });

  describe('filter.valueExists will filter out objects', function(){
    it('should limit results to 3', function(done){
      var suite = [
      {
        url: '/test/users',
        filter: filter.valueExists('fake_key')
      },
      '/test/users'];
      cheesefist(server, suite, simpleTest)
      .then(function(results){
        expect(results[0]).to.be.an('array').with.length(0);
        expect(results[1]).to.be.an('array').with.length(4);
        done();
      }).otherwise(done);
    });
  });

  describe('filter.toBoolean will filter out objects by !!value', function(){
    it('should filter results', function(done){
      var suite = [
      {
        url: '/test/users',
        filter: filter.toBoolean('admin')
      },
      '/test/users'];
      cheesefist(server, suite, simpleTest)
      .then(function(results){
        expect(results[0]).to.be.an('array').with.length(2);
        expect(results[1]).to.be.an('array').with.length(4);
        done();
      }).otherwise(done);
    });
  });

  describe('filter.limitResult will limit output', function(){
    it('should limit results to 3', function(done){
      var suite = [
      {
        url: '/test/users',
        filter: filter.limitResult(3)
      },
      '/test/users'];
      cheesefist(server, suite, simpleTest)
      .then(function(results){
        expect(results[0]).to.be.an('array').with.length(3);
        expect(results[1]).to.be.an('array').with.length(4);
        done();
      }).otherwise(done);
    });
  });
});
