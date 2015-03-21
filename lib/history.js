'use strict';

var _ = require('lodash');

module.exports = {
  lookupAtPosition: function(request, history, key, historyPosition){
    if(_.isArray(history._history) && historyPosition >= 0 && historyPosition < history._history.length){
      var targetArgs = history._history[historyPosition];
      if(_.has(targetArgs, key)){
        return ''+targetArgs[key];
      }else{
        console.log('MISSING KEY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
        console.log('Available history: ', history._history);
        throw new Error('MISSING KEY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
      }
    }else{
      console.log('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
      console.log('Available history: ', history._history);
      throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
    }
  },
  lookup: function(request, history, key){
    if(_.has(request.override, key)){
      return ''+request.override[key];
    }
    if(_.has(history, key)){
      return ''+history[key];
    }
    var historyValues = _.pluck(history._history, key);
    if(historyValues.length > 0){
      return ''+_.last(historyValues);
    }

    console.log('MISSING KEY REFERENCE \''+key+'\' IN '+request.url);
    console.log('Available arguments: ', history);
    throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+request.url);
  }
};
