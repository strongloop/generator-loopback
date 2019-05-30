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
        facetName: 'common',
      },
      function(err, model) {
        test.Model = model;
        done(err);
      }
    );
  });

  it('creates model with non required default', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'model',
        type: 'string',
        required: undefined,
        defaultValue: '',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('model');
        expect(props.model).to.eql({
          type: 'string',
          default: null,
        });
      });
  });

  it('creates number type property from large number', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'age',
        type: 'number',
        defaultValue: '55555555555555555555.5',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('age');
        expect(props.age).to.eql({
          type: 'number',
          default: 55555555555555555555.5,
        });
      });
  });

  it('creates model containing boolean type', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'isPreferred',
        type: 'boolean',
        defaultValue: 'true',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('isPreferred');
        expect(props.isPreferred).to.eql({
          type: 'boolean',
          default: true,
        });
      });
  });

  it('creates date type property from ISO string', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'year',
        type: 'date',
        defaultValue: '2015-11',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('year');
        expect(props.year).to.eql({
          type: 'date',
          default: '2015-11-01T00:00:00.000Z',
        });
      });
  });

  it('creates date type property from number', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'year',
        type: 'date',
        defaultValue: '1466087191000',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('year');
        expect(props.year).to.eql({
          type: 'date',
          default: new Date(1466087191000).toISOString(),
        });
      });
  });

  it('creates string item typed array', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'options',
        type: 'array',
        itemType: 'string',
        defaultValue: 'AWD,3.2L, navigation',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('options');
        expect(props.options).to.eql({
          type: ['string'],
          default: ['AWD', '3.2L', 'navigation'],
        });
      });
  });

  it('creates number item typed array', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'parts',
        type: 'array',
        itemType: 'number',
        defaultValue: '123456, 98765',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('parts');
        expect(props.parts).to.eql({
          type: ['number'],
          default: [123456, 98765],
        });
      });
  });

  it('creates boolean item typed array', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'certifications',
        type: 'array',
        itemType: 'boolean',
        defaultValue: 'true,1,t,false,0,f',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('certifications');
        expect(props.certifications).to.eql({
          type: ['boolean'],
          default: [true, true, true, false, false, false],
        });
      });
  });

  it('creates date item typed array', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'serviceDates',
        type: 'array',
        itemType: 'date',
        defaultValue: '1466087191000,2016-06-16T17:13:11.000Z',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('serviceDates');
        expect(props.serviceDates).to.eql({
          type: ['date'],
          default: [new Date(1466087191000).toISOString(),
            '2016-06-16T17:13:11.000Z'],
        });
      });
  });

  it('creates geopoint type property from object', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'location',
        type: 'geopoint',
        defaultValue: '{"lat": 55.5, "lng":44.4}',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('location');
        expect(props.location).to.eql({
          type: 'geopoint',
          default: {'lat': 55.5, 'lng': 44.4},
        });
      });
  });

  it('creates geopoint type property from numbers', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'location',
        type: 'geopoint',
        defaultValue: '55.5, 44.4',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var props = definition.properties || {};
        expect(props).to.have.property('location');
        expect(props.location).to.eql({
          type: 'geopoint',
          default: {'lat': 55.5, 'lng': 44.4},
        });
      });
  });

  it('creates a defaultFn: "now" on date fields if specified', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'created',
        type: 'date',
        defaultValue: 'Now',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var prop = definition.properties.created;
        expect(prop.defaultFn).to.eql('now');
      });
  });

  it('creates a defaultFn: "guid" on date fields if specified', function() {
    return helpers.run(path.join(__dirname, '../property'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        name: 'uniqueId',
        type: 'string',
        defaultValue: 'uuid',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var prop = definition.properties.uniqueId;
        expect(prop.defaultFn).to.eql('uuid');
      });
  });
});
