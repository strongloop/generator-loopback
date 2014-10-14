/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
var common = require('./common');

describe('loopback:install generator', function() {
  beforeEach(common.resetWorkspace);
  
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  it('adds a dep to package.json', function(done) {
    var instGen = givenInstallGenerator();
    helpers.mockPrompt(instGen, {
      name: 'debug',
      dev: false
    });

    instGen.run({}, function() {
      var pkg = readJsonSync('package.json');
      expect(pkg.dependencies).to.have.property('debug');

      pkg = readJsonSync('node_modules/debug/package.json');
      expect(pkg.name).to.equal('debug');

      done();
    });
  });

  it('adds a dep with specific version to package.json', function(done) {
    var instGen = givenInstallGenerator();
    helpers.mockPrompt(instGen, {
      name: 'debug@2.0.0',
      dev: false
    });

    instGen.run({}, function() {
      var pkg = readJsonSync('package.json');
      expect(pkg.dependencies).to.have.property('debug');

      pkg = readJsonSync('node_modules/debug/package.json');
      expect(pkg.name).to.equal('debug');
      expect(pkg.version).to.equal('2.0.0');
      done();
    });
  });


  it('adds a dev dep to package.json', function(done) {
    var instGen = givenInstallGenerator();
    helpers.mockPrompt(instGen, {
      name: 'debug',
      dev: true
    });

    instGen.run({}, function() {
      var pkg = readJsonSync('package.json');
      expect(pkg.devDependencies).to.have.property('debug');

      pkg = readJsonSync('node_modules/debug/package.json');
      expect(pkg.name).to.equal('debug');

      done();
    });
  });

  function givenInstallGenerator() {
    var name = 'loopback:install';
    var path = '../../install';
    var gen = common.createGenerator(name, path);
    return gen;
  }

  function readJsonSync(relativePath) {
    var filepath = path.resolve(SANDBOX, relativePath);
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
