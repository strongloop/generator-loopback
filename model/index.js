'use strict';
var util = require('util');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');

var workspace = require('loopback-workspace');
var Project = workspace.models.Project;
var helpers = require('../lib/helpers');


var ModelGenerator = yeoman.generators.NamedBase.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // adding new models.

  loadProject: function () {
    var done = this.async();

    this.projectDir = this.destinationRoot();
    Project.isValidProjectDir(this.projectDir, function(err, isValid, message) {
      if (err) {
        return done(err);
      }

      if (!isValid) {
        var msg = util.format(
          'The directory %s is not a valid LoopBack project. %s',
          this.projectDir,
          message);
        return done(new Error(msg));
      }

      Project.loadFromFiles(this.projectDir, function(err, project) {
        if (err) {
          return done(err);
        }

        this.project = project;
        done();
      }.bind(this));
    }.bind(this));
  },

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

module.exports = ModelGenerator;
