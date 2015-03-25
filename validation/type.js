'use strict';

var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;

module.exports = function(value, content, result, request) {
  expect(content).to.be.a(value);
};
