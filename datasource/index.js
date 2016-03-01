'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var extend = require('util')._extend;

var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateName = helpers.validateName;

module.exports = yeoman.generators.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the data-source to create.',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadConnectors: function() {
    var done = this.async();
    wsModels.Workspace.listAvailableConnectors(function(err, list) {
      if (err) {
        return done(err);
      }

      this.listOfAvailableConnectors = list.map(function(c) {
        var support = c.supportedByStrongLoop ?
          ' (supported by StrongLoop)' :
          ' (provided by community)';
        return {
          name: c.description + support,
          value: c.name
        };
      });

      var connectorSettings = this.connectorSettings = {};
      list.forEach(function(c) {
        connectorSettings[c.name] = c.settings;
      });

      done();
    }.bind(this));
  },

  askForName: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'name',
        message: 'Enter the data-source name:',
        default: this.name,
        validate: validateName
      }
    ];

    this.prompt(prompts, function(props) {
      this.name = props.name;
      done();
    }.bind(this));

  },

  askForParameters: function() {
    var done = this.async();

    var displayName = chalk.yellow(this.name);

    var connectorChoices = this.listOfAvailableConnectors.concat(['other']);

    var prompts = [
      {
        name: 'connector',
        message: 'Select the connector for ' + displayName + ':',
        type: 'list',
        default: 'memory',
        choices: connectorChoices
      },
      {
        name: 'customConnector',
        message:
          'Enter the connector name without the loopback-connector- prefix:',
        validate: validateName,
        when: function(answers) {
          return answers.connector === 'other';
        }
      }
    ];

    this.prompt(prompts, function(props) {
      this.connector = props.customConnector || props.connector;
      done();
    }.bind(this));
  },

  askForConfig: function() {
    var self = this;
    var settings = this.connectorSettings[this.connector];
    if (!settings) return;

    var warnings = [];
    var reportWarnings = function() {
      warnings.forEach(function(w) {
        self.log(chalk.gray(w));
      });
    };

    var prompts = [];
    for (var key in settings) {
      var prop = settings[key];
      var question = {
        name: key,
        message: (prop.description || key) + ':',
      };
      switch ((prop.type || '').toLowerCase()) {
        case 'string':
        case 'number':
          question.type = prop.display === 'password' ? 'password' : 'input';
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

    this.log('Connector-specific configuration:');
    if (!prompts.length) return reportWarnings();

    var done = this.async();
    this.prompt(prompts, function(props) {
      for (var key in settings) {
        if (settings[key].type === 'number') {
          props[key] = Number(props[key]);
        }
      }
      this.settings = props;
      reportWarnings();
      done();
    }.bind(this));
  },

  dataSource: function() {
    var done = this.async();
    var config = extend(this.settings, {
      name: this.name,
      connector: this.connector,
      facetName: 'server' // hard-coded for now
    });

    wsModels.DataSourceDefinition.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
