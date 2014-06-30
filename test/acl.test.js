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
        componentName: '.',
      },
      function(err, model) {
        test.Model = model;
        done(err);
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
      var def = readJsonSync('models/car.json');
      var carAcls = def.acls;

      expect(carAcls).to.eql([{
        id: 1, // TODO fix workspace to not add this extra property
        accessType: '*',
        permission: 'AUDIT',
        principalType: 'ROLE',
        principalId: '$everyone'
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
