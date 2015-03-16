'use strict';

var _ = require('lodash');
var chai = require('chai');
var when = require('when');
var util = require('util');
var buildUrl = require('./buildUrl');
var testSuite = require('./testSuite');

chai.config.showDiff = false;
var expect = chai.expect;


function createHistory(results, previous){
  var finalResult = _.cloneDeep(results);
  var history;
  if(_.isArray(previous._history)){
    history = _.cloneDeep(previous._history);
    history.push(_.omit(previous, '_history'));
  }else if(_.isObject(previous)){
    history = [_.omit(previous, '_history')];
  }else{
    history = [];
  }
  if(_.isArray(finalResult)){
    _.forEach(finalResult, function(result){
      result._history = history;
    });
  }else if(_.isObject(finalResult)){
    finalResult._history = history;
  }else{
    finalResult = {_history: history};
  }
  return finalResult;
}

function runTest(phoenix, request, previous){
  return when.promise(function(resolve, reject, notify){
    var url =buildUrl(request.url, previous);
    var options = _.assign(
      {
        url: url,
        method: request.method || 'GET'
      },
      _.pick(request, ['payload', 'query', 'headers'])
    );
    phoenix.inject(options, function(res){
      try{
        if(_.isObject(request.test)){
          testSuite(request.test, res);
        }else if(_.isNumber(request.test)){
          testSuite({statusCode: request.test}, res);
        }
        resolve(createHistory(res.result, previous));
      }catch(error){
        console.log('\x1B[31m'+error.toString()+'\x1B[0m');
        console.log('url:', url, res.statusCode);
        if(error.details){
          console.log('details:', error.details);
        }
        error.url = url;
        reject(error);
      }
    });
  });
}

function testRunner(phoenixPromise, request, historyPromise){
  var resultsPromise = when.promise(function(resolve, reject, notify){
    it((request.method || 'GET')+' '+request.url, function(done){
      when.all([
        phoenixPromise,
        historyPromise
      ])
      .spread(function(phoenix, history){
        var promiseSet = _.map(history, function(previousTest){
          return runTest(phoenix, request, previousTest);
        });
        when.all(promiseSet).then(function(newResults){
          resolve(_.flatten(newResults));
          done();
        })
        .otherwise(function(err){
          if(request.followBy){
            //if we have children tests, pass failure state to them so they can short-circuit
            reject(new Error('Parent test failed: '+(request.method || 'GET')+' '+err.url));
          }
          done(err);
        });
      })
      .otherwise(function(err){
        done(err);
      });
    });
  });
  if(_.isArray(request.followBy)){
    _.forEach(request.followBy, function(followBy){
      testRunner(phoenixPromise, followBy, resultsPromise);
    });
  }else if(_.isObject(request.followBy)){
    testRunner(phoenixPromise, request.followBy, resultsPromise);
  }
}

module.exports = testRunner;
