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
var lbBm = require('loopback-bluemix');
var provision = require('loopback-bluemix').provision;

module.exports = function BluemixMixin(baseClass) {
  return class extends baseClass {
    constructor(args, opts) {
      super(args, opts);
    }
    // All actions defined in this file should be called with `this` pointing
    // to a generator instance

    promptServiceName() {
      if (!this.done && this.options && this.options.provision) {
        provision.promptServiceName(this, g);
      }
    }

    getServicePlans() {
      if (!this.done && this.options && this.options.provision) {
        provision.getServicePlans(this);
      }
    }

    promptServicePlan() {
      if (!this.done && this.options && this.options.provision) {
        provision.promptServicePlan(this, g);
      }
    }

    provisionService() {
      if (!this.done && this.options && this.options.provision) {
        provision.provisionService(this, g);
        this.done = true;
      }
    }

    /**
 * Prepare prompts for bluemix options
 */
    configurePrompt() {
      if (this.done) return;
      this.options = this.options || {};
      // https://github.com/strongloop/generator-loopback/issues/38
      // yeoman-generator normalize the appname with ' '
      this.appName = (this.options.appName) ||
        path.basename(process.cwd()).replace(/[\/@\s\+%:\.]+?/g, '-');

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
      this.prompt([manifestPrompt]).then((answers) => {
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

        this.prompt(prompts).then((answers) => {
          this.appMemory = answers.appMemory;
          this.appInstances = answers.appInstances;
          this.appDomain = answers.appDomain;
          this.appHost = answers.appHost;
          this.appDiskQuota = answers.appDiskQuota;
          this.enableDocker = answers.enableDocker || this.enableDocker;
          this.enableToolchain = answers.enableToolchain ||
            this.enableToolchain;
          this.bluemix = this.enableManifest || this.enableDocker ||
          this.enableToolchain;
          done();
        });
      });
    }

    generateFiles() {
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
    }

    promptDefaultServices() {
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

        return this.prompt(prompts).then(function(answers) {
          this.enableAutoScaling = answers.enableAutoScaling;
          this.enableAppMetrics = answers.enableAppMetrics;
        }.bind(this));
      }
    }

    addDefaultServices() {
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
    }

    login() {
      require('./login');
    }
  };
};
