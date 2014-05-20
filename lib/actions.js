'use strict';
var util = require('util');
var workspace = require('loopback-workspace');
var Project = workspace.models.Project;

var actions = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance


/**
 * Load the project in `this.destinationRoo()`.
 * Set `this.projectDir` and `this.project`.
 * @async
 */
actions.loadProject = function() {
  if (this.options.nested && this.options.projectDir && this.options.project) {
    this._externalProject = true;
    this.projectDir = this.options.projectDir;
    this.project = this.options.project;
    return;
  }

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
};

/**
 * Save `this.project`, update all project files.
 */
actions.saveProject = function() {
  if (this._externalProject) {
    return;
  }

  var done = this.async();
  this.project.saveToFiles(this.projectDir, done);
};

/**
 * Load all models of `this.project`.
 * `this.projectModels` will contain an array of all models (Array.<Model>)
 * `this.modelNames` will contain an array of names (Array.<string>)
 */
actions.loadModels = function() {
  var done = this.async();
  this.project.models(function(err, results) {
    if (err) {
      return done(err);
    }
    this.projectModels = results;
    this.modelNames = results.map(function(m) {
      return m.name;
    });
    done();
  }.bind(this));
};