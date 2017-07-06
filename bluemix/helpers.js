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
var provision = require('loopback-bluemix').provision;

var bluemix = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance

bluemix.promptServiceName = function() {
  if (!this.done && this.options.provision) {
    provision.promptServiceName(this, g);
  }
};

bluemix.getServicePlans = function() {
  if (!this.done && this.options.provision) {
    provision.getServicePlans(this);
  }
};

bluemix.promptServicePlan = function() {
  if (!this.done && this.options.provision) {
    provision.promptServicePlan(this, g);
  }
};

bluemix.provisionService = function() {
  if (!this.done && this.options.provision) {
    provision.provisionService(this, g);
    this.done = true;
  }
};

/**
 * Prepare prompts for bluemix options
 */
bluemix.configurePrompt = function() {
  if (this.done) return;
  // https://github.com/strongloop/generator-loopback/issues/38
  // yeoman-generator normalize the appname with ' '
  this.appName = path.basename(process.cwd())
                .replace(/[\/@\s\+%:\.]+?/g, '-');

  // Generate .bluemix/...
  this.enableBluemix = this.options.bluemix;
  // Generate manifest.yml
  this.enableManifest = this.options.manifest;
  // Generate docker file
  this.enableDocker = this.options.docker;
  // Generate toolchain files
  this.enableToolchain = this.options.toolchain;
  this.bluemix = this.enableManifest || this.enableDocker ||
    this.enableToolchain || this.options.login || this.options.sso;
  // Add default services
  this.enableDefaultServices = !this.bluemix;

  if (this.bluemix) {
    this.log(g.f('Bluemix-specific configuration:'));
  }

  var manifestPrompt = {
    name: 'enableManifest',
    message: g.f('Do you want to create manifest.yml?'),
    type: 'confirm',
    default: true,
    // Only prompt if no explicit option such as --manifest or --docker
    // is not present
    when: !this.bluemix,
  };

  var done = this.async();
  this.prompt([manifestPrompt]).then(function(answers) {
    this.enableManifest = answers.enableManifest || this.enableManifest;
    var prompts = [];
    if (this.enableManifest) {
      var manifestFilePath = path.resolve('.', 'manifest.yml');
      var manifest = {};
      if (fs.existsSync(manifestFilePath)) {
        manifest = yaml.load(fs.readFileSync(manifestFilePath));
      }

      var appMemoryPrompt = {
        name: 'appMemory',
        message: g.f('How much memory to allocate for the app?'),
        default: manifest.memory || '256M',
        filter: helpers.normalizeSize,
        validate: helpers.validateAppMemory,
        when: this.enableManifest,
      };

      var appInstancesPrompt = {
        name: 'appInstances',
        message: g.f('How many instances of app to run?'),
        default: manifest.instances || 1,
        validate: helpers.validateAppInstances,
        when: this.enableManifest,
      };

      var appDomainPrompt = {
        name: 'appDomain',
        message: g.f('What is the domain name of the app?'),
        default: manifest.domain || 'mybluemix.net',
        validate: helpers.validateAppDomain,
        when: this.enableManifest,
      };

      var appHostPrompt = {
        name: 'appHost',
        message: g.f('What is the subdomain of the app?'),
        default: manifest.host || this.appName,
        validate: helpers.validateAppHost,
        when: this.enableManifest,
      };

      var appDiskQuotaPrompt = {
        name: 'appDiskQuota',
        message: g.f('How much disk space to allocate for the app?'),
        default: manifest.disk_quota || '1G',
        filter: helpers.normalizeSize,
        validate: helpers.validateAppDiskQuota,
        when: this.enableManifest,
      };

      prompts.push(appMemoryPrompt, appInstancesPrompt, appDomainPrompt,
        appHostPrompt, appDiskQuotaPrompt);
    }

    var toolchainPrompt = {
      name: 'enableToolchain',
      message: g.f('Do you want to create toolchain files?'),
      type: 'confirm',
      default: true,
      when: !this.bluemix,
    };

    var dockerPrompt = {
      name: 'enableDocker',
      message: g.f('Do you want to create Dockerfile?'),
      type: 'confirm',
      default: true,
      when: !this.bluemix,
    };

    prompts.push(toolchainPrompt, dockerPrompt);

    this.prompt(prompts).then(function(answers) {
      this.appMemory = answers.appMemory;
      this.appInstances = answers.appInstances;
      this.appDomain = answers.appDomain;
      this.appHost = answers.appHost;
      this.appDiskQuota = answers.appDiskQuota;
      this.enableDocker = answers.enableDocker || this.enableDocker;
      this.enableToolchain = answers.enableToolchain || this.enableToolchain;
      this.bluemix = this.enableManifest || this.enableDocker ||
        this.enableToolchain;
      done();
    }.bind(this));
  }.bind(this));
};

bluemix.generateFiles = function() {
  if (this.done) return;
  if (this.bluemix) {
    var bluemixOptions = {
      destDir: this.destinationRoot(),
      enableBluemix: this.enableBluemix,
      enableManifest: this.enableManifest,
      enableDocker: this.enableDocker,
      enableToolchain: this.enableToolchain,
    };
    lbBm.generateBluemixFiles(bluemixOptions,
      this.copy.bind(this), this.directory.bind(this));
  }
};

bluemix.promptDefaultServices = function() {
  if (this.done) return;
  if (this.enableDefaultServices) {
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
  if (this.done) return;
  if (this.enableDefaultServices) {
    var done = this.async();
    var options = {
      bluemix: true,
      enableAutoScaling: this.enableAutoScaling,
      enableAppMetrics: this.enableAppMetrics,
      destDir: this.destinationRoot(),
    };
    lbBm.addDefaultServices(options, done);
  }
};

bluemix.login = require('./login');
