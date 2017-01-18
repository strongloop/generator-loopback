// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var url = require('url');
var chalk = require('chalk');

var fs = require('fs');
var async = require('async');

var soap = require('strong-soap').soap;
var WSDL = soap.WSDL;
var path = require('path');

// loads remote WSDL or local WSDL using strong-soap module APIs
function loadWsdl(wsdlUrl, log, cb) {
  log(chalk.blue('Loading ' + wsdlUrl + '...'));
  WSDL.open(wsdlUrl, {}, function(err, wsdl) {
    if (err) {
      return cb(err);
    }
    cb(null, wsdl);
  });
}
// currently it just loads the WSDL and prints out services defined in the WSDL
function generate(wsdlUrl, log, cb) {
  loadWsdl(wsdlUrl, log, function(err, wsdl) {
    if (err) {
      return cb(err);
    }
    var services = wsdl.services;
    for (var s in services) {
      var service = services[s];
      log(chalk.blue('Service Name: ' + service.$name));
    }
    return cb(null, wsdl);
  });
}

module.exports = generate;
