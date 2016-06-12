// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var yeoman = require('yeoman-generator');
var async = require('async');

var wsModels = require('loopback-workspace').models;
var ModelAccessControl = wsModels.ModelAccessControl;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');

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

  loadAccessTypeValues: function() {
    var done = this.async();
    ModelAccessControl.getAccessTypes(function(err, list) {
      this.accessTypeValues = list;
      done(err);
    }.bind(this));
  },

  loadRoleValues: function() {
    var done = this.async();
    ModelAccessControl.getBuiltinRoles(function(err, list) {
      this.roleValues = list;
      done(err);
    }.bind(this));
  },

  loadPermissionValues: function() {
    var done = this.async();
    ModelAccessControl.getPermissionTypes(function(err, list) {
      this.permissionValues = list;
      done(err);
    }.bind(this));
  },

  askForModel: function() {
    var done = this.async();

    var modelChoices =
      [{ name: '(all existing models)', value: null }]
      .concat(this.editableModelNames);

    var prompts = [
      {
        name: 'model',
        message: 'Select the model to apply the ACL entry to:',
        type: 'list',
        default: 0,
        choices: modelChoices
      }
    ];

    this.prompt(prompts, function(answers) {
      this.modelName = answers.model;
      if (this.modelName) {
        this.modelDefinition = this.projectModels.filter(function(m) {
          return m.name === answers.model;
        })[0];
      }
      done();
    }.bind(this));

  },

  askForParameters: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'scope',
        message: 'Select the ACL scope:',
        type: 'list',
        default: 'all',
        choices: [
          { name: 'All methods and properties', value: 'all' },
          { name: 'A single method', value: 'method' },
          /* not supported by loopback yet
          { name: 'A single property', value: 'property' }
          */
        ]
      },
      {
        name: 'property',
        message: 'Enter the method name',
        when: function(answers) {
          return answers.scope === 'method';
        }
      },
      {
        name: 'property',
        message: 'Enter the property name',
        when: function(answers) {
          return answers.scope === 'property';
        }
      },
      {
        name: 'accessType',
        message: 'Select the access type:',
        type: 'list',
        default: '*',
        when: function(answers) {
          return answers.scope === 'all';
        },
        choices: this.accessTypeValues,
      },
      {
        name: 'role',
        message: 'Select the role',
        type: 'list',
        default: '$everyone',
        choices: this.roleValues.concat(['other']),
      },
      {
        name: 'customRole',
        message:
          'Enter the role name:',
        when: function(answers) {
          return answers.role === 'other';
        }
      },
      {
        name: 'permission',
        message: 'Select the permission to apply',
        type: 'list',
        choices: this.permissionValues,
      }
    ];
    this.prompt(prompts, function(answers) {
      var accessType = answers.accessType;
      if (answers.scope === 'method') {
        accessType = 'EXECUTE';
      }
      this.aclDef = {
        property: answers.property,
        accessType: accessType,
        principalType: 'ROLE', // TODO(bajtos) support all principal types
        principalId: answers.customRole || answers.role,
        permission: answers.permission
      };
      done();
    }.bind(this));
  },

  acl: function() {
    var done = this.async();

    var aclDef = this.aclDef;
    var filter = this.modelName ?
      { where: { name: this.modelName }, limit: 1 } :
    {} /* all models, force refresh */;

    wsModels.ModelDefinition.find(filter, function(err, models) {
      if (err) {
        return done(err);
      }

      var firstError = true;
      async.eachSeries(models, function(model, cb) {
        model.accessControls.create(aclDef, function(err) {
          if (err && firstError) {
            helpers.reportValidationError(err);
            firstError = false;
          }
          cb(err);
        });
      }, done);
    });
  },

  saveProject: actions.saveProject
});
