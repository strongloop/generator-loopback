// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('../lib/globalize');
var yeoman = require('yeoman-generator');
var fs = require('fs');
var ActionsMixin = require('../lib/actions');
var helpText = require('../lib/help');
var BluemixMixin = require('./helpers');

module.exports = class BluemixGenerator extends
  BluemixMixin(ActionsMixin(yeoman)) {
  constructor(args, opts) {
    super(args, opts);
    this.done = false;

    this.option('appName', {
      desc: g.f('Application name'),
      type: String,
    });

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
  }

  help() {
    return helpText.customHelp(this, 'loopback_bluemix_usage.txt');
  }

  validateLoopBackDir() {
    var root = this.destinationRoot();
    if (!(this.options.login || this.options.sso)) {
      if (
        !fs.existsSync(path.join(root, 'package.json')) ||
        !fs.existsSync(path.join(root, 'server', 'server.js'))
      ) {
        throw new Error('Invalid LoopBack directory');
      }
    }
  }

  loginToBluemix() {
    this.login.apply(this);
  }

  bmPromptServiceName() {
    this.promptServiceName();
  }

  bmGetServicePlans() {
    this.getServicePlans();
  }

  bmPromptServicePlan() {
    this.promptServicePlan();
  }

  bmProvisionService() {
    this.provisionService();
  }

  bmConfigurePrompt() {
    this.configurePrompt();
  }

  bmPromptBluemixSettings() {
    if (this.promptSettings) {
      this.promptSettings();
    }
  }

  bmGenerateBluemixFiles() {
    this.generateFiles();
  }

  bmPromptDefaultServices() {
    this.promptDefaultServices();
  }

  bmAddDefaultServices() {
    this.addDefaultServices();
  }
};
