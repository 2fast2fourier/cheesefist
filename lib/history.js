'use strict';

var _ = require('lodash');
var util = require('util');

module.exports = {
  lookupAtPosition: function(request, args, key, historyPosition){
    if(historyPosition >= 0 && historyPosition < args.history.length){
      var targetArgs = args.history[historyPosition];
      if(_.has(targetArgs.content, key)){
        return ''+targetArgs.content[key];
      }else{
        throw new Error('MISSING KEY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
      }
    }else{
      throw new Error('INVALID HISTORY REFERENCE \'['+historyPosition+'].'+key+'\' IN '+request.url);
    }
  },
  lookup: function(request, args, key){
    var lastValue = _.findLast(args.history, function(result){
      return _.has(result.content, key);
    });
    if(lastValue !== undefined){
      return lastValue.content[key];
    }
    throw new Error('MISSING KEY REFERENCE \''+key+'\' IN '+request.url);
  }
};
