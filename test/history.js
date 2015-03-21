'use strict';
//Tests history functionality.

var _ = require('lodash');
var chai = require('chai');
var Hapi = require('hapi');
var cheesefist = require('../');
var payloadUtil = require('../util/payload');

var expect = chai.expect;

var server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 9876
});

var histValues = [
  { history_id: 1, name: 'foo' },
  { history_id: 2, name: 'bar' },
  { history_id: 3, name: 'baz' },
  { history_id: 4, name: 'gaz' }
];

var userHistoryValues = [
  { history_id: 1, user_id: 1 },
  { history_id: 2, user_id: 2 },
  { history_id: 3, user_id: 3 },
  { history_id: 4, user_id: 4 }
];

var userValues = [
  { user_id: 1, username: 'Reggie' },
  { user_id: 2, username: 'Greg' },
  { user_id: 3, username: 'Bob' },
  { user_id: 4, username: 'Mr. Name' }
];

server.route([
{
  method: 'GET',
  path: '/test/history',
  handler: function(request, reply){
    reply(histValues);
  }
},
{
  method: 'GET',
  path: '/test/history/{history_id}',
  handler: function(request, reply){
    var id = _.parseInt(request.params.history_id);
    expect(id).to.be.a('number').within(1, 4);
    reply(histValues[id-1]);
  }
},
{
  method: 'GET',
  path: '/test/users',
  handler: function(request, reply){
    reply(userValues);
  }
},
{
  method: 'GET',
  path: '/test/users/{user_id}',
  handler: function(request, reply){
    var id = _.parseInt(request.params.user_id);
    expect(id).to.be.a('number').within(1, 4);
    reply(userValues[id-1]);
  }
},
{
  method: 'GET',
  path: '/test/users/{user_id}/history',
  handler: function(request, reply){
    reply(userHistoryValues);
  }
},
{
  method: 'GET',
  path: '/test/users/{user_id}/history/{history_id}',
  handler: function(request, reply){
    var userId = _.parseInt(request.params.user_id);
    var historyId = _.parseInt(request.params.history_id);
    expect(userId).to.be.a('number').within(1, 4);
    expect(historyId).to.be.a('number').within(1, 4);
    reply(histValues[userHistoryValues[userId-1].history_id-1]);
  }
}
]);

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
              url: '/test/users/{user_id}/history/{history_id}',
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

  describe('Override History Lookup', function(){
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
        execute(function(err, result){
          if(request.override){
            expect(result[0]).to.exist.and.have.property('history_id', 1);
          }else{
            expect(result[0]).to.exist.and.have.property('history_id', 2);
          }
          done();
        });
      });
    });
  });

  describe('Missing Key Reference', function(){
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

  describe('Missing Key Reference At Position', function(){
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


  describe('Invalid History Reference', function(){
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
