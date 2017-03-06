// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var extend = require('util')._extend;
var wsModels = require('loopback-workspace').models;
var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var validateRequiredName = helpers.validateRequiredName;
var objectValidator = helpers.objectValidator;
var path = require('path');
var fs = require('fs');
var datasourcesConfigPath = path.join('loopback-workspace',
                            'templates', 'bluemix', 'bluemix',
                            'datasources-config.json');
var datasourcesConfig = require(datasourcesConfigPath);
var bluemixSupportedServices = datasourcesConfig.supportedServices;
var jsonfileUpdater = require('jsonfile-updater');

module.exports = yeoman.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.argument('name', {
      desc: g.f('Name of the data-source to create.'),
      required: false,
      type: String,
    });
  },

  help: function() {
    return helpText.customHelp(this, 'loopback_datasource_usage.txt');
  },

  loadConnectors: function() {
    var done = this.async();
    wsModels.Workspace.listAvailableConnectors(function(err, list) {
      if (err) {
        return done(err);
      }

      this.listOfAvailableConnectors = list.map(function(c) {
        var support = c.supportedByStrongLoop ?
          g.f(' (supported by StrongLoop)') :
          g.f(' (provided by community)');
        return {
          name: c.description + support,
          value: c.name,
        };
      });

      var availableConnectors = this.availableConnectors = {};
      list.forEach(function(c) {
        availableConnectors[c.name] = c;
      });

      var connectorSettings = this.connectorSettings = {};
      list.forEach(function(c) {
        connectorSettings[c.name] = c.settings;
      });

      done();
    }.bind(this));
  },

  askForName: function() {
    var prompts = [];
    var promptObject = {
      name: 'name',
      default: this.name,
      validate: validateRequiredName,
    };
    if (this.options.bluemix) {
      promptObject.message = g.f('Name of the provisioned data-source service:');
    } else {
      promptObject.message = g.f('Enter the data-source name:');
    }
    prompts.push(promptObject);
    return this.prompt(prompts).then(function(props) {
      this.name = props.name;
    }.bind(this));
  },

  askForParameters: function() {
    var displayName = chalk.yellow(this.name);

    var _connectorChoices = this.listOfAvailableConnectors.concat(['other']);
    var connectorChoices = [];
    if (this.options.bluemix) {
      var bluemixSupportedServiceNames = Object.keys(bluemixSupportedServices);
      _connectorChoices.forEach(function(c) {
        if (bluemixSupportedServiceNames.indexOf(c.value) >= 0) {
          connectorChoices.push(c);
        }
      });
    } else {
      connectorChoices = _connectorChoices;
    }

    var prompts = [
      {
        name: 'connector',
        message: g.f('Select the connector for %s:', displayName),
        type: 'list',
        default: 'memory',
        choices: connectorChoices,
      },
      {
        name: 'customConnector',
        message:
          g.f('Enter the connector\'s module name'),
        validate: validateRequiredName,
        when: function(answers) {
          return answers.connector === 'other';
        },
      },
    ];

    return this.prompt(prompts).then(function(props) {
      this.connector = props.customConnector || props.connector;
    }.bind(this));
  },

  askForConfig: function() {
    var self = this;
    var settings = this.connectorSettings[this.connector];
    this.settings = {};
    if (!settings) {
      return;
    }

    var warnings = [];
    var reportWarnings = function() {
      warnings.forEach(function(w) {
        self.log(chalk.gray(w));
      });
    };

    var prompts = [];
    for (var key in settings) {
      if (this.options.bluemix &&
        ['database', 'db', 'modelIndex'].indexOf(key) < 0) {
        continue;
      }
      var prop = settings[key];
      var question = {
        name: key,
        message: (prop.description || key) + ':',
      };
      if (prop.default !== undefined) {
        question.default = prop.default;
      }
      switch ((prop.type || '').toLowerCase()) {
        case 'string':
        case 'number':
          question.type = prop.display === 'password' ? 'password' : 'input';
          break;
        case 'object':
        case 'array':
          // For object/array, we expect a stringified json
          question.type = 'input';
          question.validate = objectValidator(prop.type);
          break;
        case 'boolean':
          question.type = 'confirm';
          break;
        default:
          warnings.push('Skipped setting ' +
            JSON.stringify(key) +
            ' of unknown type ' +
            (JSON.stringify(prop.type) || '(undefined)'));
          continue;
      }
      prompts.push(question);
    }

    if (!prompts.length && !warnings.length)
      return;

    this.log(g.f('\n Connector-specific configuration:\n'));
    if (!prompts.length) return reportWarnings();

    return this.prompt(prompts).then(function(props) {
      for (var key in settings) {
        var propType = settings[key].type;
        if (propType === 'number') {
          props[key] = Number(props[key]);
        } else if (propType === 'array' || propType === 'object') {
          if (props[key] == null || props[key] === '') {
            delete props[key];
          } else {
            props[key] = JSON.parse(props[key]);
          }
        }
      }
      this.settings = props || {};
      reportWarnings();
    }.bind(this));
  },

  installConnector: function() {
    var connector = this.availableConnectors[this.connector];
    var pkg = {};
    if (connector) {
      pkg = connector.package;
      if (!pkg) return;
    }

    var npmModule = pkg.name || this.connector;
    if (pkg.version) {
      npmModule += '@' + pkg.version;
    }
    var projectPkg = JSON.parse(
      fs.readFileSync(path.join(this.projectDir, 'package.json'), 'utf-8'));
    if (projectPkg.dependencies[pkg.name]) {
      return;
    }

    var done = this.async();

    var prompts = [
      {
        name: 'installConnector',
        message: g.f('Install %s', npmModule),
        type: 'confirm',
        default: true,
      },
    ];

    return this.prompt(prompts).then(function(props) {
      if (props.installConnector) {
        this.npmInstall([npmModule], {'save': true});
        done();
      } else {
        var moduleVersion = npmModule.split('@');
        var dependency = {};
        dependency[moduleVersion[0]] = moduleVersion[1];
        jsonfileUpdater(path.join(this.projectDir, 'package.json')).append(
          'dependencies', dependency, done
        );
      }
    }.bind(this));
  },

  dataSource: function() {
    var done = this.async();
    var config = extend(this.settings, {
      name: this.name,
      connector: this.connector,
      facetName: 'server', // hard-coded for now
    });
    if (this.options.bluemix) {
      var datasourcesConfigFilePath = path.join(process.cwd(), '.bluemix',
                                      'datasources-config.json');
      var bluemixConnectorConfig = {
        name: config.name,
        connector: config.connector,
      };
      if ('database' in config) {
        bluemixConnectorConfig.database = config.database;
      } else if ('db' in config) {
        bluemixConnectorConfig.database = config.db;
      }
      if ('modelIndex' in config) {
        bluemixConnectorConfig.modelIndex = config.modelIndex;
      }
      var datasourceName = 'datasources.' + bluemixConnectorConfig.name;
      jsonfileUpdater(datasourcesConfigFilePath)
      .add(datasourceName, bluemixConnectorConfig, function(err) {
        return done(err);
      });
    } else {
      wsModels.DataSourceDefinition.create(config, function(err) {
        helpers.reportValidationError(err, this.log);
        return done(err);
      }.bind(this));
    }
  },

  updatePipeline: function() {
    var pipeLineFilePath = path.join(process.cwd(), '.bluemix',
                                      'pipeline.yml');
    var content = fs.readFileSync(pipeLineFilePath, 'utf8');
    var lines = content.split('#!/bin/bash')[1].split('\n').map(function(line) {
      return line.trim();
    });

    // https://github.com/strongloop/generator-loopback/issues/38
    // yeoman-generator normalize the appname with ' '
    this.appName =
      path.basename(process.cwd()).replace(/[\/@\s\+%:\.]+?/g, '-');

    var bindServiceCommand = 'cf bind-service ' +
                              this.appName + ' ' + this.name;
    if (lines.indexOf(bindServiceCommand) < 0) {
      var appendStr = '      ' + bindServiceCommand + '\n';
      fs.appendFileSync(pipeLineFilePath, appendStr);
    }
  },

  printAddConfigForCustomConnector: function() {
    var connector = this.connector;
    if (!this.availableConnectors[connector]) {
      this.log(g.f('Please manually add config for your custom connector %s' +
        ' in {{server/datasources.json}}', connector));
    } else {
      return;
    }
  },

  saveProject: actions.saveProject,
});
