'use strict';

var _ = require('lodash');

module.exports = {
  lookupAtPosition: function(request, history, key, historyPosition){
    if(_.isArray(history._history) && historyPosition >= 0 && historyPosition < history._history.length){
      var targetArgs = history._history[historyPosition];
      if(_.has(targetArgs, key)){
        return ''+targetArgs[key];
      }else{
        throw new Error('MISSING KEY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
      }
    }else{
      throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
    }
  },
  lookup: function(request, history, key){
    if(_.has(history, key)){
      return ''+history[key];
    }
    var lastValue = _.findLast(history._history, function(result){
      return _.has(result, key);
    });
    if(lastValue !== undefined){
      return lastValue[key];
    }
    throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+request.url);
  }
};
