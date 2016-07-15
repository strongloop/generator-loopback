// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var inflection = require('inflection');

var workspace = require('loopback-workspace');
var ModelRelation = workspace.models.ModelRelation;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateOptionalName = helpers.validateOptionalName;
var validateRequiredName = helpers.validateRequiredName;
var checkRelationName = helpers.checkRelationName;
var checkPropertyName = helpers.checkPropertyName;

module.exports = yeoman.Base.extend({

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

    var prompts = [
      {
        name: 'model',
        message: 'Select the model to create the relationship from:',
        type: 'list',
        choices: this.editableModelNames
      }
    ];

    return this.prompt(prompts).then(function(answers) {
      this.modelName = answers.model;
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
    var modelDef = this.modelDefinition;

    var modelChoices = this.editableModelNames.concat({
      name: '(other)',
      value: null
    });

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
        choices: modelChoices
      },
      {
        name: 'customToModel',
        message: 'Enter the model name:',
        required: true,
        validate: validateRequiredName,
        when: function(answers) {
          return answers.toModel === null;
        }
      },
      {
        name: 'asPropertyName',
        message: 'Enter the property name for the relation:',
        required: true,
        default: function(answers) {
          var m = answers.customToModel || answers.toModel;
          // Model -> model
          m = inflection.camelize(m, true);
          if (answers.type !== 'belongsTo') {
            // model -> models
            m = inflection.pluralize(m);
          }
          return m;
        },
        validate: function(value) {
          var isValid = checkPropertyName(value);
          if (isValid !== true) return isValid;
          return checkRelationName(modelDef, value);
        }
      },
      {
        name: 'foreignKey',
        message: 'Optionally enter a custom foreign key:',
        validate: validateOptionalName
      },
      {
        name: 'through',
        message: 'Require a through model?',
        type: 'confirm',
        default: false,
        when: function(answers) {
          return answers.type === 'hasMany';
        }
      },
      {
        name: 'throughModel',
        message: 'Choose a through model:',
        type: 'list',
        choices: modelChoices,
        when: function(answers) {
          return answers.through;
        }
      },
      {
        name: 'customThroughModel',
        message: 'Enter the model name:',
        required: true,
        validate: validateRequiredName,
        when: function(answers) {
          return answers.through && answers.throughModel === null;
        }
      },
    ];

    return this.prompt(prompts).then(function(answers) {
      this.type = answers.type;
      this.toModel = answers.customToModel || answers.toModel;
      this.asPropertyName = answers.asPropertyName;
      this.foreignKey = answers.foreignKey;
      if (answers.through) {
        this.throughModel = answers.customThroughModel || answers.throughModel;
      }
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
    if (this.throughModel) {
      def.through = this.throughModel;
    }
    this.modelDefinition.relations.create(def, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
