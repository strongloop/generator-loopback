'use strict';
var yeoman = require('yeoman-generator');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');

module.exports = yeoman.generators.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

  loadModels: actions.loadModels,

  askForModel: function() {
    var done = this.async();

    var modelChoices =
      [{ name: '(all existing models)', value: null }]
      .concat(this.modelNames);

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
          { name: 'A single property', value: 'property' }
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
        default: 'all',
        choices: [
          { name: 'All (match all types)', value: 'all' },
          'read',
          'write',
          'execute',
        ]
      },
      {
        name: 'role',
        message: 'Select the role',
        type: 'list',
        default: 'everyone',
        choices: [
          { name: 'All users', value: 'everyone' },
          { name: 'Any unauthenticated user', value: 'unauthenticated' },
          { name: 'Any authenticated user', value: 'authenticated' },
          { name: 'Any user related to the object', value: 'related' },
          { name: 'The user owning the object', value: 'owner' },
        ]
      },
      {
        name: 'permission',
        message: 'Select the permission to apply',
        type: 'list',
        choices: [
          { name: 'Explicitly grant access to the model', value: 'allow' },
          { name: 'Explicitly deny access to the model', value: 'deny' },
          { name: 'Generate an alarm of the access to the model',
            value: 'alarm' },
          { name: 'Log the access to the model', value: 'audit' }
        ]
      }
    ];
    this.prompt(prompts, function(answers) {
      this.aclOptions = {};
      if (this.modelName) {
        this.aclOptions.model = this.modelName;
      } else {
        this.aclOptions['all-models'] = true;
      }

      if (answers.property) {
        this.aclOptions.property = answers.property;
      }

      var flags = ['scope', 'accessType', 'role', 'permission'];
      flags.forEach(function(k) {
        if (answers[k]) {
          this.aclOptions[answers[k]] = true;
        }
      }.bind(this));
      done();
    }.bind(this));
  },

  acl: function() {
    var done = this.async();
    this.project.addPermission(this.aclOptions, function(err) {
      if (!err) {
        return this.project.saveToFiles(this.projectDir, done);
      }

      if (err.name === 'ValidationError') {
        helpers.reportValidationError(err, this.log);
      }
      return done(err);
    }.bind(this));
  }
});
