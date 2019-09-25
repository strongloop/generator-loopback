// Copyright IBM Corp. 2015,2019. All Rights Reserved.
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

describe('loopback:remote-method generator', function() {
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

  it('adds an entry to common/models/{name}.json', function() {
    return helpers.run(path.join(__dirname, '../remote-method'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        methodName: 'myRemote',
        isStatic: 'true',
        desription: 'This is my first remote method',
        httpPath: '',
        acceptsArg: '',
        returnsArg: '',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var methods = definition.methods || {};
        expect(methods).to.have.property('myRemote');
        expect(methods.myRemote).to.eql({
          accepts: [],
          returns: [],
          http: [],
        });
      });
  });

  it('method name with `prototype.` should not be removed', function() {
    return helpers.run(path.join(__dirname, '../remote-method'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        methodName: 'prototype.myRemote',
        isStatic: 'false',
        desription: 'This is my first remote method',
        httpPath: '',
        acceptsArg: '',
        returnsArg: '',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var methods = definition.methods || {};
        expect(methods).to.have.property('prototype.myRemote');
        expect(methods['prototype.myRemote']).to.eql({
          accepts: [],
          returns: [],
          http: [],
        });
      });
  });

  it('honors the arguments as model and method names', function() {
    return helpers.run(path.join(__dirname, '../remote-method'))
      .cd(SANDBOX)
      .withArguments(['Car', 'myRemote'])
      .withPrompts({
        isStatic: 'true',
        desription: 'This is my remote method created with arguments',
        httpPath: '',
        acceptsArg: '',
        returnsArg: '',
      }).then(function() {
        var definition = common.readJsonSync('common/models/car.json');
        var methods = definition.methods || {};
        expect(methods).to.have.property('myRemote');
        expect(methods['myRemote']).to.eql({
          accepts: [],
          returns: [],
          http: [],
        });
      });
  });
});
