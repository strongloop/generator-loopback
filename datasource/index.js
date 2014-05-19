'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');

module.exports = yeoman.generators.NamedBase.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

  loadConnectors: function() {
    // TODO(bajtos) build this list from published npm modules
    var list = this.listOfAvailableConnectors = [];

    function addOfficial(name, value) {
      list.push({ name: name + ' (supported by StrongLoop)', value: value });
    }

    function addCommunity(name, value) {
      list.push({ name: name + ' (provided by community)', value: value });
    }

    addOfficial('In-memory db', 'memory');
    addOfficial('MySQL', 'mysql');
    addOfficial('PostgreSQL', 'postgresql');
    addOfficial('Oracle', 'oracle');
    addOfficial('Microsoft SQL', 'mssql');
    addOfficial('MongoDB', 'mongodb');
    addOfficial('SOAP webservices', 'soap');
    addOfficial('REST services', 'rest');

    addCommunity('Neo4j', 'neo4j');
    addCommunity('Kafka', 'kafka');
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
      connector: this.connector
    };

    this.project.dataSources.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
