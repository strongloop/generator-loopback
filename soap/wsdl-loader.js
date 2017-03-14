// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var url = require('url');
var chalk = require('chalk');

var fs = require('fs');
var async = require('async');
var soapGenerator = require('loopback-soap');
var soap = require('strong-soap').soap;
var WSDL = soap.WSDL;
var path = require('path');

// loads remote WSDL or local WSDL using strong-soap module APIs.
function loadWsdl(wsdlUrl, log, cb) {
  WSDL.open(wsdlUrl, {}, function(err, wsdl) {
    if (err) {
      return cb(err);
    }
    cb(null, wsdl);
  });
}

// get services defined in the wsdl
exports.getServices = function getServices (wsdlUrl, log, cb) {
  loadWsdl(wsdlUrl, log, function(err, wsdl) {
    if (err) {
      return cb(err);
    }
    this.wsdl = wsdl;
    this.wsdlUrl = wsdlUrl;
    this.services = wsdl.services;
    return cb(null,  this.services);
  }.bind(this));
}

// get bindings for the service
exports.getBindings = function getBindings (serviceName) {
  this.selectedService =  this.services[serviceName];
  var ports = this.selectedService.ports;
  var bindingNames = [];
  for(var name in ports) {
    var binding = ports[name].binding;
    bindingNames.push(binding.$name);
  }
  this.bindingNames = bindingNames;
  return this.bindingNames;
}.bind(this);

// get operations for the binding
exports.getOperations = function getOperations(bindingName) {
  this.selectedBinding =  this.wsdl.definitions.bindings[bindingName];
  var opNames = [];
  for(var opName in this.selectedBinding.operations) {
    opNames.push(opName);
  }
  return opNames;
}.bind(this);

// get operation objects for list of selected operation names
function getSelectedOperations(selectedBinding, operationNames) {
  var bindingOperations = selectedBinding.operations;
  var operations = [];
  var opNames = [];
  for (var opName in operationNames) {
    var name = operationNames[opName];
    operations.push(bindingOperations[name]);
  }
  return operations;
}

// generate remote method and models for list of operations
exports.generateAPICode  = function generateAPICode(operationNames) {
  var apis = [];
  var apiData = {
    "wsdl": this.wsdl,
    "wsdlUrl": this.wsdlUrl,
    "service": this.selectedService.$name,
    "binding": this.selectedBinding.$name,
    "operations": getSelectedOperations(this.selectedBinding, operationNames)
  }
  var code = soapGenerator.generateRemoteMethods(apiData);
  var models = soapGenerator.generateModels(apiData.wsdl, apiData.operations);
  var api = {
    code: code,
    models: models
  };
  apis.push(api);
  return apis;
}.bind(this);




