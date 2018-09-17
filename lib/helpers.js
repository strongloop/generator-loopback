// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('strong-globalize')();
var assert = require('assert');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var Workspace = require('loopback-workspace').models.Workspace;
var ModelProperty = require('loopback-workspace').models.ModelProperty;

var RESERVED_PROPERTY_NAMES = ['constructor'];

exports.reportValidationError = function(err, logFn) {
  if (!err || err.name !== 'ValidationError') {
    return;
  }

  var details = err.details;
  logFn(chalk.red('Validation error: invalid %s'), details.context);
  Object.keys(details.messages).forEach(function(prop) {
    logFn(chalk.red(' - %s: %s'), prop, details.messages[prop]);
  });
};

/**
 * validate application (module) name
 * @param name
 * @returns {String|Boolean}
 */
exports.validateAppName = function(name) {
  if (name.charAt(0) === '.') {
    return g.f('Application name cannot start with .: %s', name);
  }
  if (name.match(/[\/@\s\+%:]/)) {
    return g.f('Application name cannot contain special characters ' +
      '(/@+%: ): %s', name);
  }
  if (name.toLowerCase() === 'node_modules') {
    return g.f('Application name cannot be {{node_modules}}');
  }
  if (name.toLowerCase() === 'favicon.ico') {
    return g.f('Application name cannot be {{favicon.ico}}');
  }
  if (name !== encodeURIComponent(name)) {
    return g.f('Application name cannot contain special characters escaped by' +
    ' encodeURIComponent: %s', name);
  }
  return true;
};

/**
 * Validate property name
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.checkPropertyName = function(name) {
  var result = exports.validateRequiredName(name);
  if (result !== true) return result;
  if (RESERVED_PROPERTY_NAMES.indexOf(name) !== -1) {
    return g.f('%s is a reserved keyword. Please use another name', name);
  }
  return true;
};

/**
 * Validate remote method name. Allows `.` in method name for prototype
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateRemoteMethodName = function(name) {
  if (name.match(/\./) && !name.match(/^prototype\.([^.]*)$/)) {
    return g.f('Name cannot contain "." characters except' +
      ' the dot in {{"prototype."}} prefix');
  }
  var result = validateValue(name, /[\/@\s\+%:]/);
  if (result !== true) return result;
  if (RESERVED_PROPERTY_NAMES.indexOf(name) !== -1) {
    return g.f('%s is a reserved keyword. Please use another name', name);
  }
  return true;
};

/**
 * Validate required name for properties, data sources, or connectors
 * Empty name could not pass
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateRequiredName = function(name) {
  if (!name) {
    return g.f('Name is required');
  }
  return validateValue(name, /[\/@\s\+%:\.]/);
};

/**
 * Validate optional name for properties, data sources, or connectors
 * Empty name could pass
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateOptionalName = function(name) {
  return validateValue(name, /[\/@\s\+%:\.]/);
};

function validateValue(name, unallowedCharacters) {
  if (!unallowedCharacters) {
    unallowedCharacters = /[\/@\s\+%:\.]/;
  }
  if (name.match(unallowedCharacters)) {
    return g.f('Name cannot contain special characters %s %s',
      unallowedCharacters, name);
  }
  if (name !== encodeURIComponent(name)) {
    return g.f('Name cannot contain special characters escaped by ' +
      'encodeURIComponent: %s', name);
  }
  return true;
}

/**
 * Check if relation has a different name from properties
 * @param {Object} modelDefinition The model which has the relation
 * @param {String} name The user input
 * @returns {String|Boolean} Return the check result.
 */
exports.checkRelationName = function(modelDefinition, name) {
  return modelDefinition.properties.getAsync()
    .then(function(list) {
      var conflict = list.some(function(property) {
        return property.name === name;
      });
      return conflict ?
        g.f('Same property name already exists: ', name) :
        true;
    });
};

/**
 * Get the root command name based on the env var
 * @returns {string}
 */
exports.getCommandName = function() {
  var command = 'yo';
  if (process.env.SLC_COMMAND === 'apic') {
    command = process.env.SLC_COMMAND;
  } else if (process.env.SLC_COMMAND === 'loopback-cli') {
    command = 'loopback-cli';
  } else if (process.env.SLC_COMMAND) {
    // to preserve condition treating `process.env.SLC_COMMAND` as boolean
    // cannot just use process.env.SLC_COMMAND as command due to regression
    command = 'slc';
  }
  return command;
};

