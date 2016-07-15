// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
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
exports.validateAppName = function (name) {
  if (name.charAt(0) === '.' ) {
    return 'Application name cannot start with .: ' + name;
  }
  if(name.match(/[\/@\s\+%:]/)) {
    return 'Application name cannot contain special characters (/@+%: ): ' +
      name;
  }
  if(name.toLowerCase() === 'node_modules') {
    return 'Application name cannot be node_modules';
  }
  if(name.toLowerCase() === 'favicon.ico') {
    return 'Application name cannot be favicon.ico';
  }
  if(name !== encodeURIComponent(name)) {
    return 'Application name cannot contain special characters escaped by ' +
      'encodeURIComponent: ' + name;
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
    return name + ' is a reserved keyword. Please use another name';
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
    return 'Name cannot contain "." characters except' +
      ' the dot in "prototype." prefix';
  }
  var result = validateValue(name, /[\/@\s\+%:]/);
  if (result !== true) return result;
  if (RESERVED_PROPERTY_NAMES.indexOf(name) !== -1) {
    return name + ' is a reserved keyword. Please use another name';
  }
  return true;
};

/**
 * Validate required name for properties, data sources, or connectors
 * Empty name could not pass
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateRequiredName = function (name) {
  if (!name) {
    return 'Name is required';
  }
  return validateValue(name, /[\/@\s\+%:\.]/);
};

/**
 * Validate optional name for properties, data sources, or connectors
 * Empty name could pass
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateOptionalName = function (name) {
  return validateValue(name, /[\/@\s\+%:\.]/);
};

function validateValue(name, unallowedCharacters) {
  if (!unallowedCharacters) {
    unallowedCharacters = /[\/@\s\+%:\.]/;
  }
  if (name.match(unallowedCharacters)) {
    return 'Name cannot contain special characters ' + unallowedCharacters +
     name;
  }
  if (name !== encodeURIComponent(name)) {
    return 'Name cannot contain special characters escaped by ' +
      'encodeURIComponent: ' + name;
  }
  return true;
}

/**
 * Check if relation has a different name from properties
 * @param {Object} modelDefinition The model which has the relation
 * @param {String} name The user input
 * @returns {String|Boolean} Return the check result.
 */
exports.checkRelationName = function (modelDefinition, name) {
  return modelDefinition.properties.getAsync()
    .then(function(list) {
      var conflict = list.some(function(property) {
        return property.name === name;
      });
      return conflict?
        'Same property name already exists: ' + name :
        true;
    });
};

/**
 * Get the root command name based on the env var
 * @returns {string}
 */
exports.getCommandName = function() {
  var command = 'yo';
  if (process.env.SLC_COMMAND === 'apic'){
    command = process.env.SLC_COMMAND;
  } else if (process.env.SLC_COMMAND) {
    // to preserve condition treating `process.env.SLC_COMMAND` as boolean
    // cannot just use process.env.SLC_COMMAND as command due to regression
    command = 'slc';
  }
  return command;
};

/**
 * Customize the help message based on how the generator is invoked (slc|yo)
 * @param {Object} generator The generator instance
 * @param {String} cmd The cmd name
 * @returns {String} The customized help string
 */
exports.customHelp = function (generator, cmd) {
  var command = cmd || exports.getCommandName();
  var baseHelp = yeoman.Base.prototype.help;
  var helpStr = baseHelp.apply(generator, arguments);
  return helpStr.replace(/ yo | slc /g, ' ' + command + ' ');
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
    value: null
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
      return 'The value must be stringified ' + type;
    }
    try {
      var result = JSON.parse(val);
      if (type === 'array' && !Array.isArray(result)) {
        return 'The value must be a stringified ' + type;
      }
    } catch (e) {
      return 'The value must be a stringified ' + type;
    }
    return true;
  };
};
