/*global describe, before, it */
'use strict';
var fs = require('fs-extra');
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX = path.resolve(__dirname, 'sandbox');
var common = require('./common');
var wsModels = require('loopback-workspace').models;
var expect = require('chai').expect;

describe('loopback:example generator', function() {
  this.timeout(10000);

  describe('output project', function() {
    before(common.resetWorkspace);
    before(function createSandbox(done) {
      helpers.testDirectory(SANDBOX, done);
    });

    before(function runGenerator(done) {
      var gen = common.createExampleGenerator();
      helpers.mockPrompt(gen, {
        dir: '.'
      });

      gen.run(done);
    });

    it('has name "loopback-example-app"', function() {
      var pkg = JSON.parse(fs.readFileSync(
        path.resolve(SANDBOX, 'package.json')));
      expect(pkg.name).to.equal('loopback-example-app');
    });

    it('has all model definitions', function(done) {
      wsModels.ModelDefinition.find(function(err, list) {
        if (err) return done(err);
        var names = list.map(function(m) { return m.name; });
        expect(names).to.have.members([
          'Car',
          'Customer',
          'Inventory',
          'Location',
          'Note'
        ]);
        done();
      });
    });

    describe('model "Car"', function() {
      var definition;
      before(function() {
        definition = readModelDefinition('car');
      });

      it('has expected properties', function() {
        expect(definition.properties).to.eql({
          id: { type: 'string', id: true },
          vin: { type: 'string' },
          year: { type: 'number' },
          make: { type: 'string' },
          model: { type: 'string' },
          image: { type: 'string' },
          carClass: { type: 'string' },
          color: { type: 'string' }
        });
      });

      it('has expected relations', function() {
        expect(definition.relations).to.eql({
          reservations: {
            'model': 'Reservation',
            'type': 'hasMany',
            'foreignKey': 'productId'
          }
        });
      });

      it('has expected Oracle config', function() {
        expect(definition.options).to.have.property('oracle');
        expect(definition.options.oracle).to.eql({
          schema: 'DEMO',
          table: 'PRODUCT'
        });
      });
    });

    describe('model "Customer"', function() {
      var definition;
      before(function() {
        definition = readModelDefinition('customer');
      });

      it('has expected properties', function() {
        expect(definition.properties).to.eql({
          id: {
            type: 'String',
            length: 20,
            id: true,
            oracle: {
              columnName: 'ID',
              dataType: 'VARCHAR2',
              dataLength: 20,
              nullable: 'N'
            }
          },
          name: {
            type: 'String',
            length: 40,
            oracle: {
              columnName: 'NAME',
              dataType: 'VARCHAR2',
              dataLength: 40,
              nullable: 'Y'
            }
          }
        });
      });

      it('has expected base class', function() {
        expect(definition).to.have.property('base', 'User');
      });

      it('has expected Oracle config', function() {
        expect(definition.options).to.have.property('oracle');
        expect(definition.options.oracle).to.eql({
          schema: 'BLACKPOOL',
          table: 'CUSTOMER'
        });
      });

      it('has expected options', function() {
        expect(definition).to.have.property('idInjection', false);
      });
    });

    describe('model "Inventory"', function() {
      var definition;
      before(function() {
        definition = readModelDefinition('inventory');
      });

      it('has expected plural option', function() {
        expect(definition).to.have.property('plural', 'inventory');
      });
    });

    it('has correct models configured for REST API', function() {
      var config = readModelConfig('server');
      expect(Object.keys(config)).to.eql([
        // models metadata - not a proper model, but still a key/value
        '_meta',
        // built-in models
        'AccessToken',
        'ACL',
        'RoleMapping',
        'Role',
        // application models
        'Car',
        'Customer',
        'Inventory',
        'Location',
        'Note',
      ]);
    });

    it('has "geo" datasource', function() {
      var config = readProjectFile('server', 'datasources.json');
      expect(Object.keys(config)).to.include('geo');
    });
  });

  function readModelDefinition(name) {
    return readProjectFile('common', 'models/' + name + '.json');
  }

  function readModelConfig(componentName) {
    return readProjectFile(componentName, 'model-config.json');
  }

  var glob = require('loopback-workspace/node_modules/glob');

  function readProjectFile(componentName, file) {
    try {
      return fs.readJsonFileSync(path.join(SANDBOX, componentName, file));
    } catch (err) {
      console.error('SANDBOX files', glob.sync('**', { cwd: SANDBOX }));
      throw err;
    }
  }

});
