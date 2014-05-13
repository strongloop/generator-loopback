/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var Project = require('loopback-workspace').models.Project;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');

describe('loopback:datasource generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    Project.createFromTemplate(SANDBOX, 'test-app', 'mobile', done);
  });

  it('adds an entry to datasources.json', function(done) {
    var modelGen = givenDataSourceGenerator(['crm']);
    helpers.mockPrompt(modelGen, {
      connector: 'mysql'
    });

    var builtinSources = Object.keys(readDataSourcesJsonSync());
    modelGen.run({}, function() {
      var newSources = Object.keys(readDataSourcesJsonSync());
      var expectedSources = builtinSources.concat(['crm']);
      expect(newSources).to.have.members(expectedSources);
      done();
    });
  });

  function givenDataSourceGenerator(modelArgs) {
    var deps = [ '../../datasource' ];
    var gen = helpers.createGenerator('loopback:datasource', deps, modelArgs, {});
    return gen;
  }

  function readDataSourcesJsonSync() {
    var filepath = path.resolve(SANDBOX, 'datasources.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
