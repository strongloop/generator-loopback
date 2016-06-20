// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var fs = require('fs');
var path = require('path');
var util = require('util');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateAppName = helpers.validateAppName;
var pkg = require('../package.json');

module.exports = yeoman.Base.extend({
  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the application to scaffold.',
      required: false,
      type: String
    });

    this.option('skip-install', {
      desc: 'Do not install npm dependencies.',
      type: Boolean
    });

    this.option('skip-next-steps', {
      desc: 'Do not print "next steps" info',
      type: Boolean
    });

    this.option('explorer', {
      desc: 'Add Loopback Explorer to the project (true by default)',
      type: Boolean
    });
  },

  greet: function() {
    this.log(yosay('Let\'s create a LoopBack application!'));
  },

  help: function() {
    var msgs = [helpers.customHelp(this)];
    msgs.push('Available generators: \n\n  ');
    msgs.push(Object.keys(this.options.env.getGeneratorsMeta())
      .filter(function (name) {
        return name.indexOf('loopback:') !== -1;
      }).join('\n  '));
    return msgs.join('');
  },

  injectWorkspaceCopyRecursive: function() {
    var originalMethod = Workspace.copyRecursive;
    Workspace.copyRecursive = function(src, dest, cb) {
      var isDir = fs.statSync(src).isDirectory();
      if (isDir) {
        this.directory(src, dest);
      }
      else
        this.copy(src, dest);
      process.nextTick(cb);
    }.bind(this);

    // Restore the original method when done
    this.on('end', function() {
      Workspace.copyRecursive = originalMethod;
    });
  },

  loadTemplates: function() {
    var done = this.async();

    Workspace.describeAvailableTemplates(function(err, list) {
      if (err) return done(err);
      this.templates = list.map(function(t) {
        return {
          name: util.format('%s (%s)', t.name, t.description),
          value: t.name
        };
      });

      // TODO(bajtos) generator-loopback should not be coupled with APIC
      // See also https://github.com/strongloop/generator-loopback/issues/139
      if (helpers.getCommandName() === 'apic') {
        this.defaultTemplate = 'hello-world';
        this.templates = this.templates.filter(function (t) {
          return t.value !== 'api-server';
        });
      } else {
        this.defaultTemplate = 'api-server';
      }
      done();
    }.bind(this));
  },

  askForProjectName: function() {
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
        message: 'What\'s the name of your application?',
        default: name,
        validate: validateAppName
      }
    ];

    return this.prompt(prompts).then(function(props) {
      this.appname = props.appname || this.appname;
    }.bind(this));
  },

  configureDestinationDir: actions.configureDestinationDir,

  askForTemplate: function() {
    var prompts = [{
      name: 'wsTemplate',
      message: 'What kind of application do you have in mind?',
      type: 'list',
      default: this.defaultTemplate,
      choices: this.templates
    }];

    var self = this;
    return this.prompt(prompts).then(function(answers) {
      // Do NOT use name template as it's a method in the base class
      self.wsTemplate = answers.wsTemplate;
    }.bind(this));
  },

  askForLBVersion: function() {
    var prompts = [{
      name: 'loopbackVersion',
      message: 'Which version of LoopBack would you like to use?',
      type: 'list',
      default: '2.x',
      choices: ['2.x', '3.x']
    }];

    var self = this;
    return this.prompt(prompts).then(function(answers) {
      self.options.loopbackVersion = answers.loopbackVersion;
    }.bind(this));
  },

  initWorkspace: actions.initWorkspace,

  detectExistingProject: function() {
    var cb = this.async();
    Workspace.isValidDir(function(err) {
      if (err) {
        cb();
      } else {
        cb(new Error('The generator must be run in an empty directory.'));
      }
    });
  },

  project: function() {
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
  },

  copyFiles: function() {
    this.directory('.', '.');
  },

  generateYoRc: function() {
    this.log('Generating .yo-rc.json');
    this.config.save();
  },

  installing: actions.installDeps,

  end: function() {
    if (this.options.skipNextSteps) return;

    var cmd = helpers.getCommandName();
    if (!this._skipInstall) {
      this.log();
      this.log();
    }

    this.log('Next steps:');
    this.log();
    if (this.dir && this.dir !== '.') {
      this.log('  Change directory to your app');
      this.log(chalk.green('    $ cd ' + this.dir));
      this.log();
    }
    if (cmd === 'apic') {
      this.log('  Run API Designer to create, test, and publish your' +
        ' application');
      this.log(chalk.green('    $ apic edit'));
      this.log();
    } else {
      this.log('  Create a model in your app');
      this.log(chalk.green('    $ ' + cmd + ' loopback:model'));
      this.log();
      this.log(
        '  Compose your API, run, deploy, profile, and monitor it with Arc');
      this.log(chalk.green('    $ slc arc'));
      this.log();
      this.log('  Run the app');
      this.log(chalk.green('    $ node .'));
      this.log();
    }
  }
});

// Export it for strong-cli to use
module.exports._package = pkg.name + ': ' + pkg.version;
module.exports._yeoman = yeoman;