/**
 * Get the name of the default base model that should be used for models
 * attached to a given datasource.
 * @param {String} name DataSource name
 * @param {Array} allDataSources A list of all datasources as created
 *   by `actions.loadDataSources`
 * @param {Function} cb
 */
exports.getBaseModelForDataSourceName = function(name, allDataSources, cb) {
  var ds = allDataSources.filter(function(ds) {
    return ds.value === name;
  })[0];
  if (!ds) {
    return process.nextTick(cb);
  }

  var connectorName = ds._connector;
  if (!connectorName) return undefined;

  Workspace.listAvailableConnectors(function(err, list) {
    var allConnectors = list;
    assert(!!allConnectors);

    var connectorMeta = allConnectors.filter(function(c) {
      return c.name === connectorName ||
        c.package && c.package.name === connectorName;
    })[0];

    cb(null, connectorMeta && connectorMeta.baseModel);
  });
};

/**
 * Get the available type choices that should be used for arguments
 * from workspace.
 */
exports.getTypeChoices = function() {
  var typeChoices = ModelProperty.availableTypes.concat({
    name: '(other)',
    value: null,
  });
  return typeChoices;
};

/**
 * Get a validate function for object/array type
 * @param {String} type 'object' or 'array'
 * @returns {Function} The validator function
 */
exports.objectValidator = function objectValidator(type) {
  return function validate(val) {
    if (val == null || val === '') {
      return true;
    }
    if (typeof val !== 'string') {
      return g.f('The value must be stringified %s', type);
    }
    try {
      var result = JSON.parse(val);
      if (type === 'array' && !Array.isArray(result)) {
        return g.f('The value must be a stringified %s', type);
      }
    } catch (e) {
      return g.f('The value must be a stringified %s', type);
    }
    return true;
  };
};

/**
 * Validate app memory size
 * @param {Number} memorySize Size of app memory
 * @returns {String|Boolean}
 */
exports.validateAppMemory = function(memorySize) {
  var size = toMB(memorySize);
  if (size === -1) {
    return g.f('Specify the unit in M/MB or G/GB');
  }
  if (size < 256 || size > 10240) {
    return g.f('Specify a number between 256M and 10G');
  }
  return true;
};

/**
 * Validate app instances count
 * @param {Number} appInstances Number of app instances to run
 * @returns {String|Boolean}
 */
exports.validateAppInstances = function(appInstances) {
  appInstances = parseInt(appInstances);
  if (isNaN(appInstances) || appInstances < 1 || appInstances > 10) {
    return g.f('Specify a number between 1 and 10');
  }
  return true;
};

/**
 * Validate app domain name
 * @param {String} domainName Hosting domain name of the app
 * @returns {String|Boolean}
 */
exports.validateAppDomain = function(domainName) {
  var re = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  if (!re.test(domainName)) {
    return g.f('Specify a valid domain name');
  }
  return true;
};

/**
 * Validate app host name
 * @param {String} hostName Sub-domain/domain name of the app
 * @returns {String|Boolean}
 */
exports.validateAppHost = function(hostName) {
  if (!hostName.length) {
    return g.f('Host name is required');
  }
  return true;
};

/**
 * Validate app disk quota
 * @param {Number} diskQuota disk quota size
 * @returns {String|Boolean}
 */
exports.validateAppDiskQuota = function(diskQuota) {
  var size = toMB(diskQuota);
  if (size === -1) {
    return g.f('Specify the unit in M/MB or G/GB');
  }
  if (size < 1024 || size > 10240) {
    return g.f('Specify a number between 1G and 10G');
  }
  return true;
};

function toMB(input) {
  input = input.toUpperCase();
  var re = /^(\d+)(M|MB|G|GB)?$/i;
  var match = re.exec(input);
  if (!match) return -1;
  var size = parseInt(match[1]);
  var unit = match[2] || 'M';
  if (/^(G|GB)$/i.test(unit)) {
    size = size * 1024;
  }
  return size;
}

/**
 * Normalize the size input
 * @param input
 * @returns {*}
 */
exports.normalizeSize = function(input) {
  input = input.toUpperCase();
  var re = /^(\d+)(M|MB|G|GB)?$/i;
  var match = re.exec(input);
  if (!match) return '';
  var size = match[1];
  var unit = match[2] || 'M';
  return size + unit;
};
