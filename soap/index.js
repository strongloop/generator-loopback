// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var generator = require('./wsdl-loader');

var ActionsMixin = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');

var fs = require('fs');
var async = require('async');
var workspace = require('loopback-workspace');
var wsModels = workspace.models;
var debug = require('debug')('loopback:generator:soap');

module.exports = class SoapGenerator extends ActionsMixin(yeoman) {
  constructor(args, opts) {
    super(args, opts);

    this.argument(g.f('url'), {
      desc: g.f('URL or file path of the WSDL'),
      required: false,
      type: String,
    });
  }

  help() {
    return helpText.customHelp(this, 'loopback_soap_usage.txt'); // TODO (rashmihunt) add this .txt
  }

  loadProject() {
    debug('loading project...');
    this.loadProjectForGenerator();
    debug('loaded project.');
  }

  loadDataSources() {
    debug('loading datasources...');
    this.loadDatasourcesForGenerator();
    debug('loaded datasources.');
  }

  addNullDataSourceItem() {
    this.addNullDataSourceItemForGenerator();
  }

  loadModels() {
    debug('loading models...');
    this.loadModelsForGenerator();
    debug('loaded models.');
  }

  existingModels() {
    var self = this;
    self.existingModels = this.modelNames;
  }

  checkForDatasource() {
    var self = this;
    self.soapDataSources = this.dataSources.filter(function(ds) {
      return (ds._connector === 'soap') ||
        (ds._connector === 'loopback-connector-soap');
    });

    var soapDataSourceNames = [];
    self.soapDataSources.forEach(function(ds) {
      soapDataSourceNames.push(ds.data.name);
    });

    self.soapDataSourceNames = soapDataSourceNames;
    if (this.soapDataSourceNames.length == 0) {
      var done = this.async();
      var error = chalk.red(g.f('Error: Found no SOAP WebServices' +
        ' data sources for SOAP discovery.' +
        ' Create SOAP Web Service datasource first and try this' +
        ' command again.'));
      this.log(error);
      return false;
    }
  }

  askForDataSource() {
    var self = this;
    var prompts = [{
      name: 'dataSource',
      message: g.f('Select the datasource for SOAP' +
        ' discovery'),
      type: 'list',
      choices: this.soapDataSourceNames,
    }];

    return this.prompt(prompts).then(function(answers) {
      this.selectedDSName = answers.dataSource;
      var selectedDS;
      for (var i in this.soapDataSources) {
        var datasource = this.soapDataSources[i];
        if (datasource.data.name === this.selectedDSName) {
          self.selectedDS = datasource;
          break;
        }
      }
      self.url = self.selectedDS.data.wsdl;
      self.log(chalk.green(g.f('WSDL for datasource %s: %s',
        this.selectedDSName, self.url)));
    }.bind(this));
  }

  // command:  slc loopback:soap
  soap() {
    var self = this;
    var done = this.async();
    generator.getServices(this.url, this.log, function(err, services) {
      if (err) {
        done(err);
      } else {
        self.services = services;
        var serviceNames = [];
        for (var s in services) {
          serviceNames.push(services[s].$name);
        }
        self.serviceNames = serviceNames;
        done();
      }
    });
  }

  askForService() {
    var prompts = [
      {
        name: 'service',
        message: g.f('Select the service:'),
        type: 'list',
        choices: this.serviceNames,
      },
    ];

    return this.prompt(prompts).then(function(answers) {
      this.servieName = answers.service;
      this.bindingNames = generator.getBindings(this.servieName);
    }.bind(this));
  }

  askForBinding() {
    var prompts = [
      {
        name: 'binding',
        message: g.f('Select the binding:'),
        type: 'list',
        choices: this.bindingNames,
      },
    ];
    return this.prompt(prompts).then(function(answers) {
      this.bindingName = answers.binding;
      this.operations = generator.getOperations(this.bindingName);
    }.bind(this));
  }

  askForOperation() {
    var prompts = [
      {
        name: 'operations',
        message: g.f('Select operations to be generated:'),
        type: 'checkbox',
        choices: this.operations,
        default: this.operations,
        validate: validateNoOperation,
      },
    ];

    return this.prompt(prompts).then(function(answers) {
      this.operations = answers.operations;
    }.bind(this));
  }

  generate() {
    var self = this;
    var done = this.async();

    this.modelDefs = [];
    this.modelConfigs = [];
    this.modelNames = [];

    var api, i, n, m;
    self.operations = this.operations;
    self.apis = generator.generateAPICode(this.selectedDS.data.name,
      this.operations);

    // eslint-disable-next-line one-var
    for (i = 0, n = self.apis.length; i < n; i++) {
      api = self.apis[i];
      // TODO [rashmi] use binding name for now
      // basePath is used as file name for generated API file and top level API model file.
      // Replace special characters in binding name with _ since these characters are not
      // allowed in filename.
      var basePath = this.bindingName.replace(/[-.\/`~!@#%^&*()-+={}'";:<>,?/]/g, '_');
      var soapModel = 'soap_' + basePath;
      self.modelNames.push(soapModel);
      var modelDef = {
        name: soapModel,
        http: {
          path: basePath,
        },
        base: 'Model',
        forceId: 'false',
        idInjection: 'false',
        excludeBaseProperties: ['id'], // for soap model, we need to exclude if generated in base 'Model'
        facetName: 'server', // hard-coded for now
        properties: {},
      };
      api.modelDefinition = modelDef;
      self.modelDefs.push(modelDef);
      self.modelConfigs.push({
        name: soapModel,
        facetName: 'server', // hard-coded for now
        dataSource: null,
        public: true,
      });
    }

    for (i = 0, n = self.apis.length; i < n; i++) {
      var models = self.apis[i].models;
      for (m in models) {
        var model = models[m];
        if (model.type && model.type !== 'object') {
          // Only handle model of object type (not array or simple types)
          continue;
        }
        self.modelNames.push(m);
        self.modelDefs.push({
          name: model.name,
          plural: model.plural,
          base: model.base || 'Model',
          forceId: 'false',
          idInjection: 'false',
          excludeBaseProperties: ['id'], // for soap model, we need to exclude if generated in base 'Model'
          facetName: 'common', // hard-coded for now
          properties: model.properties,
        });
        self.modelConfigs.push({
          name: model.name,
          facetName: 'server', // hard-coded for now
          dataSource: null,
          public: true,
        });
      }
    }

    function createModel(self, modelDef, cb) {
      function processResult(err, result) {
        if (err) {
          return cb(err);
        }
        if (result) {
          modelDef.scriptPath = result.getScriptPath();
        }
        var propertyNames = Object.keys(modelDef.properties);
        if (propertyNames.length > 0) {
          result.properties.destroyAll(function(err) {
            if (err) {
              return cb(err);
            }
            // 2. Create model properties one by one
            async.eachSeries(propertyNames,
              function(m, done) {
                modelDef.properties[m].name = m;
                modelDef.properties[m].facetName = result.facetName;
                result.properties.create(modelDef.properties[m],
                  function(err) {
                    return done(err);
                  });
              }, function(err) {
                if (!err) {
                  self.log(chalk.green(g.f('Model definition created/updated ' +
                    'for %s.', modelDef.name)));
                }
                cb(err);
              });
          });
        } else {
          self.log(chalk.green(g.f('Model definition created/updated for %s.',
            modelDef.name)));
          cb();
        }
      }

      var result = self.existingModels.find(function(obj) {
        return obj === modelDef.name;
      });

      if (result != null) {
        self.log(chalk.green(g.f('Updating model definition for %s...',
          modelDef.name)));
        modelDef.id = wsModels.ModelDefinition.getUniqueId(modelDef);
        // update the model definition
        wsModels.ModelDefinition.upsert(modelDef, processResult);
      } else {
        self.log(chalk.green(g.f('Creating model definition for %s...',
          modelDef.name)));
        wsModels.ModelDefinition.create(modelDef, processResult);
      }
    }

    function createModelConfig(self, config, cb) {
      if (config.dataSource === undefined) {
        config.dataSource = self.dataSource;
      }
      var result = self.existingModels.find(function(obj) {
        return obj === config.name;
      });

      if (result != null) {
        self.log(chalk.green(g.f('Updating model config for %s...',
          config.name)));
        config.id = wsModels.ModelDefinition.getUniqueId(config);
        wsModels.ModelConfig.upsert(config, function(err) {
          if (!err) {
            self.log(chalk.green(g.f('Model config updated for %s.',
              config.name)));
          }
          return cb(err);
        });
      } else {
        wsModels.ModelConfig.create(config, function(err) {
          self.log(chalk.green(g.f('Creating model config for %s...',
            config.name)));
          if (!err) {
            self.log(chalk.green(g.f('Model config created for %s.',
              config.name)));
          }
          return cb(err);
        });
      }
    }

    function generateRemoteMethods(self, cb) {
      var apis = self.apis;
      async.eachSeries(apis, function(api, done) {
        var modelDef = api.modelDefinition;
        if (!modelDef) {
          return done();
        }
        self.log(chalk.green(g.f('Generating %s', modelDef.scriptPath)));
        fs.writeFile(modelDef.scriptPath, api.code, done);
      }, cb);
    }

    function generateApis(self, cb) {
      async.series([
        // Create model definitions
        function(done) {
          async.each(self.modelDefs, function(def, cb) {
            createModel(self, def, cb);
          }, done);
        },
        // Create model configurations
        function(done) {
          async.each(self.modelConfigs, function(config, cb) {
            createModelConfig(self, config, cb);
          }, done);
        },
        function(done) {
          generateRemoteMethods(self, cb);
        },
      ], cb);
    }

    generateApis(self, function(err) {
      if (!err) {
        self.log(
          chalk.green(g.f('Models are successfully generated from ' +
            '{{WSDL}}.'))
        );
      }
      helpers.reportValidationError(err, self.log);
      done(err);
    });
  }

  saveProject() {
    this.saveProjectForGenerator();
  }
};
function validateNoOperation(operations) {
  if (operations.length == 0) {
    return g.f('Please select at least one operation.');
  } else {
    return true;
  }
}
