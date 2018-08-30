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
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var validateAppName = helpers.validateAppName;
var pkg = require('../package.json');
var ActionsMixin = require('../lib/actions');
var BluemixMixin = require('../bluemix/helpers');
var debug = require('debug')('loopback:generator:app');
var util = require('util');

module.exports = class AppGenerator extends ActionsMixin(yeoman) {
  constructor(args, opts) {
    super(args, opts);

    this.argument(g.f('name'), {
      desc: g.f('Name of the application to scaffold.'),
      required: false,
      type: String,
    });

    // For the options coming from Yeoman,
    // overwrite the description because they do not get translated.
    this._options['help'].desc = g.f('Print the command\'s options and usage');
    this._options['skip-cache'].desc = g.f('Do not remember prompt answers');
    this._options['skip-install'].desc = g.f('Do not install npm dependencies');

    this.option('skip-next-steps', {
      desc: g.f('Do not print "next steps" info'),
      type: Boolean,
    });

    this.option('explorer', {
      desc: g.f('Add {{Loopback Explorer}} to the project ({{true}} ' +
        'by default)'),
      type: Boolean,
    });

    this.option('loopbackVersion', {
      desc: g.f('Select the LoopBack version'),
      type: String,
    });

    this.option('template', {
      desc: g.f('Set up the LoopBack application template'),
      type: String,
    });

    this.option('bluemix', {
      desc: g.f('Set up as a Bluemix app'),
      type: Boolean,
    });

    if (helpers.getCommandName() === 'loopback-cli') {
      this.option('version', {
        desc: g.f('Display version information'),
        type: Boolean,
        default: false,
      });
    }
  }

  help() {
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
  }

  injectWorkspaceCopyRecursive() {
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

  loadTemplates() {
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

      if (this.options.template) {
        this.defaultTemplate = this.wsTemplate = this.options.template;
      } else {
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
      }
      done();
    }.bind(this));
  }

  askForProjectName() {
    if (this.arguments && this.arguments.length >= 1) {
      debug('app name is provided as %s', this.arguments[0]);
      this.appname = this.arguments[0];
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

  configureDestinationDirForApp() {
    this.configureDestinationDir();
  }

  fetchLoopBackVersions() {
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

  askForLBVersion() {
    var LBVersion = this.options.loopbackVersion;
    if (LBVersion) {
      var lbVersions = this.availableLBVersions.map(
        function(v) { return v.value; }
      );
      if (lbVersions.indexOf(LBVersion) === -1) {
        throw new Error('Invalid LoopBack version: ' +
          LBVersion + '. Available versions are ' +
          lbVersions.join(', ') + '.');
      }
      return;
    }
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

  applyFilterOnTemplate() {
    var LBVersion = this.options.loopbackVersion;
    var templates = this.templates;

    this.templates = templates.filter(function(t) {
      return t.supportedLBVersions.indexOf(LBVersion) !== -1;
    });
  }

  askForTemplate() {
    if (this.wsTemplate) {
      var templates = this.templates.map(function(t) { return t.value; });
      if (templates.indexOf(this.wsTemplate) === -1) {
        throw new Error('Invalid template: ' + this.wsTemplate +
          '. Available templates for ' + this.options.loopbackVersion +
          ' are ' + templates.join(', '));
      } else {
        return;
      }
    }
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

  initWorkspace() {
    this.initWorkspaceForGenerator();
  }

  detectExistingProject() {
    var cb = this.async();
    Workspace.isValidDir(function(err) {
      if (err) {
        cb();
      } else {
        cb(new Error(
          g.f('The generator must be run in an empty directory.')
        ));
      }
    });
  }

  project() {
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

  copyFiles() {
    this.directory('.', '.');
  }

  // call `this.fs.commit` to finish moving the template files
  // from memory to destination folder.
  commit() {
    var done = this.async();
    this.fs.commit(done);
  }

  generateYoRc() {
    if (!this.options.initBluemix) {
      this.log(g.f('Generating {{.yo-rc.json}}'));
      this.config.save();
    }
  }

  installing() {
    if (!this.options.initBluemix) {
      this.installDeps.call(this);
    }
  }

  bluemix() {
    if (this.options.bluemix) {
      this.log(g.f('\nBluemix configuration:'));
      this.composeWith(require.resolve('../bluemix'), this.options);
    }
  }
  printNextSteps() {
    if (this.options.initBluemix || this.options.skipNextSteps) return;

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

  promotion() {
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
      'http://ibm.biz/tryAPIC'
    )));
    this.log();
  }
};

// Export it for strong-cli to use
module.exports._package = pkg.name + ': ' + pkg.version;
module.exports._yeomanEnv = require('yeoman-environment');
module.exports.workspaceVersion =
  require('loopback-workspace/package.json').version;
