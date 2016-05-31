// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var async = require('async');
var fs = require('fs');
var path = require('path');
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var helpers = require('yeoman-test');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

exports.createGenerator = createGenerator;

function createGenerator(name, path, args, opts) {
  path = Array.isArray(path) ? path : [path];
  return helpers.createGenerator(name, path, args, opts);
}

exports.createDummyProject = function(dir, name, done) {
  process.env.WORKSPACE_DIR = dir;
  Workspace.createFromTemplate('api-server', name, done);
};

exports.resetWorkspace = function(done) {
  async.each(workspace.models(), function(model, cb) {
    if (typeof model.destroyAll === 'function') {
      model.destroyAll(cb);
    } else {
      cb();
    }
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

exports.readJsonSync = function(relativePath, defaultValue) {
    var filepath = path.resolve(SANDBOX, relativePath);
    if (defaultValue !== undefined && !fs.existsSync(filepath))
      return defaultValue;

    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
};
