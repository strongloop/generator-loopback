'use strict';
var util = require('util');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Project = workspace.models.Project;

var LoopBackGenerator = module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      description: 'Name of the application to scaffold.',
      required: false,
      type: String
    });
  },

  injectProjectWriteFile: function() {
    // Modify Project.writeFile use yeoman's write
    var _projectWriteFile = Project.writeFile;
    Project.writeFile = function(filepath, content, encoding, cb) {
      this.write(filepath, content, { encoding: encoding });
      cb();
    }.bind(this);

    // Restore Project.writeFile when done
    this.on('end', function() {
      Project.writeFile = _projectWriteFile;
    });
  },

  init: function() {
    this.pkg = require('../package.json');
  },

  askForParameters: function() {
    var done = this.async();

    this.log(yosay('Let\'s create a LoopBack application!'));

    var name = this.name || this.appname;

    var prompts = [
      {
        name: 'appname',
        message: 'What\'s the name of your application?',
        default: name
      },
      {
        name: 'template',
        message: 'What kind of application do you have in mind?',
        type: 'list',
        default: 'mobile',
        choices: Project.listTemplates().map(function(t) {
          return {
            name: util.format('%s (%s)', t.name, t.description),
            value: t.name
          };
        }),
      }
    ];

    this.prompt(prompts, function(props) {
      this.appname = props.appname;
      this.template = props.template;

      done();
    }.bind(this));
  },

  project: function() {
    var done = this.async();

    Project.createFromTemplate(
      this.destinationRoot(),
      this.appname,
      this.template,
      done
    );
  },

  installDeps: function() {
    this._skipInstall = this.options['skip-install'];

    // Workaround for sync/async inconsistency of the yeoman API
    var done = this._skipInstall ? function(){} : this.async();

    this.installDependencies({
      npm: true,
      bower: false,
      skipInstall: this._skipInstall,
      callback: done
    });
  },

  whatsNext: function() {
    if (!this._skipInstall) {
      this.log();
      this.log();
    }

    this.log('Next steps:');
    this.log();
    this.log('  Create a model in your app');
    this.log(chalk.green('    $ yo loopback:model'));
    this.log();
    this.log('  Optional: Enable StrongOps monitoring');
    this.log(chalk.green('    $ slc strongops'));
    this.log();
    this.log('  Run the app');
    this.log(chalk.green('    $ slc run .'));
    this.log();
  }
});
