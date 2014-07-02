/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var common = require('./common');

describe('loopback:app generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  // This is a simple smoke test to execute all generator steps
  // Since most of the heavy lifting is done by loopback-workspace,
  // we don't have to test it again.

  it('creates expected files', function(done) {
    var expected = [
      'package.json',

      'rest/datasources.json',
      'rest/models.json',
      'rest/rest.js',

      'server/config.json',
      'server/server.js',
    ];

    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      name: 'test-app',
      template: 'api-server'
    });

    gen.options['skip-install'] = true;
    gen.run({}, function () {
      helpers.assertFile(expected);
      done();
    });
  });

  function givenAppGenerator(modelArgs) {
    var name = 'loopback:app';
    var path = '../../app';
    var gen = common.createGenerator(name, path, [], modelArgs, {});
    gen.options['skip-install'] = true;
    return gen;
  }
});
