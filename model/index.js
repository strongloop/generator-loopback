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

  loadDataSources: function() {
    var done = this.async();
    this.project.dataSources(function(err, results) {
      if (err) {
        return done(err);
      }
      this.dataSources = results.map(function(ds) {
        return ds.name;
      });
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
      }
    ];

    this.prompt(prompts, function(props) {
      this.dataSource = props.dataSource;
      this.public = props.public;
      done();
    }.bind(this));
  },

  model: function() {
    var done = this.async();
    var config = {
      properties: {},
      name: this.name,
      public: this.public,
      dataSource: this.dataSource
    };

    this.project.models.create(config, function(err) {
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
        message: 'Property name:'
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.propertyName === '') {
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
            propertyName: answers.propertyName,
          },
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
