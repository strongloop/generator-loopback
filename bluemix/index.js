// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('../lib/globalize');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;
var fs = require('fs');
var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var bluemix = require('./helpers');
var validateAppName = helpers.validateAppName;
var pkg = require('../package.json');

module.exports = yeoman.Base.extend({
  constructor: function() {
    yeoman.Base.apply(this, arguments);
    this.done = false;
    this.option('docker', {
      desc: g.f('Generate Dockerfile'),
      type: Boolean,
    });

    this.option('manifest', {
      desc: g.f('Generate Bluemix manifest file'),
      type: Boolean,
    });

    this.option('toolchain', {
      desc: g.f('Set up Bluemix toolchain'),
      type: Boolean,
    });

    this.option('login', {
      desc: g.f('Log into Bluemix'),
      type: Boolean,
      default: false,
    });

    this.option('sso', {
      desc: g.f('Log into Bluemix with SSO'),
      type: Boolean,
    });

    this.option('provision', {
      desc: g.f('Provision a Bluemix service'),
      type: Boolean,
      default: false,
    });
  },

  help: function() {
    return helpText.customHelp(this, 'loopback_bluemix_usage.txt');
  },

  validateLoopBackDir: function() {
    var root = this.destinationRoot();
    if (!(this.options.login || this.options.sso)) {
      if (!fs.existsSync(path.join(root, 'package.json')) ||
        !fs.existsSync(path.join(root, 'server', 'server.js'))) {
        this.log(chalk.red('\n Invalid LoopBack directory\n'));
        process.exit();
      }
    }
  },

  loginToBluemix: function() {
    bluemix.login.apply(this);
  },

  promptServiceName: bluemix.promptServiceName,
  getServicePlans: bluemix.getServicePlans,
  promptServicePlan: bluemix.promptServicePlan,
  provisionService: bluemix.provisionService,

  configurePrompt: bluemix.configurePrompt,
  promptBluemixSettings: bluemix.promptSettings,
  generateBluemixFiles: bluemix.generateFiles,
  promptDefaultServices: bluemix.promptDefaultServices,
  addDefaultServices: bluemix.addDefaultServices,
});
