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

    var displayName = chalk.yellow(this.name);

    var prompts = [
      {
        name: 'dataSource',
        message: 'Select the data-source to attach ' + displayName + ' to:',
        type: 'list',
        default: 'db',
        choices: this.dataSources
      },
      {
        name: 'public',
        message: 'Expose ' + displayName + ' via the REST API?',
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
