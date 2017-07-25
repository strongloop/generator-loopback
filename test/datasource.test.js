// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var SANDBOX =  path.resolve(__dirname, 'sandbox');
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

  it('adds an entry to server/datasources.json', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'crm',
      customConnector: '', // temporary workaround for
                           // https://github.com/yeoman/generator/issues/600
      connector: 'mysql',
      installConnector: false,
    });

    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    datasourceGen.run(function() {
      var newSources = Object.keys(readDataSourcesJsonSync('server'));
      var expectedSources = builtinSources.concat(['crm']);
      expect(newSources).to.have.members(expectedSources);
      done();
    });
  });

  it('allow connector without settings', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'kafka1',
      customConnector: '', // temporary workaround for
                           // https://github.com/yeoman/generator/issues/600
      connector: 'kafka',
      installConnector: false,
    });

    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    datasourceGen.run(function() {
      var newSources = Object.keys(readDataSourcesJsonSync('server'));
      var expectedSources = builtinSources.concat(['kafka1']);
      expect(newSources).to.have.members(expectedSources);
      done();
    });
  });

  it('should install connector module on demand', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'rest0',
      customConnector: '', // temporary workaround for
                           // https://github.com/yeoman/generator/issues/600
      connector: 'rest',
    });

    datasourceGen.run(function() {
      var pkg = fs.readFileSync(
        path.join(SANDBOX, 'package.json'), 'UTF-8');
      pkg = JSON.parse(pkg);
      // eslint-disable-next-line no-unused-expressions
      expect(pkg.dependencies['loopback-connector-rest']).to.exist;
      done();
    });
  });

  it('should support custom connector', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'test-custom',
      customConnector: 'lodash',
      connector: 'other',
    });

    datasourceGen.run(function() {
      var pkg = fs.readFileSync(
        path.join(SANDBOX, 'package.json'), 'UTF-8');
      pkg = JSON.parse(pkg);
      // eslint-disable-next-line no-unused-expressions
      expect(pkg.dependencies.lodash).to.exist;
      done();
    });
  });

  it('should support object/array settings', function(done) {
    var restOptions = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    };
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'rest1',
      customConnector: '', // temporary workaround for
                           // https://github.com/yeoman/generator/issues/600
      connector: 'rest',
      options: JSON.stringify(restOptions),
      operations: '[]',
      installConnector: false,
    });

    var builtinSources = Object.keys(readDataSourcesJsonSync('server'));
    datasourceGen.run(function() {
      var json = readDataSourcesJsonSync('server');
      var newSources = Object.keys(json);
      var expectedSources = builtinSources.concat(['rest1']);
      expect(newSources).to.have.members(expectedSources);
      expect(json.rest1.options).to.eql(restOptions);
      expect(json.rest1.operations).to.eql([]);
      done();
    });
  });

  it('should support MongoDB', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'mongodb-datasource',
      connector: 'mongodb',
      installConnector: false,
    });

    datasourceGen.run(function() {
      var datasources = readDataSourcesJsonSync('server');
      expect(datasources['mongodb-datasource']).to.be.an('object');
      var ds = datasources['mongodb-datasource'];
      expect(ds.name).to.equal('mongodb-datasource');
      expect(ds.connector).to.equal('mongodb');
      var pkg = readPackageJson();
      expect(pkg.dependencies['loopback-connector-mongodb']).to.be.a('string');
      done();
    });
  });

  it('should support Cloudant', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'cloudant-datasource',
      connector: 'cloudant',
      installConnector: false,
    });

    datasourceGen.run(function() {
      var datasources = readDataSourcesJsonSync('server');
      expect(datasources['cloudant-datasource']).to.be.an('object');
      var ds = datasources['cloudant-datasource'];
      expect(ds.name).to.equal('cloudant-datasource');
      expect(ds.connector).to.equal('cloudant');
      var pkg = readPackageJson();
      expect(pkg.dependencies['loopback-connector-cloudant']).to.be.a('string');
      done();
    });
  });

  it('should support IBM Object Storage', function(done) {
    var datasourceGen = givenDataSourceGenerator();
    helpers.mockPrompt(datasourceGen, {
      name: 'My-Object-Storage',
      connector: 'ibm-object-storage',
      installConnector: false,
    });

    datasourceGen.run(function() {
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
      expect(pkg.dependencies['loopback-component-storage']).to.be.a('string');
      done();
    });
  });

  if (Object.keys(cfConfig).length) {
    describe('with --bluemix', function() {
      it('should not install connector in a non-Bluemix dir', function(done) {
        var datasourceGen = givenDataSourceGenerator('--bluemix');
        datasourceGen.run(function() {
          expect(datasourceGen.abort).to.eql(true);
          done();
        });
      });

      // this test requires an IBM Object Storage service named "My-Object-Storage" to be provisioned already
      it('should not try to bind a service despite error', function(done) {
        var appGen = givenAppGenerator();

        helpers.mockPrompt(appGen, {
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
        });

        appGen.options['skip-install'] = true;
        appGen.options['bluemix'] = true;
        appGen.options['login'] = false;

        appGen.run(function() {
          var datasourceGen = givenDataSourceGenerator('--bluemix', '../../../datasource');
          datasourceGen.abort = true;
          helpers.mockPrompt(datasourceGen, {
            serviceName: 'My-Object-Storage',
            connector: 'loopback-component-storage',
            installConnector: false,
          });
          datasourceGen.run(function() {
            expect(datasourceGen.serviceBindingStatus).to.equal('unbound');
            done();
          });
        });
      });

      // this test requires an IBM Object Storage service named "My-Object-Storage" to be provisioned already
      it('should support IBM Object Storage ', function(done) {
        var appGen = givenAppGenerator();

        helpers.mockPrompt(appGen, {
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
        });

        appGen.options['skip-install'] = true;
        appGen.options['bluemix'] = true;
        appGen.options['login'] = false;

        appGen.run(function() {
          var datasourceGen = givenDataSourceGenerator('--bluemix', '../../../datasource');
          helpers.mockPrompt(datasourceGen, {
            serviceName: 'My-Object-Storage',
            connector: 'loopback-component-storage',
            installConnector: false,
          });

          datasourceGen.run(function() {
            var datasources = Object.keys(readDataSourcesJsonSync('server'));
            expect(datasources).to.not.include('ds-object-storage');
            var pkg = fs.readFileSync(
              path.join(SANDBOX, 'test-app', 'package.json'), 'UTF-8');
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
            done();
          });
        });
      });
    });
  }

  function givenAppGenerator(args) {
    var name = 'loopback:app';
    var appPath = '../../app';
    var gen = common.createGenerator(name, appPath, [], args, {});
    gen.options['skip-install'] = true;
    return gen;
  }

  function givenDataSourceGenerator(dsArgs, _dsPath) {
    var dsPath = _dsPath || '../../datasource';
    var name = 'loopback:datasource';
    var gen = common.createGenerator(name, dsPath, [], dsArgs, {});
    return gen;
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
