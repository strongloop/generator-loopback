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
  var result = exports.validateName(name);
  if (result !== true) return result;
  if (RESERVED_PROPERTY_NAMES.indexOf(name) !== -1) {
    return name + ' is a reserved keyword. Please use another name';
  }
  return true;
};

/**
 * Validate name for properties, data sources, or connectors
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateName = function (name) {
  if (name.match(/[\/@\s\+%:\.]/) ||
    name !== encodeURIComponent(name)) {
    return 'Name cannot contain special characters (/@+%:. ): ' + name;
  }
  if(name !== encodeURIComponent(name)) {
    return 'Name cannot contain special characters escaped by ' +
      'encodeURIComponent: ' + name;
  }
  return true;
};

/**
 * Check if relation has a different name from properties
 * @param {Object} modelDefinition The model which has the relation
 * @param {String} name The user input
 * @param {Function(String|Boolean)} Callback to receive the check result.
 */
exports.checkRelationName = function (modelDefinition, name, callback) {
  modelDefinition.properties(function(err, list) {
    if (err) callback(err);
    var conflict = list.some(function(property) {
      return property.name === name;
    });
    if (conflict) {
      callback('Same property name already exists: ' + name);
    } else {
      callback(true);
    }
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
  var baseHelp = yeoman.generators.Base.prototype.help;
  var helpStr = baseHelp.apply(generator, arguments);
  return helpStr.replace(/ yo | slc /g, ' ' + command + ' ');
};

/**
 * Get the name of the default base model that should be used for models
 * attached to a given datasource.
 * @param {String} name DataSource name
 * @param {Array} allDataSources A list of all datasources as created
 *   by `actions.loadDataSources`
 */
exports.getBaseModelForDataSourceName = function(name, allDataSources) {
  var ds = allDataSources.filter(function(ds) {
    return ds.value === name;
  })[0];
  if (!ds) return undefined;

  var connectorName = ds._connector;
  if (!connectorName) return undefined;

  // hack: the method is sync
  var allConnectors;
  Workspace.listAvailableConnectors(function(err, list) {
    allConnectors = list;
  });
  assert(!!allConnectors);

  var connectorMeta = allConnectors.filter(function(c) {
    return c.name === connectorName ||
      c.package && c.package.name === connectorName;
  })[0];

  return connectorMeta && connectorMeta.baseModel;
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
