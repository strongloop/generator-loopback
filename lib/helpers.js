'use strict';
var chalk = require('chalk');

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
 * @param strict
 * @returns {String|Boolean}
 */
exports.validateAppName = function (name, strict) {
  if (name.charAt(0) === '.' ||
    name.match(/[\/@\s\+%:]/) ||
    name !== encodeURIComponent(name) ||
    (strict && name !== name.toLowerCase()) ||
    name.toLowerCase() === 'node_modules' ||
    name.toLowerCase() === 'favicon.ico') {
    return 'Invalid application name: ' + name;
  }
  return true;
};

/**
 * Validate name for properties, data sources, or connectors
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateName = function (name) {
  if (!name || name.match(/[\/@\s\+%:\.]/) ||
    name !== encodeURIComponent(name)) {
    return 'Invalid name: ' + name;
  }
  return true;
};


