/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');

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
      'app.js',
      'app.json',
      'datasources.json',
      'models.json',
    ];

    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      name: 'test-app',
      template: 'empty'
    });

    gen.options['skip-install'] = true;
    gen.run({}, function () {
      helpers.assertFile(expected);
      done();
    });
  });

  function givenAppGenerator(modelArgs) {
    var deps = [ '../../app' ];
    var gen = helpers.createGenerator('loopback:app', deps, modelArgs, {});
    gen.options['skip-install'] = true;
    return gen;
  }
});
