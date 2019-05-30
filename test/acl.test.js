// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, afterEach, it */
'use strict';
var path = require('path');

var helpers = require('yeoman-test');
var wsModels = require('loopback-workspace').models;
var SANDBOX = path.resolve(__dirname, 'sandbox');
var expect = require('chai').expect;
var common = require('./common');

describe('loopback:acl generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  afterEach(common.resetWorkspace);

  beforeEach(function createCarModel(done) {
    var test = this;
    wsModels.ModelDefinition.create(
      {
        name: 'Car',
        facetName: 'common',
      },
      function(err, model) {
        if (err) {
          return done(err);
        }
        test.Model = model;
        // Create another model
        wsModels.ModelDefinition.create(
          {
            name: 'Location',
            facetName: 'common',
          }, done
        );
      }
    );
  });

  it('adds an entry to models.json', function() {
    return helpers.run(path.join(__dirname, '../acl'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        scope: 'all',
        accessType: '*',
        role: '$everyone',
        permission: 'AUDIT',
      }).then(function() {
        var def = common.readJsonSync('common/models/car.json');
        var carAcls = def.acls;

        expect(carAcls).to.eql([{
          accessType: '*',
          permission: 'AUDIT',
          principalType: 'ROLE',
          principalId: '$everyone',
        }]);
      });
  });

  it('skips accessType is the scope is method', function() {
    return helpers.run(path.join(__dirname, '../acl'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        scope: 'method',
        property: 'find',
        role: '$everyone',
        permission: 'AUDIT',
      }).then(function() {
        var def = common.readJsonSync('common/models/car.json');
        var carAcls = def.acls;

        expect(carAcls).to.eql([{
          accessType: 'EXECUTE',
          property: 'find',
          permission: 'AUDIT',
          principalType: 'ROLE',
          principalId: '$everyone',
        }]);
      });
  });

  it('adds an entry to models.json for custom role', function() {
    return helpers.run(path.join(__dirname, '../acl'))
      .cd(SANDBOX)
      .withPrompts({
        model: 'Car',
        scope: 'all',
        accessType: '*',
        role: 'other',
        customRole: 'myRole',
        permission: 'DENY',
      }).then(function() {
        var def = common.readJsonSync('common/models/car.json');
        var carAcls = def.acls;

        expect(carAcls).to.eql([{
          accessType: '*',
          permission: 'DENY',
          principalType: 'ROLE',
          principalId: 'myRole',
        }]);
      });
  });

  it('adds an entry to all models.json', function() {
    return helpers.run(path.join(__dirname, '../acl'))
      .cd(SANDBOX)
      .withPrompts({
        scope: 'all',
        accessType: '*',
        role: '$owner',
        permission: 'ALLOW',
      }).then(function() {
        var def = common.readJsonSync('common/models/car.json');
        var carAcls = def.acls;

        expect(carAcls).to.eql([{
          accessType: '*',
          permission: 'ALLOW',
          principalType: 'ROLE',
          principalId: '$owner',
        }]);

        def = common.readJsonSync('common/models/location.json');
        var locationACLs = def.acls;

        expect(locationACLs).to.eql([{
          accessType: '*',
          permission: 'ALLOW',
          principalType: 'ROLE',
          principalId: '$owner',
        }]);
      });
  });
});
