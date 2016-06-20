// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateRequiredName = helpers.validateRequiredName;
var checkPropertyName = helpers.checkPropertyName;
var typeChoices = helpers.getTypeChoices();

module.exports = yeoman.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

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
        message: 'Select the model:',
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

  askForParameters: function() {
    this.name = this.options.propertyName;

    var prompts = [
      {
        name: 'name',
        message: 'Enter the property name:',
        validate: checkPropertyName,
        when: function() {
          return !this.name && this.name !== 0;
        }.bind(this)
      },
      {
        name: 'type',
        message: 'Property type:',
        type: 'list',
        choices: typeChoices
      },
      {
        name: 'customType',
        message: 'Enter the type:',
        required: true,
        validate: validateRequiredName,
        when: function(answers) {
          return answers.type === null;
        }
      },
      {
        name: 'itemType',
        message: 'The type of array items:',
        type: 'list',
        choices: typeChoices.filter(function(t) { return t !== 'array'; }),
        when: function(answers) {
          return answers.type === 'array';
        }
      },
      {
        name: 'customItemType',
        message: 'Enter the item type:',
        validate: validateRequiredName,
        when: function(answers) {
          return answers.type === 'array' && answers.itemType === null;
        }
      },
      {
        name: 'required',
        message: 'Required?',
        type: 'confirm',
        default: false
      },
      {
         name: 'defaultValue',
         message: 'Default value[leave blank for none]:',
         default: null
      }
    ];
    return this.prompt(prompts).then(function(answers) {
      this.name = answers.name || this.name;
      if (answers.type === 'array') {
        var itemType =  answers.customItemType || answers.itemType;
        this.type = itemType ? [itemType] : 'array';
      } else {
        this.type = answers.customType || answers.type;
      }
      this.required = answers.required;
      this.defaultValue = answers.defaultValue;
    }.bind(this));
  },

  property: function() {
    var done = this.async();
    var def = {
      name: this.name,
      type: this.type
    };
    if (this.required) {
      def.required = true;
    }
    if (this.defaultValue) {
      if (this.type === 'boolean'){
        if (['true', '1', 't'].indexOf(this.defaultValue) !== -1 ){
          def.default = true;
        } else {
          def.default = false;
        }
      } else if (this.defaultValue === 'uuid' || this.defaultValue === 'guid'){
         def.defaultFn = this.defaultValue;
      } else if ((this.type === 'date' || this.type === 'datetime') &&
                  this.defaultValue.toLowerCase() === 'now'){
         def.defaultFn = 'now';
      } else {
         def.default = this.defaultValue;
      }
    }

    this.modelDefinition.properties.create(def, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  saveProject: actions.saveProject
});
