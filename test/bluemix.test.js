// Copyright IBM Corp. 2014,2016. All Rights Reserved.
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
var SANDBOX =  path.resolve(__dirname, 'sandbox');

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
  beforeEach(common.resetWorkspace);

  beforeEach(function(done) {
    fs.ensureDir(SANDBOX, function() {
      process.chdir(SANDBOX);
      common.createDummyProject(SANDBOX, 'test-app', done);
    });
  });

  afterEach(function(done) {
    process.chdir('/');
    rimraf(SANDBOX, done);
  });

  it('should generate datasources.bluemix.js', function(done) {
    var gen = givenBluemixGenerator('--force --bluemix');
    helpers.mockPrompt(gen, {
      enableManifest: false,
    });
    gen.run(function() {
      ygAssert.file('./server/datasources.bluemix.js');
      done();
    });
  });

  it('should generate .bluemix/datasources-config.json', function(done) {
    var gen = givenBluemixGenerator('--force --bluemix');
    helpers.mockPrompt(gen, {
      enableManifest: false,
    });
    gen.run(function() {
      ygAssert.file('.bluemix/datasources-config.json');
      done();
    });
  });

  it('should generate all basic Bluemix files', function(done) {
    var gen = givenBluemixGenerator('--force --bluemix');
    helpers.mockPrompt(gen, {
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
    });
    gen.run(function() {
      ygAssert.file(BASIC_BLUEMIX_FILES.concat(DOCKER_FILES)
      .concat(TOOLCHAIN_FILES));
      done();
    });
  });

  it('should generate only basic Bluemix files', function(done) {
    var gen = givenBluemixGenerator('--force --bluemix');
    helpers.mockPrompt(gen, {
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
    });
    gen.run(function() {
      ygAssert.file(BASIC_BLUEMIX_FILES);
      ygAssert.file('manifest.yml');
      ygAssert.noFile(DOCKER_FILES);
      ygAssert.noFile(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate only Docker files', function(done) {
    var gen = givenBluemixGenerator('--force --docker');
    helpers.mockPrompt(gen);
    gen.run(function() {
      ygAssert.noFile(BASIC_BLUEMIX_FILES);
      ygAssert.file(DOCKER_FILES);
      ygAssert.noFile(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate only toolchain files', function(done) {
    var gen = givenBluemixGenerator('--force --toolchain');
    helpers.mockPrompt(gen);
    gen.run(function() {
      ygAssert.noFile(BASIC_BLUEMIX_FILES);
      ygAssert.noFile(DOCKER_FILES);
      ygAssert.file(TOOLCHAIN_FILES);
      done();
    });
  });

  it('should generate manifest file', function(done) {
    var gen = givenBluemixGenerator('--force --manifest');
    helpers.mockPrompt(gen, {
      appMemory: '1g',
      appInstances: 7,
      appDomain: 'my.blue.mix.net',
      appHost: 'cool.app',
      appDiskQuota: '512M',
    });
    gen.run(function() {
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
      done();
    });
  });

  itSkipIf(!process.env.BLUEMIX_EMAIL || !process.env.BLUEMIX_PASSWORD)(
  'should login with user/password', function(done) {
    var gen = givenBluemixGenerator('--force --login');
    helpers.mockPrompt(gen, {
      email: process.env.BLUEMIX_EMAIL,
      password: process.env.BLUEMIX_PASSWORD,
      rememberMe: true,
      tryAgain: false,
    });
    gen.run(function() {
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
      done();
    });
  });

  itSkipIf(!process.env.BLUEMIX_EMAIL || !process.env.BLUEMIX_PASSWORD)(
  'should login with SSO passcode', function(done) {
    var gen = givenBluemixGenerator('--force --sso');
    helpers.mockPrompt(gen, {
      password: process.env.BLUEMIX_PASSCODE,
      rememberMe: true,
      tryAgain: false,
    });
    gen.run(function() {
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
      done();
    });
  });
});

function givenBluemixGenerator(args) {
  var name = 'loopback:bluemix';
  var genPath = path.join(__dirname, '..', 'bluemix');
  var gen = common.createGenerator(name, genPath, [], args, {});
  gen.options['skip-install'] = true;
  return gen;
}

function readJsonFile(filePath) {
  var fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}
