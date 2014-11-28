/*global describe, it */
'use strict';
var helpers = require('../lib/helpers');
var validateAppName = helpers.validateAppName;
var validateName = helpers.validateName;
require('chai').should();
var expect = require('chai').expect;

describe('helpers', function() {
  describe('validateAppName()', function() {
    it('should accept good names', function() {
      testValidationAcceptsValue(validateAppName, 'app');
      testValidationAcceptsValue(validateAppName, 'app1');
      testValidationAcceptsValue(validateAppName, 'my_app');
      testValidationAcceptsValue(validateAppName, 'my-app');
      testValidationAcceptsValue(validateAppName, 'my.app');
    });

    it('should report errors for a name starting with .', function() {
      testValidationRejectsValue(validateAppName, '.app');
    });

    it('should report errors for a name containing special chars', function () {
      testValidationRejectsValue(validateAppName, 'my app');
      testValidationRejectsValue(validateAppName, 'my/app');
      testValidationRejectsValue(validateAppName, 'my@app');
      testValidationRejectsValue(validateAppName, 'my+app');
      testValidationRejectsValue(validateAppName, 'my%app');
      testValidationRejectsValue(validateAppName, 'my:app');
    });

    it('should report errors for a name as node_modules/favicon.ico',
      function () {
        testValidationRejectsValue(validateAppName, 'node_modules');
        testValidationRejectsValue(validateAppName, 'Node_Modules');
        testValidationRejectsValue(validateAppName, 'favicon.ico');
        testValidationRejectsValue(validateAppName, 'favicon.ICO');
      });

  });

  describe('validateName()', function() {
    it('should accept good names', function() {
      testValidationAcceptsValue(validateName, 'prop');
      testValidationAcceptsValue(validateName, 'prop1');
      testValidationAcceptsValue(validateName, 'my_prop');
      testValidationAcceptsValue(validateName, 'my-prop');
    });

    it('should report errors for a name containing special chars', function() {
      testValidationRejectsValue(validateName, 'my prop');
      testValidationRejectsValue(validateName, 'my/prop');
      testValidationRejectsValue(validateName, 'my@prop');
      testValidationRejectsValue(validateName, 'my+prop');
      testValidationRejectsValue(validateName, 'my%prop');
      testValidationRejectsValue(validateName, 'my:prop');
      testValidationRejectsValue(validateName, 'm.prop');
    });
  });
});

function testValidationAcceptsValue(validationFn, value) {
  expect(validationFn(value), value).to.be.true();
}

function testValidationRejectsValue(validationFn, value) {
  expect(validationFn(value), value).to.be.a('string');
}
