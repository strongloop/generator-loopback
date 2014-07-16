'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');

var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');

module.exports = yeoman.generators.NamedBase.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

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
        default: 'db',
        choices: connectorChoices
      },
      {
        name: 'customConnector',
        message:
          'Enter the connector name without the loopback-connector- prefix:',
        validate: function(input) {
          return input ? true : 'You have to provide the connector name.';
        },
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

  dataSource: function() {
    var done = this.async();
    var config = {
      name: this.name,
      connector: this.connector,
      facetName: 'server' // hard-coded for now
    };

    wsModels.DataSourceDefinition.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
