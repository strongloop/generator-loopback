// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var wsModels = require('loopback-workspace').models;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var expect = require('chai').expect;
var common = require('./common');
var testhelpers = require('yeoman-test');

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
    testhelpers.mockPrompt(propertyGenerator, {
      model: 'Car',
      name: 'isPreferred',
      customType: '', // temporary workaround for
                      // https://github.com/yeoman/generator/issues/600
      customItemType: '', // temporary workaround for
                          // https://github.com/yeoman/generator/issues/600
      type: 'boolean',
      required: 'true',
      defaultValue: 'true'
    });

    propertyGenerator.run(function() {
      var definition = common.readJsonSync('common/models/car.json');
      var props = definition.properties || {};
      expect(props).to.have.property('isPreferred');
      expect(props.isPreferred).to.eql({
        type: 'boolean',
        required: true,
        default: true
      });
      done();
    });
  });

  it('creates a typed array', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    testhelpers.mockPrompt(propertyGenerator, {
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
      var definition = common.readJsonSync('common/models/car.json');
      var prop = definition.properties.list;
      expect(prop.type).to.eql(['string']);
      done();
    });
  });
  
  it('creates a defaultFn: "now" on date fields if specified', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    testhelpers.mockPrompt(propertyGenerator, {
      model: 'Car',
      name: 'created',
      type: 'date',
      customType: '', // temporary workaround for
                      // https://github.com/yeoman/generator/issues/600
      customItemType: '', // temporary workaround for
                          // https://github.com/yeoman/generator/issues/600
      defaultValue: 'Now'
    });

    propertyGenerator.run(function() {
      var definition = common.readJsonSync('common/models/car.json');
      var prop = definition.properties.created;
      expect(prop.defaultFn).to.eql('now');
      done();
    });
  });

  it('creates a defaultFn: "guid" on date fields if specified', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    testhelpers.mockPrompt(propertyGenerator, {
      model: 'Car',
      name: 'uniqueId',
      type: 'string',
      customType: '', // temporary workaround for
                      // https://github.com/yeoman/generator/issues/600
      customItemType: '', // temporary workaround for
                          // https://github.com/yeoman/generator/issues/600
      defaultValue: 'uuid'
    });

    propertyGenerator.run(function() {
      var definition = common.readJsonSync('common/models/car.json');
      var prop = definition.properties.uniqueId;
      expect(prop.defaultFn).to.eql('uuid');
      done();
    });
  });

  function givenPropertyGenerator() {
    var name = 'loopback:property';
    var path = '../../property';
    var gen = common.createGenerator(name, path);
    return gen;
  }
});
