'use strict';
var workspace = require('loopback-workspace');

var actions = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance


/**
 * Load the project in `this.destinationRoo()`.
 * Set `this.projectDir`.
 * @async
 */
actions.loadProject = function() {
  if (this.options.nested && this.options.projectDir) {
    this._externalProject = true;
    this.projectDir = this.options.projectDir;
    return;
  }

  this.projectDir = this.destinationRoot();
  process.env.WORKSPACE_DIR = this.projectDir;

  /* TODO - validate the project
  var done = this.async();
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
  }.bind(this));
  */
};

/**
 * Save the current project, update all project files.
 */
actions.saveProject = function() {
  if (this._externalProject) {
    return;
  }

  // no-op in workspace 3.0
};

/**
 * Load all models of the current project.
 * `this.projectModels` will contain an array of all models (Array.<Model>)
 * `this.modelNames` will contain an array of names (Array.<string>)
 */
actions.loadModels = function() {
  var done = this.async();
  workspace.models.ModelDefinition.all(function(err, results) {
    if (err) return done(err);
    this.projectModels = results;
    this.modelNames = results.map(function(m) {
      return m.name;
    });
    done();
  }.bind(this));
};
