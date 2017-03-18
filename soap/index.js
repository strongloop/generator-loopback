// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var url = require('url');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var generator = require('./wsdl-loader');
var path = require('path');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');

var fs = require('fs');
var async = require('async');
var workspace = require('loopback-workspace');
var wsModels = workspace.models;

// A list of flags to control whether a model should be generated
var NOT_SELECTED = 0; // It's not selected
var CONFLICT_DETECTED = -1; // A model with the same name exists
var SELECTED_FOR_UPDATE = 1; // Selected for update
var SELECTED_FOR_CREATE = 2; // Selected for create

module.exports = yeoman.Base.extend({

  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.argument('url', {
      desc: g.f('URL or file path of the WSDL'),
      required: false,
      type: String,
    });
  },

  help: function() {
    return helpText.customHelp(this, 'loopback_soap_usage.txt'); // TODO (rashmihunt) add this .txt
  },

  loadProject: actions.loadProject,

  askForWsdlUrlOrPath: function() {
    var prompts = [
      {
        name: 'url',
        message: g.f('Enter the WSDL url or file path:'),
        default: this.url,
        validate: validateUrlOrFile,
      },
    ];
    return this.prompt(prompts).then(function(answers) {
      this.url = answers.url.trim();
    }.bind(this));
  },

  // command:  slc loopback:soap
  soap: function() {
    var self = this;
    var done = this.async();
    generator.getServices(this.url, this.log, function(err, services) {
      if (err) {
        done(err);
      } else {
        self.services = services;
        console.log('index self.services %j', self.services);
        var serviceNames = [];
        for (var s in services) {
          serviceNames.push(services[s].$name);
        }
        self.serviceNames = serviceNames;
        console.log('index.getServices %j', self.serviceNames);
        done();
      }
    });
  },

  askForService: function() {
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
      console.log('askForService before getBindings() %s', this.servieName);
      this.bindingNames = generator.getBindings(this.servieName);
      console.log('askForService after getBindings() %j', this.bindingNames);
    }.bind(this));
  },

  askForBinding: function() {
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
  },

  askForOperation: function() {
    var prompts = [
      {
        name: 'operations',
        message: g.f('Select operations to be generated:'),
        type: 'checkbox',
        choices: this.operations,
      },
    ];

    return this.prompt(prompts).then(function(answers) {
      this.operations = answers.operations;
    }.bind(this));
  },

  generate: function() {
    var self = this;
    var done = this.async();

    this.modelDefs = [];
    this.modelConfigs = [];
    this.modelNames = [];

    var api, i, n, m;
    self.operations = this.operations;
    self.apis = generator.generateAPICode(this.operations);

    // eslint-disable-next-line one-var
    for (i = 0, n = self.apis.length; i < n; i++) {
      api = self.apis[i];
      // TODO [rashmi] use binding name for now
      var basePath = this.bindingName;
      var soapModel = 'soap_' + basePath.replace(/\//g, '_');
      self.modelNames.push(soapModel);
      var modelDef = {
        name: soapModel,
        http: {
          path: basePath,
        },
        base: 'Model',
        forceId: 'false', // in case of soap, we don't need id generated in the model
        idInjection: 'false',
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
          forceId: 'false', // in case of soap, we don't need id generated in the model
          idInjection: 'false',
          facetName: 'server', // hard-coded for now
          properties: model.properties,
        });
        self.modelConfigs.push({
          name: model.name,
          facetName: 'server', // hard-coded for now
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
      // TODO [rashmi] need to check if the model exists and create or update accordingly
      wsModels.ModelDefinition.create(modelDef, processResult);
    }

    function createModelConfig(self, config, cb) {
      if (config.dataSource === undefined) {
        config.dataSource = self.dataSource;
      }
      // TODO [rashmi] need to check if the modelconfig exists and create or update accordingly
      wsModels.ModelConfig.create(config, function(err) {
        if (!err) {
          self.log(chalk.green(g.f('Model config created for %s.',
              config.name)));
        }
        return cb(err);
      });
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
            '{{WSDL}}.')));
      }
      helpers.reportValidationError(err, self.log);
      done(err);
    });
  },

  saveProject: actions.saveProject,
});

function validateUrlOrFile(wsdlUrlStr) {
  if (!wsdlUrlStr) {
    return g.f('wsdl url or file path is required');
  }
  var wsdlUrl = url.parse(wsdlUrlStr);
  if (wsdlUrl.protocol === 'http:' || wsdlUrl.protocol === 'https:') {
    return true;
  } else {
    var stat = fs.existsSync(wsdlUrlStr) && fs.statSync(wsdlUrlStr);
    if (stat && stat.isFile()) {
      return true;
    } else {
      return g.f('file path %s is not a file.', wsdlUrlStr);
    }
  }
}
