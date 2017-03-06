// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('../lib/globalize');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var fs = require('fs');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var validateAppName = helpers.validateAppName;
var pkg = require('../package.json');

module.exports = yeoman.Base.extend({
  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.argument('name', {
      desc: g.f('Name of the application to scaffold.'),
      required: false,
      type: String,
    });

    this.option('skip-install', {
      desc: g.f('Do not install npm dependencies.'),
      type: Boolean,
    });

    this.option('skip-next-steps', {
      desc: g.f('Do not print "next steps" info'),
      type: Boolean,
    });

    this.option('explorer', {
      desc: g.f('Add {{Loopback Explorer}} to the project ({{true}} ' +
        'by default)'),
      type: Boolean,
    });

    this.option('bluemix', {
      desc: g.f('Set up as a Bluemix app'),
      type: Boolean,
    });

    this.option('init-bluemix', {
      desc: g.f('Convert an existing into a Bluemix app'),
      type: Boolean,
    });
  },

  greet: function() {
    this.log(yosay(g.f('Let\'s create a {{LoopBack}} application!')));
  },

  help: function() {
    var msgs = [helpText.customHelp(this, 'loopback_app_usage.txt')];

    var list = Object.keys(this.options.env.getGeneratorsMeta())
      .filter(function(name) {
        return name.indexOf('loopback:') !== -1;
      });
    if (helpers.getCommandName() === 'loopback-cli') {
      list = list.map(name => name.replace(/^loopback:/, 'lb '));
      msgs.push(g.f('\nAvailable commands:\n\n'));
    } else {
      msgs.push(g.f('\nAvailable generators:\n\n'));
    }

    msgs.push(list.map(it => '  ' + it).join('\n'));
    return msgs.join('') + '\n';
  },

  validateLoopBackDir: function() {
    if (this.options.initBluemix) {
      if (!fs.existsSync(path.join(process.cwd(), 'package.json')) ||
          !fs.existsSync(path.join(process.cwd(), 'server', 'server.js'))) {
        console.log(chalk.red(' Invalid LoopBack directory\n'));
        process.exit();
      }
    }
  },

  injectWorkspaceCopyRecursive: function() {
    if (!this.options.initBluemix) {
      var originalMethod = Workspace.copyRecursive;
      Workspace.copyRecursive = function(src, dest, cb) {
        var isDir = fs.statSync(src).isDirectory();
        if (isDir) {
          this.directory(src, dest);
        } else {
          this.copy(src, dest);
        }
        return cb && process.nextTick(cb);
      }.bind(this);

      // Restore the original method when done
      this.on('end', function() {
        Workspace.copyRecursive = originalMethod;
      });
    }
  },

  loadTemplates: function() {
    if (!this.options.initBluemix) {
      var done = this.async();

      Workspace.describeAvailableTemplates(function(err, list) {
        if (err) return done(err);
        this.templates = list.map(function(t) {
          return {
            name: g.f('%s (%s)', t.name, t.description),
            value: t.name,
            supportedLBVersions: t.supportedLBVersions,
          };
        });

        // TODO(bajtos) generator-loopback should not be coupled with APIC
        // See also https://github.com/strongloop/generator-loopback/issues/139
        if (helpers.getCommandName() === 'apic') {
          this.defaultTemplate = 'hello-world';
          this.templates = this.templates.filter(function(t) {
            return t.value !== 'api-server';
          });
        } else {
          this.defaultTemplate = 'api-server';
        }
        done();
      }.bind(this));
    }
  },

  askForProjectName: function() {
    if (!this.options.initBluemix) {
      if (this.options.nested && this.name) {
        this.appname = this.name;
        return;
      }

      // https://github.com/strongloop/generator-loopback/issues/38
      // yeoman-generator normalize the appname with ' '
      this.appname =
        path.basename(process.cwd()).replace(/[\/@\s\+%:\.]+?/g, '-');

      var name = this.name || this.dir || this.appname;

      var prompts = [
        {
          name: 'appname',
          message: g.f('What\'s the name of your application?'),
          default: name,
          validate: validateAppName,
        },
      ];

      return this.prompt(prompts).then(function(props) {
        this.appname = props.appname || this.appname;
      }.bind(this));
    }
  },

  configureDestinationDir: function() {
    if (!this.options.initBluemix) {
      actions.configureDestinationDir.call(this);
    }
  },

  fetchLoopBackVersions: function() {
    if (!this.options.initBluemix) {
      var done = this.async();
      var self = this;
      Workspace.getAvailableLBVersions(function(err, versionsMap) {
        if (err) return done(err);
        var versionNames = Object.keys(versionsMap);
        self.availableLBVersions = versionNames.map(function(version) {
          return {
            name: version + ' (' + versionsMap[version].description + ')',
            value: version,
          };
        });
        done();
      });
    }
  },

  askForLBVersion: function() {
    if (!this.options.initBluemix) {
      var prompts = [{
        name: 'loopbackVersion',
        message: g.f('Which version of {{LoopBack}} would you like to use?'),
        type: 'list',
        default: '3.x',
        choices: this.availableLBVersions,
      }];

      var self = this;
      return this.prompt(prompts).then(function(answers) {
        self.options.loopbackVersion = answers.loopbackVersion;
      }.bind(this));
    }
  },

  applyFilterOnTemplate: function() {
    if (!this.options.initBluemix) {
      var LBVersion = this.options.loopbackVersion;
      var templates = this.templates;

      this.templates = templates.filter(function(t) {
        return t.supportedLBVersions.indexOf(LBVersion) !== -1;
      });
    }
  },

  askForTemplate: function() {
    if (!this.options.initBluemix) {
      var prompts = [{
        name: 'wsTemplate',
        message: g.f('What kind of application do you have in mind?'),
        type: 'list',
        default: this.defaultTemplate,
        choices: this.templates,
      }];

      var self = this;
      return this.prompt(prompts).then(function(answers) {
        // Do NOT use name template as it's a method in the base class
        self.wsTemplate = answers.wsTemplate;
      }.bind(this));
    }
  },

  initWorkspace: function() {
    if (!this.options.initBluemix) {
      actions.initWorkspace.call(this);
    }
  },

  detectExistingProject: function() {
    if (!this.options.initBluemix) {
      var cb = this.async();
      Workspace.isValidDir(function(err) {
        if (err) {
          cb();
        } else {
          cb(new Error(
            g.f('The generator must be run in an empty directory.'))
          );
        }
      });
    }
  },

  project: function() {
    if (!this.options.initBluemix) {
      var done = this.async();

      Workspace.createFromTemplate(
        this.wsTemplate,
        this.appname,
        {
          'loopbackVersion': this.options.loopbackVersion,
          'loopback-component-explorer': this.options.explorer !== false,
        },
        done
      );
    }
  },

  copyFiles: function() {
    if (!this.options.initBluemix) {
      this.directory('.', '.');
    }
  },

  promptBluemixSettings: function() {
    if (this.options.bluemix || this.options.initBluemix) {
      if (!this.options.initBluemix) {
        this.log(g.f('\n  Bluemix configurations:\n'));
      }

      // https://github.com/strongloop/generator-loopback/issues/38
      // yeoman-generator normalize the appname with ' '
      this.appName =
        path.basename(process.cwd()).replace(/[\/@\s\+%:\.]+?/g, '-');

      var prompts = [
        {
          name: 'appMemory',
          message: g.f('How much memory to allocate for the app?'),
          default: 256,
          validate: helpers.validateAppMemory,
        },
        {
          name: 'appInstances',
          message: g.f('How many instances of app to run?'),
          default: 1,
          validate: helpers.validateAppInstances,
        },
        {
          name: 'appDomain',
          message: g.f('What is the domain name of the app?'),
          default: 'mybluemix.net',
          validate: helpers.validateAppDomain,
        },
        {
          name: 'appHost',
          message: g.f('What is the subdomain of the app?'),
          default: this.appName,
          validate: helpers.validateAppHost,
        },
        {
          name: 'appDiskQuota',
          message: g.f('How much disk space to allocate for the app?'),
          default: 1024,
          validate: helpers.validateAppDiskQuota,
        },
      ];

      var self = this;
      return this.prompt(prompts).then(function(answers) {
        self.appMemory = answers.appMemory;
        self.appInstances = answers.appInstances;
        self.appDomain = answers.appDomain;
        self.appHost = answers.appHost;
        self.appDiskQuota = answers.appDiskQuota;
      }.bind(this));
    }
  },

  generateBluemixFiles: function() {
    if (this.options.bluemix || this.options.initBluemix) {
      var options = {
        bluemix: true,
        destDir: this.destinationRoot(),
      };
      Workspace.generateBluemixFiles(options,
                                    this.copy.bind(this),
                                    this.directory.bind(this));
    }
  },

  promptDefaultServices: function() {
    if (this.options.bluemix || this.options.initBluemix) {
      var prompts = [
        {
          name: 'enableAutoScaling',
          message: g.f('Do you want to enable autoscaling?'),
          default: 'no',
          validate: helpers.validateYesNo,
        },
        {
          name: 'enableAppMetrics',
          message: g.f('Do you want to enable appmetrics?'),
          default: 'no',
          validate: helpers.validateYesNo,
        },
      ];

      var self = this;
      return this.prompt(prompts).then(function(answers) {
        self.enableAutoScaling = answers.enableAutoScaling;
        self.enableAppMetrics = answers.enableAppMetrics;
      }.bind(this));
    }
  },

  generateYoRc: function() {
    if (!this.options.initBluemix) {
      this.log(g.f('Generating {{.yo-rc.json}}'));
      this.config.save();
    }
  },

  installing: function() {
    if (!this.options.initBluemix) {
      actions.installDeps.call(this);
    }
  },
  end: {
    addDefaultServices: function() {
      if (this.options.bluemix || this.options.initBluemix) {
        var options = {
          bluemix: true,
          enableAutoScaling: this.enableAutoScaling,
          enableAppMetrics: this.enableAppMetrics,
          destDir: this.destinationRoot(),
        };
        Workspace.addDefaultServices(options);
      } else {
        Workspace.removeDefaultServices(this.destinationRoot());
      }
    },
    printNextSteps: function() {
      if (!this.options.initBluemix) {
        if (this.options.skipNextSteps) return;

        var cmd = helpers.getCommandName();
        if (!this._skipInstall) {
          this.log();
          this.log();
        }

        this.log(g.f('Next steps:'));
        this.log();
        if (this.dir && this.dir !== '.') {
          this.log(g.f('  Change directory to your app'));
          this.log(chalk.green('    $ cd ' + this.dir));
          this.log();
        }
        if (cmd === 'apic') {
          this.log(g.f('  Run {{API Designer}} to create, test, ' +
            ' and publish your application'));
          this.log(chalk.green('    $ apic edit'));
          this.log();
        } else {
          this.log(g.f('  Create a model in your app'));
          if (cmd === 'loopback-cli')
            this.log(chalk.green('    $ lb model'));
          else
            this.log(chalk.green('    $ ' + cmd + ' loopback:model'));
          this.log();
          this.log(g.f('  Run the app'));
          this.log(chalk.green('    $ node .'));
          this.log();
        }
      }
    },

    promotion: function() {
      var cmd = helpers.getCommandName();
      if (cmd !== 'loopback-cli') return;
      if (this.options.skipNextSteps) {
        this.log();
      }

      this.log(chalk.blue(g.f(
        'The API Connect team at IBM happily continues to develop,\n' +
          'support and maintain LoopBack, which is at the core of\n' +
          'API Connect. When your APIs need robust management and\n' +
          'security options, please check out %s',
        'http://ibm.biz/tryAPIC')));
      this.log();
    },
  },
});

// Export it for strong-cli to use
module.exports._package = pkg.name + ': ' + pkg.version;
module.exports._yeoman = yeoman;
