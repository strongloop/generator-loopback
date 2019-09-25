// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var wsModels = require('loopback-workspace').models;
var common = require('./common');
var yaml = require('js-yaml');
var install = require('strong-cached-install');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var PKG_CACHE = path.resolve(__dirname, '..', '.pkgcache');

describe('loopback:export-api-def generator', function() {
  var PROCESS_EXIT_STUB;
  this.timeout(30 * 60 * 1000); // 30 minutes
  before(common.resetWorkspace);

  before(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  before(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  before(function createProductModel(done) {
    var test = this;
    wsModels.ModelDefinition.create(
      {
        name: 'Product',
        facetName: 'common',
      },
      function(err, model) {
        test.Model = model;
        done(err);
      }
    );
  });

  before(function installDependencies(done) {
    install(SANDBOX, PKG_CACHE, ['dependencies'], done);
  });

  beforeEach(function stubProcessExit() {
    PROCESS_EXIT_STUB = sinon.stub(process, 'exit');
  });

  afterEach(function unstubProcessExit() {
    PROCESS_EXIT_STUB.restore();
  });

  it('produces JSON format', function() {
    return helpers.run(path.join(__dirname, '../export-api-def'))
      .cd(SANDBOX)
      .withOptions({
        output: 'swagger.json',
      }).then(function() {
        var content = readJsonFile();
        expect(content).to.have.property('swagger', '2.0');
        expect(content).to.not.have.property('host');
        expect(content).to.not.have.property('schemes');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('basePath');
        expect(content).to.have.property('info');
        expect(content.info).to.have.property(
          'title', 'test-app'
        );
        expect(content).to.have.property('tags');
        expect(content.consumes).to.have.members([
          'application/json',
          'application/x-www-form-urlencoded',
          'application/xml', 'text/xml',
        ]);
        expect(content.produces).to.have.members([
          'application/json',
          'application/xml', 'text/xml',
          'application/javascript', 'text/javascript',
        ]);
      });
  });

  it('produces YAML format', function() {
    return helpers.run(path.join(__dirname, '../export-api-def'))
      .cd(SANDBOX)
      .withOptions({
        output: 'swagger.yaml',
      }).then(function() {
        var content = readYamlFile();
        expect(content).to.have.property('swagger', '2.0');
        expect(content).to.not.have.property('host');
        expect(content).to.not.have.property('schemes');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('basePath');
        expect(content).to.have.property('info');
        expect(content.info).to.have.property(
          'title', 'test-app'
        );
        expect(content).to.have.property('tags');
        expect(content.consumes).to.have.members([
          'application/json',
          'application/x-www-form-urlencoded',
          'application/xml', 'text/xml',
        ]);
        expect(content.produces).to.have.members([
          'application/json',
          'application/xml', 'text/xml',
          'application/javascript', 'text/javascript',
        ]);
      });
  });

  describe('running on project with onging async operations', function() {
    it('immediately does not exit the process', function() {
      expect(PROCESS_EXIT_STUB.called).to.equal(false);
      return helpers.run(path.join(__dirname, '../export-api-def'))
        .cd(SANDBOX)
        .withOptions({
          output: 'swagger.yaml',
        }).then(function() {
          expect(PROCESS_EXIT_STUB.called).to.equal(false);
        });
    });
    it('eventually exits the process', function(done) {
      this.timeout(1000); // 10 seconds
      expect(PROCESS_EXIT_STUB.called).to.equal(false);
      helpers.run(path.join(__dirname, '../export-api-def'))
        .cd(SANDBOX)
        .withOptions({
          output: 'swagger.yaml',
        }).then(function() {
          checkProcessExitCalled(done);
        });
    });
  });

  function checkProcessExitCalled(done) {
    if (PROCESS_EXIT_STUB.called) {
      done();
    } else {
      setTimeout(checkProcessExitCalled, 10, done);
    }
  }

  function readJsonFile() {
    var jsonFile = path.resolve(SANDBOX, 'swagger.json');
    var content = fs.readFileSync(jsonFile, 'utf-8');
    return JSON.parse(content);
  }

  function readYamlFile() {
    var yamlFile = path.resolve(SANDBOX, 'swagger.yaml');
    var content = fs.readFileSync(yamlFile, 'utf-8');
    return yaml.load(content);
  }
});
