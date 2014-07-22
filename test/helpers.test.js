/*global describe, it */
'use strict';
var helpers = require('../lib/helpers');
var validateAppName = helpers.validateAppName;
var validateName = helpers.validateName;
require('must');

describe('helpers', function() {
  describe('validateAppName()', function() {
    it('should accept good names', function() {
      var result = validateAppName('app');
      result.must.be.true();

      result = validateAppName('app1');
      result.must.be.true();

      result = validateAppName('my_app');
      result.must.be.true();

      result = validateAppName('my-app');
      result.must.be.true();

      result = validateAppName('my.app');
      result.must.be.true();
    });

    it('should report errors for a name starting with .', function() {
      var result = validateAppName('.app');
      result.must.be.string();
    });

    it('should report errors for a name containing special chars', function () {
      var result = validateAppName('my app');
      result.must.be.string();
      result = validateAppName('my/app');
      result.must.be.string();
      result = validateAppName('my@app');
      result.must.be.string();
      result = validateAppName('my+app');
      result.must.be.string();
      result = validateAppName('my%app');
      result.must.be.string();
      result = validateAppName('my:app');
      result.must.be.string();
    });

    it('should report errors for a name as node_modules/favicon.ico',
      function () {
        var result = validateAppName('node_modules');
        result.must.be.string();
        result = validateAppName('Node_Modules');
        result.must.be.string();
        result = validateAppName('favicon.ico');
        result.must.be.string();
        result = validateAppName('favicon.ICO');
        result.must.be.string();
      });

  });

  describe('validateName()', function() {
    it('should accept good names', function() {
      var result = validateName('prop');
      result.must.be.true();

      result = validateName('prop1');
      result.must.be.true();

      result = validateName('my_prop');
      result.must.be.true();

      result = validateName('my-prop');
      result.must.be.true();
    });

    it('should report errors for a name containing special chars', function() {
      var result = validateName('my prop');
      result.must.be.string();
      result = validateName('my/prop');
      result.must.be.string();
      result = validateName('my@prop');
      result.must.be.string();
      result = validateName('my+prop');
      result.must.be.string();
      result = validateName('my%prop');
      result.must.be.string();
      result = validateName('my:prop');
      result.must.be.string();
      result = validateName('m.prop');
      result.must.be.string();
    });
  });

});
