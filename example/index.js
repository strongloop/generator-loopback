'use strict';
var async = require('async');
var chalk = require('chalk');
var debug = require('debug')('generator-loopback:example');
var format = require('util').format;
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yolog = require('yeoman-generator/lib/util/log')();
var util = require('util');
var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');

var debugLogger = createDebugLogger();

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.option('l', {
      desc: 'Print all steps executed',
      type: Boolean
    });

    this.option('skip-install', {
      desc: 'Do not install npm dependencies.',
      type: Boolean
    });

    // force all sub-generators to use our debug logger
    this.env.adapter.log = debugLogger;
    this.on('end', function() {
      // restore the logger
      this.env.adapter.log = this.log;
    }.bind(this));

    // Always overwrite existing files
    this.conflicter.force = true;
  },

  help: function() {
    return helpers.customHelp(this);
  },

  _isVerbose: function() {
    return !!this.options.l;
  },

  askForDestinationDir: actions.askForDestinationDir,

  initWorkspace: actions.initWorkspace,

  app: function() {
    this._logPart('Create initial project scaffolding');
    this._runGeneratorWithAnswers(
      'loopback:app',
      ['loopback-example-app'],
      { /* no answers */});
  },

  datasourceGeo: function() {
    this._createDatasource('geo', {
      connector: 'rest',
      operations: [
        {
          template: {
            'method': 'GET',
            'url': 'http://maps.googleapis.com/maps/api/geocode/{format=json}',
            'headers': {
              'accepts': 'application/json',
              'content-type': 'application/json'
            },
            'query': {
              'address': '{street},{city},{zipcode}',
              'sensor': '{sensor=false}'
            },
            'responsePath': '$.results[0].geometry.location'
          },
          functions: {
            'geocode': ['street', 'city', 'zipcode']
          }
        }
      ]
    });
  },

  modelCar: function() {
    this._createModel('Car', {
        id: { type: 'string', id: true },
        vin: { type: 'string' },
        year: { type: 'number' },
        make: { type: 'string' },
        model: { type: 'string' },
        image: { type: 'string' },
        carClass: { type: 'string' },
        color: { type: 'string' }
      },
      {
        relations: {
          reservations: {
            'model': 'Reservation',
            'type': 'hasMany',
            'foreignKey': 'productId'
          }
        },
        oracle: {
          schema: 'DEMO',
          table: 'PRODUCT'
        },
        mongodb: {
          collection: 'car'
        },
        mysql: {
          table: 'car'
        },
      });
  },

  modelCustomer: function() {
    this._createModel('Customer', {
        id: {
          type: 'String',
          length: 20,
          id: 1,
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
      },
      {
        base: 'User',
        idInjection: false,
        oracle: {
          schema: 'BLACKPOOL',
          table: 'CUSTOMER'
        },
        mongodb: {
          collection: 'customer'
        },
        mysql: {
          table: 'customer'
        },
      });
  },

  modelInventory: function() {
    this._createModel('Inventory', {
        id: {
          type: 'String',
          required: true,
          id: true,
          length: 20,
          oracle: {
            columnName: 'ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N'
          }
        },
        productId: {
          type: 'String',
          required: true,
          length: 20,
          oracle: {
            columnName: 'PRODUCT_ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N'
          }
        },
        locationId: {
          type: 'String',
          required: true,
          length: 20,
          oracle: {
            columnName: 'LOCATION_ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N'
          }
        },
        available: {
          type: 'Number',
          required: false,
          length: 22,
          oracle: {
            columnName: 'AVAILABLE',
            dataType: 'NUMBER',
            dataLength: 22,
            nullable: 'Y'
          }
        },
        total: {
          type: 'Number',
          required: false,
          length: 22,
          oracle: {
            columnName: 'TOTAL',
            dataType: 'NUMBER',
            dataLength: 22,
            nullable: 'Y'
          }
        }
      },
      {
        plural: 'inventory',
        idInjection: false,
        oracle: {
          schema: 'BLACKPOOL',
          table: 'INVENTORY'
        },
        mongodb: {
          collection: 'inventory'
        },
        mysql: {
          table: 'inventory'
        },
      });
  },

  modelLocation: function() {
    this._createModel('Location', {
        id: {
          type: 'String',
          length: 20,
          id: 1,
          oracle: {
            columnName: 'ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N'
          }
        },
        street: {
          type: 'String',
          required: false,
          length: 64,
          oracle: {
            columnName: 'STREET',
            dataType: 'VARCHAR2',
            dataLength: 64,
            nullable: 'Y'
          }
        },
        city: {
          type: 'String',
          required: false,
          length: 64,
          oracle: {
            columnName: 'CITY',
            dataType: 'VARCHAR2',
            dataLength: 64,
            nullable: 'Y'
          }
        },
        zipcode: {
          type: 'Number',
          required: false,
          length: 20,
          oracle: {
            columnName: 'ZIPCODE',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'Y'
          }
        },
        name: {
          type: 'String',
          required: false,
          length: 32,
          oracle: {
            columnName: 'NAME',
            dataType: 'VARCHAR2',
            dataLength: 32,
            nullable: 'Y'
          }
        },
        geo: {
          type: 'GeoPoint'
        }
      },
      {
        relations: {
          inventory: {
            type: 'hasMany',
            model: 'Inventory'
          }
        },
        idInjection: false,
        oracle: {
          schema: 'BLACKPOOL',
          table: 'LOCATION'
        },
        mongodb: {
          collection: 'location'
        },
        mysql: {
          table: 'location'
        },
      });
  },

  modelNote: function() {
    this._createModel('Note', { },
      {
        plural: 'notes',
        mongodb: {
          collection: 'note'
        },
        mysql: {
          table: 'note'
        },
      });
  },

  configureModels: function() {
    var done = this.async();
    this._logPart('Remove `User` from `rest/models.json`');
    wsModels.ModelConfig.findOne({
      where: {
        name: 'User',
        facetName: 'server'
      }
    }, function(err, model) {
      if (err) return done(err);
      if (!model) {
        debug('Configuration of `User` was not found in `rest` component.');
        return done();
      }
      model.destroy(done);
    });
  },

  addDependencies: function() {
    this._logPart('Add dependencies (connectors, async) to package.json');

    var packageJson = 'package.json';
    var pkg = JSON.parse(this.readFileAsString(packageJson));

    util._extend(pkg.dependencies, {
      'loopback-connector-rest': '^1.1.4',
      'async': '~0.9.0',
      'function-rate-limit': '~0.0.1'
    });

    pkg.optionalDependencies = pkg.optionalDependencies || {};
    util._extend(pkg.optionalDependencies, {
      'loopback-connector-oracle': '^1.2.1',
      'loopback-connector-mongodb': '^1.2.5',
      'loopback-connector-mysql': '^1.2.1',
    });

    this._logPart('Add dev dependencies to package.json');
    pkg.devDependencies = pkg.devDependencies || {};
    util._extend(pkg.devDependencies, {
      'supertest': '^0.13.0',
      'mocha': '^1.20.1'
    });

    this._logPart('Add `npm test` script to package.json');
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.test = 'mocha -R spec server/test';

    this.writeFileFromString(JSON.stringify(pkg, null, 2), packageJson);
  },

  copyFiles: function() {
    this._logPart('Copy source files');

    if (this._isVerbose()) {
      // restore the original logger (remove debug logger)
      this.env.adapter.log = this.log;
    }

    fs.unlink(path.resolve(this.projectDir, 'client', 'README.md'));
    this.directory('.', '.');

    // force yeoman to execute all copy operations now
    // the files are copied at the end by default
    this.conflicter.resolve(this.async());
  },

  removeStatus: function() {
    this._logPart('Remove status handler from "/"');
    fs.unlinkSync(path.join(this.projectDir, 'server/boot/root.js'));
  },

  mountWebsite: function() {
    this._logPart('Mount `website` at "/"');

    var SNIPPET =
      'var websitePath = require(\'path\').' +
      'resolve(__dirname, \'../client\');\n' +
      'app.use(loopback.static(websitePath));';

    var serverJs = 'server/server.js';
    var script = this.readFileAsString(serverJs);

    script = script.replace(
      /(app\.use\(loopback\.static\(.*)$/m,
        '$1\n' + SNIPPET);

    this.writeFileFromString(script, serverJs);

  },

  installDeps: actions.installDeps,

  /*--- HELPERS ---*/

  _createDatasource: function(dsName, options, cb) {
    this._logPart('Add datasource %s', dsName);
    cb = cb || this.async();

    var self = this;
    this._runGeneratorWithAnswers(
      'loopback:datasource',
      [dsName],
      {
        connector: options.connector,
      },
      function setExtraOptions(err) {
        if (err) return cb(err);

        var extras = util._extend({}, options);
        delete extras.connector;

        var extraNames = Object.keys(extras);
        if (!extraNames.length) return cb();

        self._logStep('Set datasource options: %s', extraNames.join(' '));

        wsModels.DataSourceDefinition.findOne({ where: {
          name: dsName,
          facetName: 'server'
        } }, function(err, dsDef) {
          if (err) return cb(err);
          util._extend(dsDef, extras);
          dsDef.save(cb);
        });
      });
  },

  _createModel: function(modelName, properties, options, cb) {
    cb = cb || this.async();
    options = util._extend({}, options);
    var self = this;
    var tasks = [];

    this._logPart('Add model %s', modelName);

    tasks.push(function(nextStep) {
      self._runGeneratorWithAnswers(
        'loopback:model',
        [modelName],
        {
          dataSource: 'db'
        },
        nextStep);
    });

    if (properties) {
      tasks.push(function(next) {
        async.eachSeries(Object.keys(properties), function(propName, cb) {
          self._createProperty(modelName, propName, properties[propName], cb);
        }, next);
      });
    }

    if (options.relations) {
      var relations = options.relations;
      delete options.relations;
      tasks.push(function(next) {
        async.eachSeries(Object.keys(relations), function(relName, cb) {
          var definition = util._extend({name: relName}, relations[relName]);
          self._createRelation(modelName, definition, cb);
        }, next);
      });
    }

    if (Object.keys(options).length) {
      tasks.push(function(next) {
        self._logStep('Set model options: %s', Object.keys(options).join(' '));
        findModelByName(modelName, function(err, modelDef) {
          if (err) return next(err);

          for (var key in options) {
            if (key in modelDef.constructor.definition.properties)
              modelDef[key] = options[key];
            else {
              if (!modelDef.options) modelDef.options = {};
              modelDef.options[key] = options[key];
            }
          }

          modelDef.save(next);
        });
      });
    }

    async.series(tasks, cb);
  },

  _createProperty: function(modelName, propertyName, propertyDef, cb) {
    cb = cb || this.async();
    var self = this;
    this._runGeneratorWithAnswers(
      'loopback:property',
      [],
      {
        model: modelName,
        name: propertyName,
        type: propertyDef.type,
        required: propertyDef.required
      },
      function setExtraOptions(err) {
        if (err) return cb(err);

        var extras = util._extend({}, propertyDef);
        delete extras.type;
        delete extras.required;

        var extraNames = Object.keys(extras);
        if (!extraNames.length) return cb();

        // `id` option and custom options like `oracle` are not supported by
        // the generator yet
        self._logStep('Set property options: %s', extraNames.join(' '));

        extras.isId = extras.id;
        delete extras.id;

        findModelByName(modelName, function(err, modelDef) {
          if (err) return cb(err);
          modelDef.properties({ where: { name: propertyName } },
            function(err, props) {
              if (err) return cb(err);
              util._extend(props[0], extras);
              props[0].save(cb);
            });
        });
      });
  },

  _createRelation: function(modelName, relDef, cb) {
    cb = cb || this.async();

    this._runGeneratorWithAnswers(
      'loopback:relation',
      [],
      {
        model: modelName,
        toModel: relDef.model,
        type: relDef.type,
        asPropertyName: relDef.name,
        foreignKey: relDef.foreignKey
      },
      cb);
  },

  _runGeneratorWithAnswers: function(namespace, args, answers, cb) {
    var self = this;
    cb = cb || this.async();

    this._logStep('$ %s %s', helpers.getCommandName(),
      [namespace].concat(args).join(' '));

    /* This is needed for yeoman-generator v0.17,
     * probably due to a bug in v0.17.1
     * see https://github.com/yeoman/generator/pull/602
     *
    // Create a new environment for the generator
    // This prevents the generator from sharing the same event loop with us
    var env = yeoman(this.env.arguments, this.env.options, this.env.adapter);

    // Share the generator registry
    env.store = this.env.store;
     */

    // based on yeoman-generator/lib/actions/invoke
    var generator = this.env.create(namespace, {
      options: {
        nested: true,
        projectDir: this.projectDir,
        force: true,
        'skip-install': true
      },
      args: args || []
    });

    generator.prompt = function(prompts, done) {
      for (var ix in prompts) {
        if (prompts[ix].when && !prompts[ix].when(answers)) continue;

        var name = prompts[ix].name;

        // use default if no answer was provided
        if (answers[name] === undefined) {
          answers[name] = prompts[ix].default;
        }

        var display = answers[name];
        if (display === undefined) display = '';

        if (self._isVerbose())
          self.log('    [?] ' + prompts[ix].message + ' ' + display);
      }
      done(answers);
    };

    return generator.run(cb);
  },

  _logPart: function() {
    this.log(chalk.bold(format.apply(null, arguments)));
  },

  _logStep: function() {
    if (!this._isVerbose()) return;
    this.log(chalk.cyan('  ' + format.apply(null, arguments)));
  },
});

function findModelByName(modelName, cb) {
  wsModels.ModelDefinition.findOne({ where: { name: modelName } }, cb);
}

function createDebugLogger() {
  function debugLog() {
    debug.apply(null, arguments);
    return debugLog;
  }

  for (var key in yolog) {
    debugLog[key] = yolog[key];
  }

  debugLog.write = function(msg) {
    if (!msg) {
      return this.write('\n');
    }

    debug(util.format.apply(util, arguments));
    return this;
  };

  return debugLog;
}
