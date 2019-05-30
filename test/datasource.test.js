// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('chai').expect;
var common = require('./common');
var lbBM = require('loopback-bluemix');
var cfConfig = lbBM.cf.getCfConfig();

describe('loopback:datasource generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  it('adds an entry to server/datasources.json', function() {
    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'crm',
        customConnector: '', // temporary workaround for
        // https://github.com/yeoman/generator/issues/600
        connector: 'mysql',
        installConnector: false,
      }).then(function() {
        var newSources = Object.keys(readDataSourcesJsonSync('server'));
        var expectedSources = builtinSources.concat(['crm']);
        expect(newSources).to.have.members(expectedSources);
      });
  });

  it('allow connector without settings', function() {
    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'kafka1',
        customConnector: '', // temporary workaround for
        // https://github.com/yeoman/generator/issues/600
        connector: 'kafka',
        installConnector: false,
      }).then(function() {
        var newSources = Object.keys(readDataSourcesJsonSync('server'));
        var expectedSources = builtinSources.concat(['kafka1']);
        expect(newSources).to.have.members(expectedSources);
      });
  });

  it('should install connector module on demand', function() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'rest0',
        connector: 'rest',
        // workaround for `node_modules` not created
        installConnector: false,
      }).then(function() {
        var pkg = fs.readFileSync(
          path.join(SANDBOX, 'package.json'), 'UTF-8'
        );
        pkg = JSON.parse(pkg);
        // eslint-disable-next-line no-unused-expressions
        expect(pkg.dependencies['loopback-connector-rest']).to.exist;
      });
  });

  // FIXME(jannyHou) This test fails because folder `node_modules` is not created.
  // For now, verify this functionality manually by choosing "install connector"
  // and checking that the custom module is installed.
  it.skip('should support custom connector', function() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'test-custom',
        customConnector: 'lodash',
        connector: 'other',
      }).then(function() {
        var pkg = fs.readFileSync(
          path.join(SANDBOX, 'package.json'), 'UTF-8'
        );
        pkg = JSON.parse(pkg);
        // eslint-disable-next-line no-unused-expressions
        expect(pkg.dependencies.lodash).to.exist;
      });
  });

  it('should support object/array settings', function() {
    var restOptions = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    };
    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'rest1',
        customConnector: '', // temporary workaround for
        // https://github.com/yeoman/generator/issues/600
        connector: 'rest',
        options: JSON.stringify(restOptions),
        operations: '[]',
        installConnector: false,
      }).then(function() {
        var json = readDataSourcesJsonSync('server');
        var newSources = Object.keys(json);
        var expectedSources = builtinSources.concat(['rest1']);
        expect(newSources).to.have.members(expectedSources);
        expect(json.rest1.options).to.eql(restOptions);
        expect(json.rest1.operations).to.eql([]);
      });
  });

  it('should support MongoDB', function() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'mongodb-datasource',
        connector: 'mongodb',
        installConnector: false,
      }).then(function() {
        var datasources = readDataSourcesJsonSync('server');
        expect(datasources['mongodb-datasource']).to.be.an('object');
        var ds = datasources['mongodb-datasource'];
        expect(ds.name).to.equal('mongodb-datasource');
        expect(ds.connector).to.equal('mongodb');
        var pkg = readPackageJson();
        expect(pkg.dependencies['loopback-connector-mongodb'])
          .to.be.a('string');
      });
  });

  it('should support Cloudant', function() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'cloudant-datasource',
        connector: 'cloudant',
        installConnector: false,
      }).then(function() {
        var datasources = readDataSourcesJsonSync('server');
        expect(datasources['cloudant-datasource']).to.be.an('object');
        var ds = datasources['cloudant-datasource'];
        expect(ds.name).to.equal('cloudant-datasource');
        expect(ds.connector).to.equal('cloudant');
        var pkg = readPackageJson();
        expect(pkg.dependencies['loopback-connector-cloudant'])
          .to.be.a('string');
      });
  });

  it('should support IBM Object Storage', function() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'My-Object-Storage',
        connector: 'ibm-object-storage',
        installConnector: false,
      }).then(function() {
        var datasources = readDataSourcesJsonSync('server');
        expect(datasources['My-Object-Storage']).to.be.an('object');
        var ds = datasources['My-Object-Storage'];
        expect(ds.name).to.equal('My-Object-Storage');
        expect(ds.connector).to.equal('loopback-component-storage');
        expect(ds.provider).to.equal('openstack');
        expect(ds.useServiceCatalog).to.equal(true);
        expect(ds.useInternal).to.equal(false);
        expect(ds.keystoneAuthVersion).to.equal('v3');
        var pkg = readPackageJson();
        expect(pkg.dependencies['loopback-component-storage'])
          .to.be.a('string');
      });
  });

  if (Object.keys(cfConfig).length) {
    describe('with --bluemix', function() {
      it('should not install connector in a non-Bluemix dir', function() {
        var ctx = helpers.run(path.join(__dirname, '../datasource'));
        return ctx.cd(SANDBOX)
          .withPrompts()
          .withOptions({bluemix: true})
          .then(function() {
            expect(ctx.generator.abort).to.equal(true);
          });
      });

      // this test requires an IBM Object Storage service named "My-Object-Storage" to be provisioned already
      it('should not try to bind a service despite error', function() {
        return helpers.run(path.join(__dirname, '../app'))
          .cd(SANDBOX)
          .withPrompts({
            appname: 'test-app',
            template: 'api-server',
            appMemory: '512M',
            appInstances: 1,
            appDomain: 'mybluemix.net',
            appHost: 'test-app',
            appDiskQuota: '512M',
            enableDocker: true,
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
            var ctx = helpers.run(path.join(__dirname, '../datasource'));
            ctx.abort = true;
            return ctx.cd(SANDBOX)
              .withPrompts({
                serviceName: 'My-Object-Storage',
                connector: 'loopback-component-storage',
                installConnector: false,
              })
              .withOptions({
                bluemix: true,
              })
              .then(function() {
                expect(ctx.generator.serviceBindingStatus).to.equal('unbound');
              });
          });
      });
      // FIXME(jannyHou)
      // this test requires an IBM Object Storage service named "My-Object-Storage" to be provisioned already
      it.skip('should support IBM Object Storage ', function() {
        return helpers.run(path.join(__dirname, '../app'))
          .cd(SANDBOX)
          .withPrompts({
            appname: 'test-app',
            template: 'api-server',
            appMemory: '512M',
            appInstances: 1,
            appDomain: 'mybluemix.net',
            appHost: 'test-app',
            appDiskQuota: '512M',
            enableDocker: true,
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
            var testDir = SANDBOX + '/test-app';
            return helpers.run(path.join(__dirname, '../datasource'))
              .cd(testDir)
              .withPrompts({
                serviceName: 'My-Object-Storage',
                connector: 'loopback-component-storage',
                installConnector: false,
              })
              .withOptions({
                bluemix: true,
              })
              .then(function() {
                // eslint-disable-next-line max-len
                var datasources = Object.keys(readDataSourcesJsonSync('server'));
                expect(datasources).to.not.include('ds-object-storage');
                var pkg = fs.readFileSync(
                  path.join(SANDBOX, 'test-app', 'package.json'), 'UTF-8'
                );
                pkg = JSON.parse(pkg);
                // eslint-disable-next-line no-unused-expressions
                expect(pkg.dependencies['loopback-component-storage']).to.exist;
                var dsConf = fs.readFileSync(path.join(SANDBOX, 'test-app',
                  '.bluemix', 'datasources-config.json'), 'UTF-8');
                dsConf = JSON.parse(dsConf);
                // eslint-disable-next-line no-unused-expressions
                expect(dsConf.datasources['My-Object-Storage']).to.exist;
                expect(dsConf.datasources['My-Object-Storage'].name)
                  .to.equal('My-Object-Storage');
                expect(dsConf.datasources['My-Object-Storage'].connector)
                  .to.equal('loopback-component-storage');
              });
          });
      });
    });
  }

  function readDataSourcesJsonSync(facet) {
    var filepath = path.resolve(SANDBOX, facet || 'server', 'datasources.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }

  function readPackageJson() {
    var pkg = fs.readFileSync(path.join(SANDBOX, 'package.json'), 'UTF-8');
    return JSON.parse(pkg);
  }
});
