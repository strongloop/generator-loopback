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

  loadDataSources: actions.loadDataSources,

  loadModels: actions.loadModels,

  addNullDataSourceItem: actions.addNullDataSourceItem,

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

    var baseModelChoices = ['Model', 'PersistedModel']
      .concat(this.modelNames)
      .concat([{
        name: '(custom)',
        value: null
      }]);

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
        name: 'base',
        message: 'Select model\'s base class',
        type: 'list',
        default: function(answers) {
          return helpers.getBaseModelForDataSourceName(
            answers.dataSource, this.dataSources);
        }.bind(this),
        choices: baseModelChoices
      },
      {
        name: 'customBase',
        message: 'Enter the base model name:',
        required: true,
        validate: validateName,
        when: function(answers) {
          return answers.base === null;
        }
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
      this.base = props.customBase || props.base;

      done();
    }.bind(this));
  },

  modelDefinition: function() {
    var done = this.async();
    var config = {
      name: this.name,
      plural: this.plural,
      base: this.base,
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
