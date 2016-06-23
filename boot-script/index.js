// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var helpers = require('../lib/helpers');
var path = require('path');
var yeoman = require('yeoman-generator');

var validateRequiredName = helpers.validateRequiredName;

module.exports = yeoman.Base.extend({
  constructor: function() {
    yeoman.Base.apply(this, arguments);

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
      validate: validateRequiredName
    };

    return this.prompt(question).then(function(answer) {
      this.name = answer.name;
      done();
    }.bind(this));
  },

  askForType: function() {
    var question = {
      name: 'type',
      message: 'What type of boot script do you want to generate?',
      type: 'list',
      choices: ['async', 'sync'],
      default: 'async'
    };

    return this.prompt(question).then(function(answer) {
      this.type = answer.type;
    }.bind(this));
  },

  generate: function() {
    var source = this.templatePath(this.type + '.js');

    // yeoman-generator 0.20.x doesn't like the leading /
    var targetPath = path.normalize('server/boot/' + this.name + '.js');
    var target = this.destinationPath(targetPath);

    this.copy(source, target);
  }
});
