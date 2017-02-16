// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('strong-globalize')();
var fs = require('fs');
var yaml = require('yaml-js');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var lbBm = require('loopback-bluemix');

var bluemix = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance

/**
 * Prepare prompts for bluemix options
 */
bluemix.configurePrompt = function() {
  // https://github.com/strongloop/generator-loopback/issues/38
  // yeoman-generator normalize the appname with ' '
  this.appName = path.basename(process.cwd())
                .replace(/[\/@\s\+%:\.]+?/g, '-');

  var manifestFilePath = path.resolve('.', 'manifest.yml');
  var manifest = {};
  if (fs.existsSync(manifestFilePath)) {
    manifest = yaml.load(fs.readFileSync(manifestFilePath)).applications[0];
  }

  var appMemoryPrompt = {
    name: 'appMemory',
    message: g.f('How much memory to allocate for the app?'),
    default: manifest.memory || '256M',
    filter: helpers.normalizeSize,
    validate: helpers.validateAppMemory,
  };

  var appInstancesPrompt = {
    name: 'appInstances',
    message: g.f('How many instances of app to run?'),
    default: manifest.instances || 1,
    validate: helpers.validateAppInstances,
  };

  var appDomainPrompt = {
    name: 'appDomain',
    message: g.f('What is the domain name of the app?'),
    default: manifest.domain || 'mybluemix.net',
    validate: helpers.validateAppDomain,
  };

  var appHostPrompt = {
    name: 'appHost',
    message: g.f('What is the subdomain of the app?'),
    default: manifest.host || this.appName,
    validate: helpers.validateAppHost,
  };

  var appDiskQuotaPrompt = {
    name: 'appDiskQuota',
    message: g.f('How much disk space to allocate for the app?'),
    default: manifest.disk_quota || '1G',
    filter: helpers.normalizeSize,
    validate: helpers.validateAppDiskQuota,
  };

  var toolchainPrompt = {
    name: 'enableToolchain',
    message: g.f('Do you want to create toolchain files?'),
    type: 'confirm',
  };

  var dockerPrompt = {
    name: 'enableDocker',
    message: g.f('Do you want create Dockerfile?'),
    type: 'confirm',
  };

  this.prompts = [];
  if (this.options.bluemix) {
    var allPrompts = [
      appMemoryPrompt, appInstancesPrompt, appDomainPrompt, appHostPrompt,
      appDiskQuotaPrompt, toolchainPrompt, dockerPrompt,
    ];
    this.prompts = allPrompts;
    this.bluemixCommand = 'bluemix';
  } else {
    if (this.options.toolchain) {
      this.bluemixCommand = 'toolchain';
      this.prompts.push(toolchainPrompt);
    } else if (this.options.docker) {
      this.bluemixCommand = 'docker';
    } else {
      this.prompts.push(appMemoryPrompt);
      this.prompts.push(appInstancesPrompt);
      this.prompts.push(appDomainPrompt);
      this.prompts.push(appHostPrompt);
      this.prompts.push(appDiskQuotaPrompt);
      if (this.options.manifest) {
        this.bluemixCommand = 'manifest';
      } else {
        this.bluemixCommand = 'bluemix';
        this.prompts.push(dockerPrompt);
        this.prompts.push(toolchainPrompt);
      }
    }
  }
};

bluemix.promptSettings = function() {
  if (this.bluemixCommand === 'bluemix' || this.bluemixCommand === 'manifest') {
    if (this.options.bluemix) {
      this.log(g.f('\n  Bluemix-specific configuration:\n'));
    }
    return this.prompt(this.prompts).then(function(answers) {
      this.appMemory = answers.appMemory;
      this.appInstances = answers.appInstances;
      this.appDomain = answers.appDomain;
      this.appHost = answers.appHost;
      this.appDiskQuota = answers.appDiskQuota;
      this.enableDocker = answers.enableDocker;
      this.enableToolchain = answers.enableToolchain;
    }.bind(this));
  }
};

bluemix.generateFiles = function() {
  if (this.bluemixCommand === 'bluemix' || this.bluemixCommand === 'manifest' ||
      this.bluemixCommand === 'toolchain' || this.bluemixCommand === 'docker') {
    var bluemixOptions = {
      destDir: this.destinationRoot(),
      bluemixCommand: this.bluemixCommand,
      enableDocker: this.enableDocker,
      enableToolchain: this.enableToolchain,
      cmdOptions: this.options,
    };
    lbBm.generateBluemixFiles(bluemixOptions,
                                  this.copy.bind(this),
                                  this.directory.bind(this));
  }
};

bluemix.promptDefaultServices = function() {
  if (this.bluemixCommand === 'bluemix') {
    var prompts = [
      {
        name: 'enableAutoScaling',
        message: g.f('Do you want to enable autoscaling?'),
        type: 'confirm',
      },
      {
        name: 'enableAppMetrics',
        message: g.f('Do you want to enable appmetrics?'),
        type: 'confirm',
      },
    ];

    var self = this;
    return this.prompt(prompts).then(function(answers) {
      self.enableAutoScaling = answers.enableAutoScaling;
      self.enableAppMetrics = answers.enableAppMetrics;
    }.bind(this));
  }
};

bluemix.addDefaultServices = function() {
  if (this.bluemixCommand === 'bluemix' || this.options.bluemix) {
    var options = {
      bluemix: true,
      enableAutoScaling: this.enableAutoScaling,
      enableAppMetrics: this.enableAppMetrics,
      destDir: this.destinationRoot(),
    };
    lbBm.addDefaultServices(options);
  }
};
