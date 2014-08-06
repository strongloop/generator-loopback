'use strict';
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateAppName = helpers.validateAppName;
var pkg = require('../package.json');

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the application to scaffold.',
      required: false,
      type: String
    });

    this.option('skip-install', {
      desc: 'Do not install npm dependencies.',
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
      this.directory(src, dest);
      process.nextTick(cb);
    }.bind(this);

    // Restore the original method when done
    this.on('end', function() {
      Workspace.copyRecursive = originalMethod;
    });
  },

  askForDestinationDir: actions.askForDestinationDir,

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

  loadTemplates: function() {
    var done = this.async();

    Workspace.getAvailableTemplates(function(err, list) {
      if (err) return done(err);
      this.templates = list.map(function(t) {
        return {
          // TODO(bajtos) - workspace does not provide template details yet
          // name: util.format('%s (%s)', t.name, t.description),
          // value: t.name
          name: t,
          value: t
        };
      });
      done();
    }.bind(this));
  },

  askForParameters: function() {
    var done = this.async();

    var name = this.name || this.dir || this.appname;

    var prompts = [
      {
        name: 'appname',
        message: 'What\'s the name of your application?',
        default: name,
        validate: validateAppName
      }
      /*
       TODO(bajtos) not all templates are projects, some of them are components
       The only functional project template is 'api-server' at the moment
      {
        name: 'template',
        message: 'What kind of application do you have in mind?',
        type: 'list',
        default: 'api-server',
        choices: this.templates
      }
       */
    ];

    this.prompt(prompts, function(props) {
      this.appname = props.appname;
      // TODO(bajtos) see the TODO comment above
      //this.template = props.template;
      this.template = 'api-server';

      done();
    }.bind(this));
  },

  project: function() {
    var done = this.async();

    Workspace.createFromTemplate(
      this.template,
      this.appname,
      done
    );
  },

  copyFiles: function() {
    this.directory('.', '.');
  },

  installDeps: actions.installDeps,

  whatsNext: function() {
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
    this.log('  Create a model in your app');
    this.log(chalk.green('    $ ' + cmd + ' loopback:model'));
    this.log();
    this.log('  Optional: Enable StrongOps monitoring');
    this.log(chalk.green('    $ ' + cmd + ' strongops'));
    this.log();
    this.log('  Run the app');
    this.log(chalk.green('    $ ' + cmd + ' run .'));
    this.log();
  }
});

// Export it for strong-cli to use
module.exports._package = pkg.name + ': ' + pkg.version;
module.exports._yeoman = yeoman;
