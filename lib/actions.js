'use strict';
var util = require('util');
var workspace = require('loopback-workspace');
var Project = workspace.models.Project;

var actions = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance


actions.loadProject = function() {
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
