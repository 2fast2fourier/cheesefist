'use strict';

var _ = require('lodash');

//set defaults for requests.
function prepareRequest(request){
  if(_.isString(request)){
    var requestPath = request;
    //path only, use defaults for everything.
    request = {
      method: 'GET',
      path: requestPath,
      test: {
        statusCode: 200
      }
    };
  }
  if(!request.method){
    request.method = 'GET';
  }
  //if request.test is a number, use to validate statusCode.
  //if request.test is false or null, skip all tests.
  //if request.test is undefined, just check for code 200.
  if(_.isNumber(request.test)){
    request.test = {
      statusCode: request.test
    };
  }else if(request.test === undefined){
    request.test = {
      statusCode: 200
    };
  }
  return request;
}

module.exports = prepareRequest;
