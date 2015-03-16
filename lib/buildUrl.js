'use strict';

var _ = require('lodash');

function buildUrl (url, args) {
  if(!_.isObject(args)){
    throw new Error('INVALID ARGUMENTS FOR '+url);
  }
  var finalUrl = url.replace(/\{\[?(\d*)\]?\.?(\w+)\}/g, function(match, history, key){
    var historyPosition = _.parseInt(history);
    var targetArgs = args;
    if(history){
      if(_.isArray(args._history) && historyPosition >= 0 && historyPosition < args._history.length){
        targetArgs = args._history[historyPosition];
      }else{
        console.log('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+url);
        console.log('Available history: ', args._history);
        throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+url);
      }
    }
    if(_.has(targetArgs, key)){
      return ''+targetArgs[key];
    }else{
      console.log('MISSING KEY REFERENCE \''+key+'\' IN '+url);
      console.log('Available arguments: ', targetArgs);
      throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+url);
    }
  });
  return finalUrl;
}

module.exports = buildUrl;
