// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var url = require('url');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var loadWsdl = require('./wsdl-loader');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');

var fs = require('fs');
var async = require('async');

module.exports = yeoman.Base.extend({

  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.argument('url', {
      desc: g.f('URL of the WSDL'),
      required: false,
      type: String,
    });
  },

  help: function() {
    return helpText.customHelp(this, 'loopback_soap_usage.txt'); // TODO (rashmihunt) add this .txt
  },

  loadProject: actions.loadProject,

  askForWsdlUrlOrPath: function() {
    var prompts = [
      {
        name: 'url',
        message: g.f('Enter the WSDL url or file path:'),
        default: this.url,
        validate: validateUrlOrFile,
      },
    ];
    return this.prompt(prompts).then(function(answers) {
      this.url = answers.url.trim();
    }.bind(this));
  },

  // command ->  slc loopback:soap
  soap: function() {
    var self = this;
    var done = this.async();
    loadWsdl(this.url, this.log, function(err, wsdl) {
      if (err) {
        done(err);
      }
      self.wsdl = wsdl;
      done();
    });
  },

  saveProject: actions.saveProject,
});

function validateUrlOrFile(wsdlUrlStr) {
  if (!wsdlUrlStr) {
    return g.f('wsdl url or file path is required');
  }
  var wsdlUrl = url.parse(wsdlUrlStr);
  if (wsdlUrl.protocol === 'http:' || wsdlUrl.protocol === 'https:') {
    return true;
  } else {
    var stat = fs.existsSync(wsdlUrlStr) && fs.statSync(wsdlUrlStr);
    if (stat && stat.isFile()) {
      return true;
    } else {
      return g.f('file path %s is not a file.', wsdlUrlStr);
    }
  }
}
