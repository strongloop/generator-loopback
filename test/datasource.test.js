/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
var common = require('./common');

describe('loopback:datasource generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });


  it('adds an entry to rest/datasources.json', function(done) {
    var modelGen = givenDataSourceGenerator(['crm']);
    helpers.mockPrompt(modelGen, {
      connector: 'mysql'
    });

    var builtinSources = Object.keys(readDataSourcesJsonSync('rest'));
    modelGen.run({}, function() {
      var newSources = Object.keys(readDataSourcesJsonSync('rest'));
      var expectedSources = builtinSources.concat(['crm']);
      expect(newSources).to.have.members(expectedSources);
      done();
    });
  });

  function givenDataSourceGenerator(dsArgs) {
    var path = '../../datasource';
    var name = 'loopback:datasource';
    var gen = common.createGenerator(name, path, [], dsArgs, {});
    return gen;
  }

  function readDataSourcesJsonSync(component) {
    var filepath = path.resolve(SANDBOX, component || '.', 'datasources.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
