'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
// var wsModels = require('loopback-workspace').models;

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
      desc: 'Name of the policy to create.',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadProject: actions.loadProject,

  loadPhases: function() {
    // FIXME: [rfeng] Load the phase names from workspace
    this.phases = [
      'other',
      'middleware:authentication',
      'middleware:authorization',
      'middleware:body-parsing',
      'middleware:header-processing',
      'middleware:user',
      'remoting:pre-match',
      'remoting:post-match',
      'remoting:before',
      'remoting:after',
      'model:before-create',
      'model:before-update',
      'model:before-delete',
      'model:before-find',
      'model:after-create',
      'model:after-update',
      'model:after-delete',
      'model:after-find'
    ];
  },

  askForName: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'name',
        message: 'Enter the policy name:',
        default: this.name,
        validate: validatePolicyName
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
        name: 'phase',
        message: 'Select the phase to attach ' +
          this.displayName + ' to:',
        type: 'list',
        default: 'other',
        choices: this.phases
      },
      {
        name: 'customPhase',
        message: 'Enter the phase name:',
        validate: validatePhaseName,
        when: function(answers) {
          return answers.phase === 'other';
        }
      },
      {
        name: 'module',
        message: 'Enter the module name: '
      }
    ];

    this.prompt(prompts, function(props) {
      this.phase = props.customPhase || props.phase;
      this.module = props.module;

      done();
    }.bind(this));
  },

  policyConfiguration: function() {
    var self = this;
    var done = this.async();
    var config = {
      name: this.name,
      facetName: 'server', // hard-coded for now
      phase: this.phase,
      module: this.module
    };

    process.nextTick(function() {
      self.log('The workspace api to define a policy is to be implemented.');
      self.log(config);
      done();
    });
  },

  saveProject: actions.saveProject
});

function validatePolicyName(name) {
  if (!name) {
    return 'Name is required';
  }
  return validateName(name);
}

function validatePhaseName(name) {
  if (!name) {
    return 'Name is required';
  }
  if (name.match(/[\/@\s\+%\.]/) ||
    name !== encodeURIComponent(name)) {
    return 'Name cannot contain special characters (/@+%:. ): ' + name;
  }
  if (name !== encodeURIComponent(name)) {
    return 'Name cannot contain special characters escaped by ' +
      'encodeURIComponent: ' + name;
  }
  return true;
}
