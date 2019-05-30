// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var os = require('os');
var fs = require('fs-extra');
var common = require('./common');
var assert = require('assert');
var ygAssert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');
var yaml = require('yaml-js');
var SANDBOX = path.resolve(__dirname, 'sandbox');

var BASIC_BLUEMIX_FILES = [
  '.cfignore',
  'manifest.yml',
];

var DOCKER_FILES = [
  '.dockerignore',
  'Dockerfile',
];

var TOOLCHAIN_FILES = [
  '.bluemix/deploy.json',
  '.bluemix/pipeline.yml',
  '.bluemix/toolchain.yml',
];

function itSkipIf(flag) {
  return flag ? it.skip : it;
}

describe('loopback:bluemix generator', function() {
  this.timeout(30 * 60 * 1000); // 30 minutes
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  afterEach(function(done) {
    process.chdir('/');
    rimraf(SANDBOX, done);
  });

  it('should generate datasources.bluemix.js', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts({
        enableManifest: false,
      })
      .withOptions({
        force: true,
        bluemix: true,
      })
      .then(function() {
        ygAssert.file('./server/datasources.bluemix.js');
      });
  });

  it('should generate .bluemix/datasources-config.json', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts({
        enableManifest: false,
      })
      .withOptions({
        force: true,
        bluemix: true,
      })
      .then(function() {
        ygAssert.file('.bluemix/datasources-config.json');
      });
  });

  it('should generate all basic Bluemix files', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts({
        enableManifest: true,
        appMemory: '1024M',
        appInstances: 5,
        appDomain: 'my.bluemix.net',
        appHost: 'cool-app',
        appDiskQuota: '1280M',
        enableDocker: true,
        enableToolchain: true,
        enableAutoScaling: true,
        enableAppMetrics: true,
      })
      .withOptions({
        force: true,
        bluemix: true,
      })
      .then(function() {
        ygAssert.file(BASIC_BLUEMIX_FILES.concat(DOCKER_FILES)
          .concat(TOOLCHAIN_FILES));
      });
  });

  it('should generate only basic Bluemix files', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts({
        enableManifest: true,
        appMemory: '1GB',
        appInstances: 5,
        appDomain: 'my.bluemix.net',
        appHost: 'cool-app',
        appDiskQuota: '1280M',
        enableDocker: false,
        enableToolchain: false,
        enableAutoScaling: false,
        enableAppMetrics: false,
      })
      .withOptions({
        force: true,
        bluemix: true,
      })
      .then(function() {
        ygAssert.file(BASIC_BLUEMIX_FILES);
        ygAssert.file('manifest.yml');
        ygAssert.noFile(DOCKER_FILES);
        ygAssert.noFile(TOOLCHAIN_FILES);
      });
  });

  it('should generate only Docker files', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts()
      .withOptions({
        force: true,
        docker: true,
      })
      .then(function() {
        ygAssert.noFile(BASIC_BLUEMIX_FILES);
        ygAssert.file(DOCKER_FILES);
        ygAssert.noFile(TOOLCHAIN_FILES);
      });
  });

  it('should generate only toolchain files', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts()
      .withOptions({
        force: true,
        toolchain: true,
      })
      .then(function() {
        ygAssert.noFile(BASIC_BLUEMIX_FILES);
        ygAssert.noFile(DOCKER_FILES);
        ygAssert.file(TOOLCHAIN_FILES);
      });
  });

  it('should generate manifest file', function() {
    return helpers.run(path.join(__dirname, '../bluemix'))
      .cd(SANDBOX)
      .withPrompts({
        appMemory: '1g',
        appInstances: 7,
        appDomain: 'my.blue.mix.net',
        appHost: 'cool.app',
        appDiskQuota: '512M',
      })
      .withOptions({
        force: true,
        manifest: true,
      })
      .then(function() {
        ygAssert.noFile(DOCKER_FILES);
        ygAssert.noFile(TOOLCHAIN_FILES);
        ygAssert.file('manifest.yml');
        var content = fs.readFileSync('./manifest.yml', 'utf8');
        var manifest = yaml.load(content);
        assert('1G', manifest.memory);
        assert(7, manifest.instances);
        assert('my.blue.mix.net', manifest.domain);
        assert('cool.app', manifest.host);
        assert('512M', manifest.disk_quota);
        assert('bluemix', manifest.env.NODE_ENV);
      });
  });

  itSkipIf(!process.env.BLUEMIX_EMAIL || !process.env.BLUEMIX_PASSWORD)(
    'should login with user/password', function() {
      return helpers.run(path.join(__dirname, '../bluemix'))
        .cd(SANDBOX)
        .withPrompts({
          email: process.env.BLUEMIX_EMAIL,
          password: process.env.BLUEMIX_PASSWORD,
          rememberMe: true,
          tryAgain: false,
        })
        .withOptions({
          force: true,
          login: true,
        })
        .then(function() {
          var configFile = path.join(os.homedir(), '.bluemix/.loopback/config.json');
          ygAssert.file([configFile]);
          var config = readJsonFile(configFile);
          assert.equal('string', typeof config.apiURL);
          assert.equal('string', typeof config.accessToken);
          assert.equal('object', typeof config.organization);
          assert.equal('string', typeof config.organization.guid);
          assert.equal('string', typeof config.organization.name);
          assert.equal('object', typeof config.space);
          assert.equal('string', typeof config.space.guid);
          assert.equal('string', typeof config.space.name);
        });
    }
  );

  itSkipIf(!process.env.BLUEMIX_EMAIL || !process.env.BLUEMIX_PASSWORD)(
    'should login with SSO passcode', function(done) {
      return helpers.run(path.join(__dirname, '../bluemix'))
        .cd(SANDBOX)
        .withPrompts({
          password: process.env.BLUEMIX_PASSCODE,
          rememberMe: true,
          tryAgain: false,
        })
        .withOptions({
          force: true,
          sso: true,
        })
        .then(function() {
          var configFile = path.join(os.homedir(), '.bluemix/.loopback/config.json');
          ygAssert.file([configFile]);
          var config = readJsonFile(configFile);
          assert.equal('string', typeof config.apiURL);
          assert.equal('string', typeof config.accessToken);
          assert.equal('object', typeof config.organization);
          assert.equal('string', typeof config.organization.guid);
          assert.equal('string', typeof config.organization.name);
          assert.equal('object', typeof config.space);
          assert.equal('string', typeof config.space.guid);
          assert.equal('string', typeof config.space.name);
        });
    }
  );
});

function readJsonFile(filePath) {
  var fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}
