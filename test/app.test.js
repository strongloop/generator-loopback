// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var semver = require('semver');
var ygAssert = require('yeoman-assert');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var common = require('./common');
var assert = require('assert');
var expect = require('chai').expect;
var fs = require('fs');
var rimraf = require('rimraf');

describe('loopback:app generator', function() {
  this.timeout(30 * 60 * 1000); // 30 minutes
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  // This is a simple smoke test to execute all generator steps
  // Since most of the heavy lifting is done by loopback-workspace,
  // we don't have to test it again.

  var EXPECTED_PROJECT_FILES = [
    '.gitignore',
    'package.json',

    'server/config.json',
    'server/datasources.json',
    'server/model-config.json',
    'server/server.js',

    'client/README.md',
  ];

  var EXPECTED_BLUEMIX_FILES = [
    '.bluemix/datasources-config.json',
    '.bluemix/deploy.json',
    '.bluemix/pipeline.yml',
    '.bluemix/toolchain.yml',

    'server/datasources.bluemix.js',

    '.cfignore',
    '.dockerignore',
    'Dockerfile',
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

  it('creates expected files', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'test-app',
        template: 'api-server',
      }).withOptions({
        'skip-install': true,
      }).then(function() {
        ygAssert.file(EXPECTED_PROJECT_FILES);
      });
  });

  it('creates the project in a subdirectory if asked to', function() {
    const ctx = helpers.run(path.join(__dirname, '../app'));
    return ctx
      .cd(SANDBOX)
      .withPrompts({
        appname: 'test-app',
        template: 'api-server',
        dir: 'test-dir',
      }).withOptions({
        'skip-install': true,
      }).then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);

        var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
          return 'test-dir/' + f;
        });
        ygAssert.file(expectedFiles);
        assert.equal(ctx.generator.dir, 'test-dir');
      });
  });

  it('normalizes the appname with .', function() {
    var cwdName = 'x.y';
    var expectedAppName = 'x-y';
    return testAppNameNormalization(cwdName, expectedAppName);
  });

  it('normalizes the appname with space', function() {
    var cwdName = 'x y';
    var expectedAppName = 'x-y';
    return testAppNameNormalization(cwdName, expectedAppName);
  });

  it('normalizes the appname with @', function() {
    var cwdName = 'x@y';
    var expectedAppName = 'x-y';
    return testAppNameNormalization(cwdName, expectedAppName);
  });

  it('should create .yo-rc.json', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        dir: '.',
      }).then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);
        var yoRcPath = path.resolve(SANDBOX, '.yo-rc.json');
        assert(fs.existsSync(yoRcPath), 'file exists');
      });
  });

  it('includes explorer by default', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        dir: '.',
      }).then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);
        var compConfig = common.readJsonSync('server/component-config.json', {});
        expect(Object.keys(compConfig))
          .to.contain('loopback-component-explorer');
      });
  });

  it('excludes explorer with --no-explorer', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        dir: '.',
      }).withOptions({
        explorer: false,
      }).then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);
        var compConfig = common.readJsonSync('server/component-config.json', {});
        expect(Object.keys(compConfig))
          .to.not.contain('loopback-component-explorer');
      });
  });

  it('scaffolds 3.x app when loopbackVersion is 3.x', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'test-app',
        template: 'api-server',
        loopbackVersion: '3.x',
      }).then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);
        var pkg = common.readJsonSync('package.json', {});
        expect(semver.gtr('3.0.0', pkg.dependencies.loopback)).to.equal(false);
      });
  });

  it('scaffolds 3.x app when options.loopbackVersion is 3.x', function() {
    return helpers.run(path.join(__dirname, '../app'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'test-app',
        template: 'api-server',
      })
      .withOptions({loopbackVersion: '3.x'})
      .then(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);
        var pkg = common.readJsonSync('package.json', {});
        expect(semver.gtr('3.0.0', pkg.dependencies.loopback)).to.equal(false);
      });
  });

  it('scaffolds 3.x app with loopbackVersion "3.x" and template "notes"',
    function() {
      return helpers.run(path.join(__dirname, '../app'))
        .cd(SANDBOX)
        .withPrompts({
          name: 'test-app',
        })
        .withOptions({
          loopbackVersion: '3.x',
          template: 'notes',
        })
        .then(function() {
          // generator calls `chdir` on change of the destination root
          process.chdir(SANDBOX);
          var notes = common.readJsonSync('common/models/note.json', {});
          expect(notes).to.have.property('name', 'Note');
        });
    });

  it('reports error if options.loopbackVersion is invalid',
    function() {
      var ctx = helpers.run(path.join(__dirname, '../app'));
      return ctx
        .cd(SANDBOX)
        .withPrompts({
          name: 'test-app',
          template: 'api-server',
        })
        .withOptions({
          loopbackVersion: 'invalid-version',
        }).catch(function(err) {
          expect(err.message).to.eql(
            'Invalid LoopBack version: invalid-version. ' +
            'Available versions are 3.x.'
          );
          ctx.generator.emit('end');
        });
    });

  it('reports error if options.template is invalid',
    function() {
      var ctx = helpers.run(path.join(__dirname, '../app'));
      return ctx
        .cd(SANDBOX)
        .withPrompts({
          name: 'test-app',
        })
        .withOptions({
          loopbackVersion: '3.x',
          template: 'invalid-template',
        }).catch(function(err) {
          expect(err.message).to.eql(
            'Invalid template: invalid-template. Available templates for 3.x ' +
            'are api-server, empty-server, hello-world, notes'
          );
          ctx.generator.emit('end');
        });
    });

  it('exports workspace version', () => {
    const mainProps = Object.assign({}, require('../'));
    expect(mainProps).to.have.property('workspaceVersion',
      require('loopback-workspace/package.json').version);
  });

  describe('Bluemix integration', function() {
    it('should create all Bluemix files', function() {
      return helpers.run(path.join(__dirname, '../app'))
        .cd(SANDBOX)
        .withPrompts({
          name: 'test-app',
          template: 'api-server',
          appname: 'cool-app',
          template: 'api-server',
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
          'skip-install': true,
          bluemix: true,
          login: false,
        })
        .then(function() {
          ygAssert.file(EXPECTED_PROJECT_FILES.concat(EXPECTED_BLUEMIX_FILES));
          ygAssert.fileContent('./manifest.yml', fs.readFileSync(path.join(__dirname, 'fixtures', 'manifest.yml'), 'utf8'));
        });
    });

    it('should omit Docker files', function() {
      return helpers.run(path.join(__dirname, '../app'))
        .cd(SANDBOX)
        .withPrompts({
          appname: 'test-app',
          template: 'api-server',
          appMemory: '512M',
          appInstances: 1,
          appDomain: 'mybluemix.net',
          appHost: 'test-app',
          appDiskQuota: '1024M',
          enableDocker: false,
          enableToolchain: true,
          enableAutoScaling: true,
          enableAppMetrics: true,
        })
        .withOptions({
          'skip-install': true,
          'bluemix': true,
          'login': false,
        })
        .then(function() {
          ygAssert.noFile(DOCKER_FILES);
        });
    });

    it('should ommit Toolchain files', function() {
      return helpers.run(path.join(__dirname, '../app'))
        .cd(SANDBOX)
        .withPrompts({
          appname: 'test-app',
          template: 'api-server',
          appMemory: '512M',
          appInstances: 1,
          appDomain: 'mybluemix.net',
          appHost: 'test-app',
          appDiskQuota: '1024M',
          enableDocker: false,
          enableToolchain: false,
          enableAutoScaling: true,
          enableAppMetrics: true,
        })
        .withOptions({
          'skip-install': true,
          'bluemix': true,
          'login': false,
        })
        .then(function() {
          ygAssert.file('.bluemix/datasources-config.json');
          ygAssert.noFile(TOOLCHAIN_FILES);
        });
    });
  });
  function testAppNameNormalization(cwdName, expectedAppName) {
    var dir = path.join(SANDBOX, cwdName);

    return new Promise(function(resolve, reject) {
      helpers.testDirectory(dir, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(returnResult());
        }
      });
    });

    function returnResult() {
      return helpers.run(path.join(__dirname, '../app'))
        .cd(dir)
        .withPrompts({
          wsTemplate: 'api-server',
        }).then(function() {
          // generator calls `chdir` on change of the destination root
          process.chdir(SANDBOX);

          var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
            return cwdName + '/x-y/' + f;
          });
          ygAssert.file(expectedFiles);
          var pkg = require(path.join(dir, '/x-y/package.json'));
          assert.equal(pkg.name, expectedAppName);
        });
    }
  }
});
