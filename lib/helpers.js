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
