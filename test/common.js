'use strict';
var async = require('async');
var fs = require('fs');
var path = require('path');
var generators = require('yeoman-generator');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

exports.createGenerator = createGenerator;

function createGenerator(name, path, deps, args, opts) {
  var env = generators();

  deps = deps || [];
  deps.forEach(function(d) {
    d = Array.isArray(d) ? d : [d];
    env.register.apply(env, d);
  });

  env.register(path, name);

  return env.create(name, { arguments: args || [], options: opts || {} });
}

exports.createDummyProject = function(dir, name, done) {
  process.env.WORKSPACE_DIR = dir;
  Workspace.createFromTemplate('api-server', name, done);
};

exports.resetWorkspace = function(done) {
  async.each(workspace.models(), function(model, cb) {
    model.destroyAll(cb);
  }, done);
};

exports.findAllGeneratorsExcept = function(except) {
  var root = path.resolve(__dirname, '..');
  return fs.readdirSync(root)
    .filter(function(name) {
      var fullPath = path.join(root, name);
      return name !== except &&
        fs.statSync(fullPath).isDirectory() &&
        fs.existsSync(path.join(fullPath, 'index.js'));
    })
    .map(function(name) {
      return ['../../' + name, 'loopback:' + name];
    });
};

exports.createExampleGenerator = function() {
  var name = 'example';
  var path = '../../example';
  var deps = exports.findAllGeneratorsExcept('example');
  var args = [];
  var options = {
    'skip-install': true
  };

  return exports.createGenerator(name, path, deps, args, options);
};
