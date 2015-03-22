'use strict';
//Tests validation functionality.

var _ = require('lodash');
var chai = require('chai');
var Hapi = require('hapi');

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
},
{
  method: 'GET',
  path: '/test/return/string',
  handler: function(request, reply){
    reply('Test String');
  }
},
{
  method: 'GET',
  path: '/test/return/id',
  handler: function(request, reply){
    reply({id: 1});
  }
},
{
  method: 'GET',
  path: '/test/return/id/{number}',
  handler: function(request, reply){
    reply({id: _.parseInt(request.params.number)});
  }
}
]);

module.exports = server;
