/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var assert = require('assert');
var common = require('./common');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');

describe('loopback generator help', function () {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  it('print help message with yo by default', function () {
    var names = ['app', 'acl', 'datasource', 'model', 'property', 'relation'];
    names.forEach(function(name) {
      var gen = givenGenerator(name, ['--help']);
      var helpText = gen.help();
      assert(helpText.indexOf(' yo ') !== -1);
      assert(helpText.indexOf(' slc ') === -1);
    });
  });

  it('print help message with slc if invoked from slc', function () {
    process.env.SLC_COMMAND = 'loopback --help';
    var names = ['app', 'acl', 'datasource', 'model', 'property', 'relation'];
    try {
      names.forEach(function (name) {
        var gen = givenGenerator(name, ['--help']);
        var helpText = gen.help();
        assert(helpText.indexOf(' slc ') !== -1);
        assert(helpText.indexOf(' yo ') === -1);
      });
    } catch(err) {
      process.env.SLC_COMMAND = undefined;
      throw err;
    }
    process.env.SLC_COMMAND = undefined;
  });

  function givenGenerator(name, modelArgs) {
    var fullName = 'loopback:' + name;
    var path = '../../' + name;
    var gen = common.createGenerator(fullName, path, [], modelArgs, {});
    return gen;
  }
});
