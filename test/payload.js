'use strict';
//Tests payload functionality.

var chai = require('chai');
var cheesefist = require('../');
var server = require('./util/server');
var lookup = require('../util/lookup');

var expect = chai.expect;

function test(request, execute){
  it(request.method+' '+request.url, execute);
}

describe('Test Payloads', function(){
  describe('Basic POST features', function(){
    var suite = [
      {
        url: '/test/payload/post/testArg/hello',
        method: 'POST',
        payload: {
          testArg: 'hello'
        }
      },
      {//test custom payload functions
        url: '/test/payload/post/fnArg/generated',
        method: 'POST',
        payload: {
          fnArg: function(field, context, request){
            return 'generated';
          }
        }
      },
      {//test payload util functions and keyname rebinding
        url: '/test/users/1',
        followBy: {
          url: '/test/payload/post/name/Reggie',
          method: 'POST',
          payload: {
            name: lookup.history('username')
          },
          followBy: {
            url: '/test/payload/post/name/Reggie',
            method: 'POST',
            payload: {
              name: lookup.historyAt(1, 'username')
            }
          }
        }
      },
      {//test payload util automatic field name detection
        url: '/test/users/2',
        followBy: {
          url: '/test/payload/post/username/Greg',
          method: 'POST',
          payload: {
            username: lookup.history()
          },
          followBy: {
            url: '/test/payload/post/username/Greg',
            method: 'POST',
            payload: {
              username: lookup.historyAt(1)
            }
          }
        }
      },
      {//test payload generation function
        url: '/test/payload/post/full/gen',
        method: 'POST',
        payload: function(field, context, request){//returns the full payload object instead of evaluating specific fields
          return {
            full: 'gen'
          };
        }
      }
    ];

    cheesefist(server, suite, test);
  });
});
