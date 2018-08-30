// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('../lib/globalize');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var helpText = require('../lib/help');
var apiGenerator = require('loopback-api-definition');
var mkdirp = require('mkdirp');
var ActionsMixin = require('../lib/actions');

module.exports = class ExportAPIDefGenerator extends ActionsMixin(yeoman) {
  constructor(args, opts) {
    super(args, opts);
    var format = this.options.json;
    this.format = format ? 'json' : 'yaml';
    this.option('output', {
      type: String,
      alias: 'o',
      desc: g.f('Name/Full path to the output file.'),
      defaults: '',
    });
  }

  help() {
    return helpText.customHelp(this, 'loopback_export-api-def_usage.txt');
  }

  generate() {
    var filePath = this.options.output;
    var options = {format: this.format, output: filePath};
    var app = require(this.destinationRoot());
    var apiDef = apiGenerator.getApiDef(app, options);

    // Print to console if no output file specified.
    if (filePath) {
      mkdirp.sync(path.dirname(filePath));
      fs.writeFileSync(filePath, apiDef);
    } else {
      process.stdout.write(apiDef);
    }

    // Kill app if still alive
    setTimeout(process.exit, 100);
  }
};
