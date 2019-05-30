// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var wsModels = require('loopback-workspace').models;
var SANDBOX = path.resolve(__dirname, 'sandbox');
var expect = require('chai').expect;
var common = require('./common');

describe('loopback:relation generator', function() {
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
        facetName: 'common',
      },
      function(err, model) {
        if (err) return done(err);
        test.Model = model;
        wsModels.ModelConfig.create(
          {
            name: 'Car',
            facetName: 'server',
            public: true,
          },
          function(err) {
            done(err);
          }
        );
      }
    );
  });

  it('adds an entry to common/models/{name}.json', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
        });
      });
  });

  it('asks for custom model name', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: null,
        customToModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
        });
      });
  });

  it('asks for through model name', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
        through: true,
        throughModel: 'CarPart',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
          through: 'CarPart',
        });
      });
  });

  it('asks for custom through model name', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
        through: true,
        throughModel: null,
        customThroughModel: 'CarPart',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
          through: 'CarPart',
        });
      });
  });

  it('asks for nestRemoting', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
        through: true,
        throughModel: null,
        customThroughModel: 'CarPart',
        nestRemoting: true,
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
          through: 'CarPart',
          options: {
            nestRemoting: true,
          },
        });
      });
  });

  it('asks for disableInclude', function() {
    return helpers.run(path.join(__dirname, '../relation'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        toModel: 'Part',
        asPropertyName: 'parts',
        foreignKey: 'customKey',
        type: 'hasMany',
        through: true,
        throughModel: null,
        customThroughModel: 'CarPart',
        disableInclude: true,
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var relations = definition.relations || {};
        expect(relations).to.have.property('parts');
        expect(relations.parts).to.eql({
          type: 'hasMany',
          foreignKey: 'customKey',
          model: 'Part',
          through: 'CarPart',
          options: {
            disableInclude: true,
          },
        });
      });
  });

  it('provides default property name based on target model for belongsTo',
    function() {
      return helpers.run(path.join(__dirname, '../relation'))
        .cd(SANDBOX)
        .withPrompts({
          model: 'Car',
          toModel: 'Part',
          type: 'belongsTo',
        }).then(function() {
          var definition = common.readJsonSync('common/models/car.json');
          var relations = definition.relations || {};
          expect(Object.keys(relations)).to.include('part');
        });
    });

  it('provides default property name based on target model for hasMany',
    function() {
      return helpers.run(path.join(__dirname, '../relation'))
        .cd(SANDBOX)
        .withPrompts({
          model: 'Car',
          toModel: 'Part',
          type: 'hasMany',
        }).then(function() {
          var definition = common.readJsonSync('common/models/car.json');
          var relations = definition.relations || {};
          expect(Object.keys(relations)).to.include('parts');
        });
    });
});
