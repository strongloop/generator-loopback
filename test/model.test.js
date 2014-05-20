/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var Project = require('loopback-workspace').models.Project;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
var common = require('./common');

describe('loopback:model generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    Project.createFromTemplate(SANDBOX, 'test-app', 'mobile', done);
  });

  it('adds an entry to models.json', function(done) {
    var modelGen = givenModelGenerator(['Product']);
    helpers.mockPrompt(modelGen, {
      dataSource: 'db',
      propertyName: ''
    });

    var builtinModels = Object.keys(readModelsJsonSync());
    modelGen.run({}, function() {
      var newModels = Object.keys(readModelsJsonSync());
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

  function readModelsJsonSync() {
    var filepath = path.resolve(SANDBOX, 'models.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
