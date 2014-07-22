'use strict';
var fs = require('fs');
var path = require('path');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var actions = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance

/**
 * Ask the user whether he wants to scaffold the app in the current directory
 * or whether a new subdirectory should be created instead.
 */
actions.askForDestinationDir = function() {
  if (this._externalProject) return;

  var done = this.async();
  this.prompt([
    {
      name: 'dir',
      message: 'Enter a directory name where to create the project:',
      default: '.'
    }
  ], function(answers) {
    var dir = answers.dir;
    if (!dir || dir === '.') return done();
    this.dir = dir;
    var root = path.join(this.destinationRoot(), dir);
    if (!fs.existsSync(root)) {
      this.log.create(dir + '/');
      fs.mkdirSync(root);
    }
    this.destinationRoot(root);
    this.log.info('change the working directory to %s', dir);
    this.log();
    done();
  }.bind(this));
};

/**
 * Initialize the workspace to use the destination root as WORKSPACE_DIR.
 */
actions.initWorkspace = function() {
  if (this.options.nested && this.options.projectDir) {
    this._externalProject = true;
    this.projectDir = this.options.projectDir;
    return true;
  }

  this.projectDir = this.destinationRoot();
  process.env.WORKSPACE_DIR = this.projectDir;

  return false;
};

/**
 * Load the project in `this.destinationRoot()`.
 * Set `this.projectDir`.
 * @async
 */
actions.loadProject = function() {
  if (actions.initWorkspace.call(this))
    return;

  var done = this.async();
  Workspace.isValidDir(done);
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

/**
 * Install npm dependencies, unless the option "skip-install" is enabled.
 */
actions.installDeps = function() {
  this._skipInstall = this.options['skip-install'];

  // Workaround for sync/async inconsistency of the yeoman API
  var done = this._skipInstall ? function(){} : this.async();

  this.installDependencies({
    npm: true,
    bower: false,
    skipInstall: this._skipInstall,
    callback: done
  });
};
