/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var common = require('./common');
var assert = require('assert');
var fs = require('fs');

describe('loopback:app generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  // This is a simple smoke test to execute all generator steps
  // Since most of the heavy lifting is done by loopback-workspace,
  // we don't have to test it again.

  var EXPECTED_PROJECT_FILES = [
    '.gitignore',
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
    gen.run(function () {
      helpers.assertFile(EXPECTED_PROJECT_FILES);
      done();
    });
  });

  it('creates the project in a subdirectory if asked to', function(done) {
    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      appname: 'test-app',
      template: 'api-server',
      dir: 'test-dir',
    });

    gen.run(function() {
      // generator calls `chdir` on change of the destination root
      process.chdir(SANDBOX);

      var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
        return 'test-dir/' + f;
      });
      helpers.assertFile(expectedFiles);
      assert.equal(gen.dir, 'test-dir');
      done();
    });
  });

  it('normalizes the appname with .', function(done) {
    var cwdName = 'x.y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('normalizes the appname with space', function(done) {
    var cwdName = 'x y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('normalizes the appname with @', function(done) {
    var cwdName = 'x@y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('should create .yo-rc.json', function(done) {
    var gen = givenAppGenerator();
    helpers.mockPrompt(gen, {dir: '.'});
    gen.run(function() {
      var yoRcPath = path.resolve(SANDBOX, '.yo-rc.json');
      assert(fs.existsSync(yoRcPath), 'file exists');
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

  function testAppNameNormalization(cwdName, expectedAppName, done) {
    var gen = givenAppGenerator();
    var dir = path.join(SANDBOX, cwdName);
    helpers.testDirectory(dir, function() {
      helpers.mockPrompt(gen, {
        template: 'api-server',
        dir: '.'
      });

      gen.run(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);

        var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
          return cwdName + '/' + f;
        });
        helpers.assertFile(expectedFiles);
        var pkg = require(path.join(dir, 'package.json'));
        assert.equal(pkg.name, expectedAppName);
        done();
      });
    });
  }
});
