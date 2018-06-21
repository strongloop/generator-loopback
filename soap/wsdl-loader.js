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

var selectedWsdl, selectedWsdlUrl, wsdlServices,
  selectedService, selectedBinding;

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
exports.getServices = function getServices(wsdlUrl, log, cb) {
  loadWsdl(wsdlUrl, log, function(err, wsdl) {
    if (err) {
      return cb(err);
    }
    selectedWsdl = wsdl;
    selectedWsdlUrl = wsdlUrl;
    return cb(null, selectedWsdl.services);
  }.bind(this));
};

// get bindings for the service
exports.getBindings = function getBindings(serviceName) {
  selectedService = selectedWsdl.services[serviceName];
  var ports = selectedService.ports;
  var bindingNames = [];
  for (var name in ports) {
    var binding = ports[name].binding;
    bindingNames.push(binding.$name);
  }
  return bindingNames;
};

// get operations for the binding
exports.getOperations = function getOperations(bindingName) {
  selectedBinding = selectedWsdl.definitions.bindings[bindingName];
  var opNames = [];
  for (var opName in selectedBinding.operations) {
    opNames.push(opName);
  }
  return opNames;
};

// get operation objects for list of selected operation names
function getSelectedOperations(binding, operationNames) {
  var ops = binding.operations;
  var operations = [];
  var opNames = [];
  for (var opName in operationNames) {
    var name = operationNames[opName];
    operations.push(ops[name]);
  }
  return operations;
}

// generate remote method and models for list of operations
exports.generateAPICode = function generateAPICode(selectedDS, operationNames) { // eslint-disable-line max-len
  var apis = [];
  var apiData = {
    'datasource': selectedDS,
    'wsdl': selectedWsdl,
    'wsdlUrl': selectedWsdlUrl,
    'service': selectedService.$name,
    'binding': selectedBinding.$name,
    'operations': getSelectedOperations(selectedBinding, operationNames),
  };
  var code = soapGenerator.generateRemoteMethods(apiData);
  var models = soapGenerator.generateModels(apiData.wsdl, apiData.operations);
  var api = {
    code: code,
    models: models,
  };
  apis.push(api);
  return apis;
};

