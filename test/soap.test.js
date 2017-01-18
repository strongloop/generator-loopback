// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('chai').expect;
var common = require('./common');

describe('loopback:soap', function() {
  beforeEach(common.resetWorkspace);

  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  it('Load wsdl and print service/s name',
    function(done) {
      var modelGen = givenModelGenerator();
      helpers.mockPrompt(modelGen, {
        url: path.join(__dirname, 'soap/stockquote.wsdl'),
      });

      // this runs command  loopback:soap command with mock up /test/soap/stockquote.wsdl as input from command prompt
      modelGen.run(function() {
        done();
      });
    });

  function givenModelGenerator(modelArgs) {
    var path = '../../soap';
    var name = 'loopback:soap';
    var deps = [];
    var gen = common.createGenerator(name, path, deps, modelArgs, {});
    return gen;
  }
});
