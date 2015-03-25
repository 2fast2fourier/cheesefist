'use strict';
//Tests history functionality.

var _ = require('lodash');
var chai = require('chai');
var Hapi = require('hapi');
var cheesefist = require('../');
var server = require('./util/server');
var lookup = require('../util/lookup');

var expect = chai.expect;

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

describe('Test History Lookup', function(){

  describe('Automatic History Lookup', function(){
    var suite = {
      url: '/test/users',
      followBy: {
        url: '/test/users/{user_id}',
        test: {
          resultFields: ['user_id', 'username']
        },
        followBy: {
          url: '/test/users/{user_id}/history',
          test: {
            resultFields: ['history_id', 'user_id']
          },
          followBy: {
            url: '/test/users/{user_id}/history/{history_id}',
            test: {
              resultFields: ['history_id', 'name']
            },
            followBy: {
              url: '/test/users/{user_id}/history/{[4].history_id}',
              test: {
                resultFields: ['history_id', 'name']
              }
            }
          }
        }
      }
    };
    cheesefist(server, suite, test);
  });

  describe('Override history lookup', function(){
    var suite = {
      url: '/test/history/2',
      followBy: {
        url: '/test/history/{history_id}',
        override: {
          history_id: 1
        },
        test: {
          resultFields: ['history_id', 'name']
        }
      }
    };
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err, results){
          if(request.override){
            expect(results[0][0].content).to.exist.and.have.property('history_id', 1);
          }else{
            expect(results[0][0].content).to.exist.and.have.property('history_id', 2);
          }
          done();
        });
      });
    });
  });

  describe('Override history lookup with callback function', function(){
    var suite = {
      url: '/test/return/id/4',
      followBy: {
        url: '/test/users/{user_id}',
        override: {
          user_id: lookup.history('id')
        },
        test: {
          resultFields: ['user_id', 'username']
        }
      }
    };
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err, result){
          expect(err).to.not.exist;
          if(request.override){
            expect(result[0][0].content).to.exist.and.have.property('user_id', 4);
          }else{
            expect(result[0][0].content).to.exist.and.have.property('id', 4);
            expect(result[0][0].content).to.not.have.property('user_id');
          }
          done();
        });
      });
    });
  });

  describe('Missing key reference', function(){
    var suite = {
      url: '/test/history/{hickory_id}'
    };
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err){
          expect(err).to.exist;
          expect(err.message).to.contain('MISSING KEY REFERENCE');
          expect(err.message).to.contain('hickory_id');
          expect(err.message).to.contain(request.url);
          done();
        });
      });
    }).otherwise(function(err){
      //the cheesefist call itself will reject for missing/invalid key references
      expect(err).to.exist;
    });
  });

  describe('Missing key reference at position', function(){
    var suite = [{
      url: '/test/history',
      args: {
        history_id: 1
      },
      followBy: {
        url: '/test/history/{[0].hickory_id}'
      }
    }];
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        if(request.url === '/test/history'){
          execute(done);
          return;
        }
        execute(function(err){
          expect(err).to.exist;
          expect(err.message).to.contain('MISSING KEY REFERENCE');
          expect(err.message).to.contain('hickory_id');
          expect(err.message).to.contain(request.url);
          done();
        });
      });
    }).otherwise(function(err){
      //the cheesefist call itself will reject for missing/invalid key references
      expect(err).to.exist;
    });
  });


  describe('Invalid history reference', function(){
    var suite = [{
      url: '/test/history/{[1].hickory_id}'
    }];
    cheesefist(server, suite, function(request, execute){
      it(request.method+' '+request.url, function(done){
        execute(function(err){
          expect(err).to.exist;
          expect(err.message).to.contain('INVALID HISTORY REFERENCE');
          expect(err.message).to.contain('hickory_id');
          expect(err.message).to.contain(request.url);
          done();
        });
      });
    }).otherwise(function(err){
      //the cheesefist call itself will reject for missing/invalid key references
      expect(err).to.exist;
    });
  });

});
