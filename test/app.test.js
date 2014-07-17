/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var common = require('./common');

describe('loopback:app generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  // This is a simple smoke test to execute all generator steps
  // Since most of the heavy lifting is done by loopback-workspace,
  // we don't have to test it again.

  var EXPECTED_PROJECT_FILES = [
    'package.json',

    'server/config.json',
    'server/datasources.json',
    'server/model-config.json',
    'server/server.js',

    'client/README.md'
  ];

  it('creates expected files', function(done) {

    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      name: 'test-app',
      template: 'api-server'
    });

    gen.options['skip-install'] = true;
    gen.run({}, function () {
      helpers.assertFile(EXPECTED_PROJECT_FILES);
      done();
    });
  });

  it('creates the project in a subdirectory if asked to', function(done) {
    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      name: 'test-app',
      template: 'api-server',
      dir: 'test-app',
    });

    gen.run({}, function() {
      // generator calls `chdir` on change of the destination root
      process.chdir(SANDBOX);

      var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
        return 'test-app/' + f;
      });
      helpers.assertFile(expectedFiles);
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
