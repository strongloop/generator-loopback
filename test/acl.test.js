/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var Project = require('loopback-workspace').models.Project;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');

describe('loopback:acl generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    Project.createFromTemplate(SANDBOX, 'test-app', 'mobile', done);
  });

  it('adds an entry to models.json', function(done) {
    var aclGen = givenAclGenerator();
    helpers.mockPrompt(aclGen, {
      model: 'user',
      scope: 'all',
      accessType: '*',
      role: '$everyone',
      permission: 'AUDIT'
    });

    aclGen.run({}, function() {
      var models = readModelsJsonSync();
      var userOpts = models.user.options || {};
      var userAcls = userOpts.acls;

      expect(userAcls).to.eql([{
        accessType: '*',
        permission: 'AUDIT',
        principalType: 'ROLE',
        principalId: '$everyone'
      }]);
      done();
    });
  });

  function givenAclGenerator() {
    var deps = [ '../../acl' ];
    var name = 'loopback:acl';
    var gen = helpers.createGenerator(name, deps, [], {});
    return gen;
  }

  function readModelsJsonSync() {
    var filepath = path.resolve(SANDBOX, 'models.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
