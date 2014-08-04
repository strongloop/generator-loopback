'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateName = helpers.validateName;

module.exports = yeoman.generators.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the model to create.',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadProject: actions.loadProject,

  loadDataSources: function() {
    var done = this.async();

    wsModels.DataSourceDefinition.find(function(err, results) {
      if (err) {
        return done(err);
      }
      this.dataSources = results.map(function(ds) {
        return {
          name: ds.name + ' (' + ds.connector +')',
          value: ds.name,
          _connector: ds.connector
        };
      });
      done();
    }.bind(this));
  },

  askForName: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'name',
        message: 'Enter the model name:',
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

    this.displayName = chalk.yellow(this.name);

    var prompts = [
      {
        name: 'dataSource',
        message: 'Select the data-source to attach ' +
          this.displayName + ' to:',
        type: 'list',
        default: 'db',
        choices: this.dataSources
      },
      {
        name: 'public',
        message: 'Expose ' + this.displayName + ' via the REST API?',
        type: 'confirm'
      },
      {
        name: 'plural',
        message: 'Custom plural form (used to build REST URL):',
        when: function(answers) {
          return answers.public;
        }
      }
    ];

    this.prompt(prompts, function(props) {
      this.dataSource = props.dataSource;
      this.public = props.public;
      this.plural = props.plural || undefined;

      done();
    }.bind(this));
  },

  loadDataSourceConnectorMeta: function() {
    var done = this.async();
    var self = this;

    var dataSource = findFirstOrEmptyObject(self.dataSources, function(item) {
      return item.value === self.dataSource;
    });

    wsModels.Workspace.listAvailableConnectors(function(err, list) {
      if (err) return done(err);

      self.connectorMeta = findFirstOrEmptyObject(list, function(item) {
        return item.name === dataSource._connector;
      });

      done();
    });

    function findFirstOrEmptyObject(list, filterFn) {
      return list.filter(filterFn)[0] || {};
    }
  },

  modelDefinition: function() {
    var done = this.async();
    var config = {
      name: this.name,
      plural: this.plural,
      base: this.connectorMeta.baseModel,
      facetName: 'common' // hard-coded for now
    };

    wsModels.ModelDefinition.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  modelConfiguration: function() {
    var done = this.async();
    var config = {
      name: this.name,
      facetName: 'server', // hard-coded for now
      dataSource: this.dataSource,
      public: this.public
    };

    wsModels.ModelConfig.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  delim: function() {
    this.log('Let\'s add some ' + this.displayName + ' properties now.\n');
  },

  property: function() {
    var done = this.async();
    this.log('Enter an empty property name when done.');
    var prompts = [
      {
        name: 'propertyName',
        message: 'Property name:',
        validate: function (input) {
          if (input) {
            return validateName(input);
          } else {
            return true;
          }
        }
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.propertyName == null || answers.propertyName === '') {
        return done();
      }

      this.invoke(
        'loopback:property',
        {
          options: {
            nested: true,
            projectDir: this.projectDir,
            project: this.project,
            modelName: this.name,
            propertyName: answers.propertyName
          }
        },
        function(err) {
          if (err) {
            return done(err);
          }
          this.log('\nLet\'s add another ' + this.displayName + ' property.');
          this.property();
        }.bind(this));
    }.bind(this));
  },

  saveProject: actions.saveProject
});
