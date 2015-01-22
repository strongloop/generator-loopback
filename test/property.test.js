/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var wsModels = require('loopback-workspace').models;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('chai').expect;
var common = require('./common');

describe('loopback:property generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  beforeEach(function createCarModel(done) {
    var test = this;
    wsModels.ModelDefinition.create(
      {
        name: 'Car',
        facetName: 'common'
      },
      function(err, model) {
        test.Model = model;
        done(err);
      });
  });

  it('adds an entry to common/models/{name}.json', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    helpers.mockPrompt(propertyGenerator, {
      model: 'Car',
      name: 'isPreferred',
      customType: '', // temporary workaround for
                      // https://github.com/yeoman/generator/issues/600
      customItemType: '', // temporary workaround for
                          // https://github.com/yeoman/generator/issues/600
      type: 'boolean',
      required: 'true'
    });

    propertyGenerator.run(function() {
      var definition = readJsonSync('common/models/car.json');
      var props = definition.properties || {};
      expect(props).to.have.property('isPreferred');
      expect(props.isPreferred).to.eql({
        type: 'boolean',
        required: true
      });
      done();
    });
  });

  it('creates a typed array', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    helpers.mockPrompt(propertyGenerator, {
      model: 'Car',
      name: 'list',
      type: 'array',
      customType: '', // temporary workaround for
                      // https://github.com/yeoman/generator/issues/600
      customItemType: '', // temporary workaround for
                          // https://github.com/yeoman/generator/issues/600
      itemType: 'string'
    });

    propertyGenerator.run(function() {
      var definition = readJsonSync('common/models/car.json');
      var prop = definition.properties.list;
      expect(prop.type).to.eql(['string']);
      done();
    });
  });

  function givenPropertyGenerator() {
    var name = 'loopback:property';
    var path = '../../property';
    var gen = common.createGenerator(name, path);
    return gen;
  }

  function readJsonSync(relativePath) {
    var filepath = path.resolve(SANDBOX, relativePath);
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
