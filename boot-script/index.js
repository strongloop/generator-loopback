'use strict';
var helpers = require('../lib/helpers');
var path = require('path');
var yeoman = require('yeoman-generator');

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the boot script to create.',
      required: false,
      optional: true,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  askForName: function() {
    var done = this.async();

    if (this.name) return done();

    var question = {
      name: 'name',
      message: 'Enter the script name (without `.js`):',
      default: this.name,
      validate: helpers.validateName
    };

    this.prompt(question, function(answer) {
      this.name = answer.name;
      done();
    }.bind(this));
  },

  askForType: function() {
    var done = this.async();

    var question = {
      name: 'type',
      message: 'What type of boot script do you want to generate?',
      type: 'list',
      choices: ['async', 'sync'],
      default: 'async'
    };

    this.prompt(question, function(answer) {
      this.type = answer.type;
      done();
    }.bind(this));
  },

  generate: function() {
    var source = this.templatePath(this.type + '.js');

    var targetPath = path.normalize('/server/boot/' + this.name + '.js');
    var target = this.destinationPath(targetPath);

    this.copy(source, target);
  }
});
