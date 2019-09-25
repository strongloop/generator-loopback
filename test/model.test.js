// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var fs = require('fs-extra');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var wsModels = require('loopback-workspace').models;
var common = require('./common');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

describe('loopback:model generator', function() {
  process.env.LB_CLI_SKIP_PROPERTY = true;
  beforeEach(common.resetWorkspace);

  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  beforeEach(function addRestDataSource(done) {
    wsModels.DataSourceDefinition.create({
      name: 'rest',
      connector: 'rest',
      facetName: 'server',
    }, done);
  });

  it('creates common/models/{name}.json', function() {
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'Product',
        plural: 'pds',
        dataSource: 'db',
      }).then(function() {
        var content = readProductJsonSync();
        expect(content).to.have.property('name', 'Product');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('plural', 'pds');
      });
  });

  it('adds an entry to server/models.json', function() {
    var builtinModels = Object.keys(readModelsJsonSync('server'));
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'Product',
        dataSource: 'db',
        public: false,
      }).then(function() {
        var modelConfig = readModelsJsonSync('server');
        var newModels = Object.keys(modelConfig);
        var expectedModels = builtinModels.concat(['Product']);
        expect(newModels).to.have.members(expectedModels);
        expect(modelConfig.Product).to.eql({
          dataSource: 'db',
          public: false,
        });
      });
  });

  it('sets `base` option from the list', function() {
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'Product',
        dataSource: 'db',
        base: 'PersistedModel',
      }).then(function() {
        var product = readProductJsonSync();
        expect(product).to.have.property('base', 'PersistedModel');
      });
  });

  it('sets `dataSource` option to db by default', function() {
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'Product',
      }).then(function() {
        var product = readProductJsonSync();
        expect(product).to.have.property('base', 'PersistedModel');
        var modelConfig = readModelsJsonSync();
        expect(modelConfig.Product.dataSource).to.eql('db');
      });
  });

  it('sets custom `base` option', function() {
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'Product',
        dataSource: 'rest',
        base: null,
        customBase: 'CustomModel',
      }).then(function() {
        var product = readProductJsonSync();
        expect(product).to.have.property('base', 'CustomModel');
      });
  });

  it('honors the model name in arg', function() {
    return helpers.run(path.join(__dirname, '../model'))
      .cd(SANDBOX)
      .withArguments(['AdvancedProduct'])
      .withPrompts({
        dataSource: 'db',
        base: 'Product',
      }).then(function() {
        var product = readAdvancedProductJsonSync();
        expect(product).to.have.property('base', 'Product');
      });
  });

  describe('in an empty project', function() {
    beforeEach(common.resetWorkspace);
    beforeEach(function createSandbox(done) {
      helpers.testDirectory(SANDBOX, done);
    });
    beforeEach(function(done) {
      process.env.WORKSPACE_DIR = SANDBOX;
      Workspace.createFromTemplate('empty-server', 'empty', done);
    });

    it('should set dataSource to null', function() {
      return helpers.run(path.join(__dirname, '../model'))
        .cd(SANDBOX)
        .withPrompts({
          name: 'Product',
          plural: 'pds',
        }).then(function() {
          var modelConfig = readModelsJsonSync();
          expect(modelConfig.Product.dataSource).to.eql(null);
          var product = readProductJsonSync();
          expect(product).to.have.property('base', 'Model');
        });
    });

    it('should set dataSource to 1st one if db does not exist', function() {
      return wsModels.DataSourceDefinition.create({
        name: 'db1',
        connector: 'memory',
        facetName: 'server',
      }).then(returnResult);

      function returnResult() {
        return helpers.run(path.join(__dirname, '../model'))
          .cd(SANDBOX)
          .withPrompts({
            name: 'Review',
            plural: 'Reviews',
          }).then(function() {
            var modelConfig = readModelsJsonSync();
            expect(modelConfig.Review.dataSource).to.eql('db1');
          });
      }
    });

    it('should set dataSource to db if it exists', function() {
      return new Promise(function(resolve, reject) {
        wsModels.DataSourceDefinition.create([{
          name: 'db1',
          connector: 'memory',
          facetName: 'server',
        }, {
          name: 'db',
          connector: 'memory',
          facetName: 'server',
        }], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(returnResult());
          }
        });
      });

      function returnResult() {
        return helpers.run(path.join(__dirname, '../model'))
          .cd(SANDBOX)
          .withPrompts({
            name: 'Review',
            plural: 'Reviews',
          }).then(function() {
            var modelConfig = readModelsJsonSync();
            expect(modelConfig.Review.dataSource).to.eql('db');
          });
      }
    });

    describe('with --bluemix', function() {
      it('should not throw if no Bluemix datasources are found',
        function() {
          var srcPath = path.join(__dirname, 'fixtures',
            'datasources-config-empty.json');
          var destPath = path.join(SANDBOX, '.bluemix',
            'datasources-config.json');
          fs.copySync(srcPath, destPath);

          const ctx = helpers.run(path.join(__dirname, '../model'));
          return ctx.cd(SANDBOX)
            .withPrompts({
              name: 'Product',
            })
            .withOptions({
              bluemix: true,
              login: false,
            })
            .then(function() {
              expect(ctx.generator.abort).to.equal(true);
            });
        });

      it('should not throw on parsing datasources-config.json', function() {
        var srcPath = path.join(__dirname, 'fixtures',
          'datasources-config-empty.json');
        var destPath = path.join(SANDBOX, '.bluemix',
          'datasources-config.json');
        fs.copySync(srcPath, destPath);
        fs.writeFileSync(destPath, '');

        const ctx = helpers.run(path.join(__dirname, '../model'));
        return ctx.cd(SANDBOX)
          .withPrompts({
            name: 'Product',
          })
          .withOptions({
            bluemix: true,
            login: false,
          })
          .then(function() {
            expect(ctx.generator.abort).to.equal(true);
          });
      });

      it('should use Bluemix datasource', function() {
        var srcPath = path.join(__dirname, 'fixtures',
          'datasources-config-filled.json');
        var destPath = path.join(SANDBOX, '.bluemix',
          'datasources-config.json');
        fs.copySync(srcPath, destPath);

        const ctx = helpers.run(path.join(__dirname, '../model'));
        return ctx.cd(SANDBOX)
          .withPrompts({
            name: 'Product',
            dataSource: 'cloudant-demo-service',
          })
          .withOptions({
            bluemix: true,
            login: false,
          })
          .then(function() {
            // eslint-disable-next-line max-len
            assert('cloudant-demo-service' in ctx.generator.bluemixDataSourcesList);
            var modelConfig = readModelsJsonSync();
            expect(modelConfig.Product.dataSource).to
              .eql('cloudant-demo-service');
          });
      });
    });
  });

  function readProductJsonSync() {
    var productJson = path.resolve(SANDBOX, 'common/models/product.json');
    expect(fs.existsSync(productJson), 'file exists');
    return JSON.parse(fs.readFileSync(productJson));
  }

  function readAdvancedProductJsonSync() {
    var advancedProductJson = path.resolve(SANDBOX, 'common/models/advanced-product.json');
    expect(fs.existsSync(advancedProductJson), 'file exists');
    return JSON.parse(fs.readFileSync(advancedProductJson));
  }

  function readModelsJsonSync(facet) {
    facet = facet || 'server';
    var filepath = path.resolve(SANDBOX, facet, 'model-config.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
