/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var Project = require('loopback-workspace').models.Project;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');

describe('loopback:property generator', function() {
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    Project.createFromTemplate(SANDBOX, 'test-app', 'mobile', done);
  });

  it('adds an entry to models.json', function(done) {
    var propertyGenerator = givenPropertyGenerator();
    helpers.mockPrompt(propertyGenerator, {
      model: 'user',
      name: 'isPreferred',
      type: 'boolean',
      required: 'true'
    });

    propertyGenerator.run({}, function() {
      var models = readModelsJsonSync();
      var userOpts = models.user.properties || {};
      expect(userOpts).to.have.property('isPreferred');
      expect(userOpts.isPreferred).to.eql({
        type: 'boolean',
        required: true
      });
      done();
    });
  });

  function givenPropertyGenerator() {
    var deps = [ '../../property' ];
    var name = 'loopback:property';
    var gen = helpers.createGenerator(name, deps, [], {});
    return gen;
  }

  function readModelsJsonSync() {
    var filepath = path.resolve(SANDBOX, 'models.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
