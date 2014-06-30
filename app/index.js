'use strict';
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

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

  injectProjectWriteFile: function() {
    /* TODO inject `this.directory` to replace `ncp` in workspace
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
    */
  },

  initWorkspace: function() {
    process.env.WORKSPACE_DIR = this.destinationRoot();
  },

  loadTemplates: function() {
    var done = this.async();

    Workspace.getAvailableTemplates(function(err, list) {
      if (err) return done(err);
      this.templates = list.map(function(t) {
        return {
          // TODO - workspace does not provide template details yet
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

    this.log(yosay('Let\'s create a LoopBack application!'));

    var name = this.name || this.appname;

    var prompts = [
      {
        name: 'appname',
        message: 'What\'s the name of your application?',
        default: name
      },
      /*
       TODO: not all templates are projects, some of them are mere components
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
