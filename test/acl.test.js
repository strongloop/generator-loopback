/*global describe, beforeEach, afterEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var wsModels = require('loopback-workspace').models;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
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
        facetName: 'common'
      },
      function(err, model) {
        if(err) {
          return done(err);
        }
        test.Model = model;
        // Create another model
        wsModels.ModelDefinition.create(
          {
            name: 'Location',
            facetName: 'common'
          }, done);
      });
  });

  it('adds an entry to models.json', function(done) {
    var aclGen = givenAclGenerator();
    helpers.mockPrompt(aclGen, {
      model: 'Car',
      scope: 'all',
      accessType: '*',
      role: '$everyone',
      permission: 'AUDIT'
    });

    aclGen.run({}, function() {
      var def = readJsonSync('common/models/car.json');
      var carAcls = def.acls;

      expect(carAcls).to.eql([{
        accessType: '*',
        permission: 'AUDIT',
        principalType: 'ROLE',
        principalId: '$everyone'
      }]);
      done();
    });
  });

  it('adds an entry to all models.json', function(done) {
    var aclGen = givenAclGenerator();
    helpers.mockPrompt(aclGen, {
      scope: 'all',
      accessType: '*',
      role: '$owner',
      permission: 'ALLOW'
    });

    aclGen.run({}, function() {
      var def = readJsonSync('common/models/car.json');
      var carAcls = def.acls;

      expect(carAcls).to.eql([{
        accessType: '*',
        permission: 'ALLOW',
        principalType: 'ROLE',
        principalId: '$owner'
      }]);

      def = readJsonSync('common/models/location.json');
      var locationACLs = def.acls;

      expect(locationACLs).to.eql([{
        accessType: '*',
        permission: 'ALLOW',
        principalType: 'ROLE',
        principalId: '$owner'
      }]);

      done();
    });
  });

  function givenAclGenerator() {
    var name = 'loopback:acl';
    var path = '../../acl';
    var gen = common.createGenerator(name, path);
    return gen;
  }

  function readJsonSync(relativePath) {
    var filepath = path.resolve(SANDBOX, relativePath);
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
