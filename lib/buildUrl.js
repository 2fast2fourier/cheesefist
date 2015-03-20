'use strict';

var _ = require('lodash');

function historyLookup(url, args, historyPosition, key){
  if(_.isArray(args._history) && historyPosition >= 0 && historyPosition < args._history.length){
    var targetArgs = args._history[historyPosition];
    if(_.has(targetArgs, key)){
      return ''+targetArgs[key];
    }else{
      console.log('MISSING KEY REFERENCE \''+key+'\' IN '+url);
      console.log('Available arguments: ', targetArgs);
      throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+url);
    }
  }else{
    console.log('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+url);
    console.log('Available history: ', args._history);
    throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+url);
  }
}

function buildUrl (url, args, request) {
  args = args || {};
  var finalUrl = url.replace(/\{\[?(\d*)\]?\.?(\w+)\}/g, function(match, history, key){
    if(history){
      return historyLookup(url, args, _.parseInt(history), key);
    }
    if(_.has(request.override, key)){
      return ''+request.override[key];
    }
    if(_.has(args, key)){
      return ''+args[key];
    }
    var historyValues = _.pluck(args._history, key);
    if(historyValues.length > 0){
      return ''+_.last(historyValues);
    }

    console.log('MISSING KEY REFERENCE \''+key+'\' IN '+url);
    console.log('Available arguments: ', args);
    throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+url);
  });
  return finalUrl;
}

module.exports = buildUrl;
