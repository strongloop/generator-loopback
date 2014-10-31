'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
// var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var path = require('path');

module.exports = yeoman.generators.Base.extend({
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the module to create.',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadProject: actions.loadProject,

  askForName: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'name',
        message: 'Enter the module name:',
        default: this.name,
        validate: function(name) {
          if (!name) {
            return 'Name must be provided';
          } else {
            return true;
          }
        }
      }
    ];

    this.prompt(prompts, function(props) {
      this.name = props.name;
      done();
    }.bind(this));

  },

  askForParameters: function() {
    var done = this.async();

    this.displayName = chalk.yellow(this.name);

    var prompts = [
      {
        name: 'dev',
        message: 'Is ' + this.displayName + ' a development dependency?',
        default: false,
        type: 'confirm'
      }
    ];

    this.prompt(prompts, function(props) {
      this.dev = props.dev;

      done();
    }.bind(this));
  },

  installDep: function() {
    var self = this;
    var done = this.async();
    this.npmInstall([this.name], { 'saveDev': this.dev, 'save': !this.dev },
      function(err) {
        if (err) {
          return done(err);
        }
        var names = self.name.split('@')[0].split('/');
        names = names.filter(Boolean);
        var pkgName = names[names.length - 1];
        var pkg = self.dest.readJSON(
          path.join('node_modules', pkgName, 'package.json'));
        if (pkg && pkg['loopback-component']) {
          console.log(pkg['loopback-component']);
        }
        done();
      });
  }
});


