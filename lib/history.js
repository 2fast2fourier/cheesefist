'use strict';

var _ = require('lodash');

module.exports = {
  lookupAtPosition: function(request, context, key, historyPosition){
    if(historyPosition >= 0 && historyPosition < context.history.length){
      var targetArgs = context.history[historyPosition];
      if(_.has(targetArgs.content, key)){
        return ''+targetArgs.content[key];
      }else{
        throw new Error('MISSING KEY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
      }
    }else{
      throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
    }
  },
  lookup: function(request, context, key){
    var result = _.findLast(context.history, function(step){
      return _.has(step.content, key);
    });
    if(result !== undefined){
      return result.content[key];
    }
    throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+request.url);
  }
};
