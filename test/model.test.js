/*global describe, beforeEach, afterEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
var common = require('./common');

describe('loopback:model generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  afterEach(common.resetWorkspace);

  it('creates models/{name}.json', function(done) {
    var modelGen = givenModelGenerator(['Product']);
    helpers.mockPrompt(modelGen, {
      dataSource: 'db',
      propertyName: ''
    });

    modelGen.run({}, function() {
      var productJson = path.resolve(SANDBOX, 'models/product.json');
      expect(fs.existsSync(productJson), 'file exists');
      var content = JSON.parse(fs.readFileSync(productJson));
      expect(content).to.have.property('name', 'Product');
      done();
    });
  });

  it('adds an entry to rest/models.json', function(done) {
    var modelGen = givenModelGenerator(['Product']);
    helpers.mockPrompt(modelGen, {
      dataSource: 'db',
      propertyName: ''
    });

    var builtinModels = Object.keys(readModelsJsonSync('rest'));
    modelGen.run({}, function() {
      var newModels = Object.keys(readModelsJsonSync('rest'));
      var expectedModels = builtinModels.concat(['Product']);
      expect(newModels).to.have.members(expectedModels);
      done();
    });
  });

  function givenModelGenerator(modelArgs) {
    var path = '../../model';
    var name = 'loopback:model';
    var deps = [ ['../../property', 'loopback:property'] ];
    var gen = common.createGenerator(name, path, deps, modelArgs, {});
    return gen;
  }

  function readModelsJsonSync(component) {
    var filepath = path.resolve(SANDBOX, component || '.', 'models.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
