'use strict';
//Tests payload functionality.

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

server.route([
{
  method: 'POST',
  path: '/test/payload/post',
  handler: function(request, reply){
    expect(request.payload).to.exist.and.to.have.property('testArg', 'hello');
    reply(request.payload);
  }
},
{
  method: 'POST',
  path: '/test/payload/post/generated',
  handler: function(request, reply){
    expect(request.payload).to.exist.and.to.have.property('testArg', 'world');
    reply(request.payload);
  }
},
{
  method: 'GET',
  path: '/test/info',
  handler: function(request, reply){
    reply({
      info_id: 1,
      name: 'stuff'
    });
  }
},
{
  method: 'POST',
  path: '/test/info/{info_id}/generated',
  handler: function(request, reply){
    expect(request.payload).to.exist.and.to.have.property('testArg', 'stuff');
    reply(request.payload);
  }
},
{
  method: 'POST',
  path: '/test/info/{info_id}/lookup',
  handler: function(request, reply){
    expect(request.payload).to.exist.and.to.have.property('name', 'stuff');
    reply(request.payload);
  }
}
]);

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

describe('Test Payloads', function(){
  describe('Basic POST', function(done){
    var suite = [{
      url: '/test/payload/post',
      method: 'POST',
      payload: {
        testArg: 'hello'
      }
    },{//test custom payload functions
      url: '/test/payload/post/generated',
      method: 'POST',
      payload: {
        testArg: function(field, history, request){
          return 'world';
        }
      }
    },{//test payload util functions and keyname rebinding
      url: '/test/info',
      followBy: {
        url: '/test/info/{info_id}/generated',
        method: 'POST',
        payload: {
          testArg: payloadUtil.history('name')
        },
        followBy: {
          url: '/test/info/{info_id}/generated',
          method: 'POST',
          payload: {
            testArg: payloadUtil.historyAt(1, 'name')
          }
        }
      }
    },{//test payload util atomatic field name detection
      url: '/test/info',
      followBy: {
        url: '/test/info/{info_id}/lookup',
        method: 'POST',
        payload: {
          name: payloadUtil.history()
        },
        followBy: {
          url: '/test/info/{[1].info_id}/lookup',
          method: 'POST',
          payload: {
            name: payloadUtil.historyAt(1)
          }
        }
      }
    }];


    cheesefist(server, suite, test);
  });
});
