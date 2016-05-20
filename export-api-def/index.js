// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var helpers = require('../lib/helpers');
var apiGenerator = require('loopback-api-definition');
var mkdirp = require('mkdirp');

module.exports = yeoman.Base.extend({

  constructor: function() {
    yeoman.Base.apply(this, arguments);
    var format = this.options.json;
    this.format = format ? 'json' : 'yaml';
    this.option('output', {
      type: String,
      alias: 'o',
      desc: 'Name/Full path to the output file.',
      defaults: ''
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  generate: function() {
    var filePath = this.options.output;
    var options = { format: this.format, output: filePath };
    var app = require(this.destinationRoot());
    var apiDef = apiGenerator.getApiDef(app, options);

    // Print to console if no output file specified.
    if (filePath) {
      mkdirp.sync(path.dirname(filePath));
      fs.writeFileSync(filePath, apiDef);
    } else {
      process.stdout.write(apiDef);
    }
  }
});
