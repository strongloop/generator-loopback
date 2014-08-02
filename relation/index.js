'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var inflection = require('inflection');

var workspace = require('loopback-workspace');
var ModelRelation = workspace.models.ModelRelation;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateName = helpers.validateName;

module.exports = yeoman.generators.Base.extend({

  help: function() {
    return helpers.customHelp(this);
  },

  loadProject: actions.loadProject,

  loadModels: actions.loadModels,

  askForModel: function() {
    if (this.options.modelName) {
      this.modelName = this.options.modelName;
      return;
    }

    var done = this.async();
    var prompts = [
      {
        name: 'model',
        message: 'Select the model to create the relationship from:',
        type: 'list',
        choices: this.modelNames
      }
    ];

    this.prompt(prompts, function(answers) {
      this.modelName = answers.model;
      done();
    }.bind(this));
  },

  findModelDefinition: function() {
    this.modelDefinition = this.projectModels.filter(function(m) {
      return m.name === this.modelName;
    }.bind(this))[0];

    if (!this.modelDefinition) {
      var msg = 'Model not found: ' + this.modelName;
      this.log(chalk.red(msg));
      this.async()(new Error(msg));
    }
  },

  getTypeChoices: function() {
    var self = this;
    var done = this.async();
    ModelRelation.getValidTypes(function(err, availableTypes) {
      if(err) return done(err);
      self.availableTypes = availableTypes;
      done();
    });
  },

  askForParameters: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'type',
        message: 'Relation type:',
        type: 'list',
        choices: this.availableTypes
      },
      {
        name: 'toModel',
        message: 'Choose a model to create a relationship with:',
        type: 'list',
        choices: this.modelNames
      },
      {
        name: 'asPropertyName',
        message: 'Enter the property name for the relation:',
        required: true,
        default: function(answers) {
          var m = answers.toModel;
          // Model -> model
          m = inflection.camelize(m, true);
          if (answers.type !== 'belongsTo') {
            // model -> models
            m = inflection.pluralize(m);
          }
          return m;
        },
        validate: validateName
      },
      {
        name: 'foreignKey',
        message: 'Optionally enter a custom foreign key:',
        validate: function(value) {
          return value === undefined || value === '' || validateName(value);
        }
      }
    ];
    this.prompt(prompts, function(answers) {
      this.type = answers.type;
      this.toModel = answers.toModel;
      this.asPropertyName = answers.asPropertyName;
      this.foreignKey = answers.foreignKey;
      done();
    }.bind(this));
  },

  relation: function() {
    var done = this.async();
    var def = {
      type: this.type,
      model: this.toModel,
      foreignKey: this.foreignKey,
      name: this.asPropertyName
    };
    this.modelDefinition.relations.create(def, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
