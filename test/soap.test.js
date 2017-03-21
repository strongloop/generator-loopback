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
    common.createDummyProject(SANDBOX, 'test-soapapp', done);
  });

  it('stock quote wsdl',
    function(done) {
      var modelGen = givenModelGenerator();
      helpers.mockPrompt(modelGen, {
        url: path.join(__dirname, 'soap/stockquote.wsdl'),
        service: 'StockQuote',
        binding: 'StockQuoteSoap',
        operations: ['GetQuote'],
      });

      // this runs command  loopback:soap command with mock up /test/soap/stockquote.wsdl as input from command prompt
      modelGen.run(function() {
        var content = readModelJsonSync('get-quote');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('properties');
        expect(content.properties.symbol.type).to.eql('string');
        expect(content.properties.globals.type).to.eql('Globals');

        content = readModelJsonSync('globals');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('properties');
        expect(content.properties.Promise.type).to.eql('boolean');
        expect(content.properties.Promise.type).to.eql('boolean');

        content = readModelJsonSync('get-quote-response');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('properties');
        expect(content.properties.GetQuoteResult.type).to.eql('string');

        var modelConfig = readModelConfigSync('server');
        expect(modelConfig).to.have.property('GetQuote');
        expect(modelConfig.GetQuote).to.have.property('public', true);
        done();
      });
    });

  it('periodic table wsdl',
    function(done) {
      var modelGen = givenModelGenerator();
      helpers.mockPrompt(modelGen, {
        url: 'http://www.webservicex.net/periodictable.asmx?WSDL',
        service: 'periodictable',
        binding: 'periodictableSoap',
        operations: ['GetAtomicNumber', 'GetAtomicWeight'],
      });
      // this runs command  loopback:soap command with mock up /test/soap/stockquote.wsdl as input from command prompt
      modelGen.run(function() {
        var content = readModelJsonSync('get-atomic-weight');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('properties');
        expect(content.properties.ElementName.type).to.eql('string');

        content = readModelJsonSync('get-atomic-weight-response');
        expect(content.properties.GetAtomicWeightResult.type).to.eql('string');

        content = readModelJsonSync('get-atomic-number');
        expect(content).to.not.have.property('public');
        expect(content).to.have.property('properties');
        expect(content.properties.ElementName.type).to.eql('string');

        content = readModelJsonSync('get-atomic-number-response');
        expect(content.properties.GetAtomicNumberResult.type).to.eql('string');

        var modelConfig = readModelConfigSync('server');
        expect(modelConfig).to.have.property('GetAtomicWeight');
        expect(modelConfig.GetAtomicWeight).to.have.property('public', true);

        expect(modelConfig).to.have.property('GetAtomicNumber');
        expect(modelConfig.GetAtomicNumber).to.have.property('public', true);

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

  function readModelJsonSync(name) {
    var soapJson = path.resolve(SANDBOX, 'server/models/' + name + '.json');
    expect(fs.existsSync(soapJson), 'file exists');
    return JSON.parse(fs.readFileSync(soapJson));
  }

  function readModelConfigSync(facet) {
    facet = facet || 'server';
    var filepath = path.resolve(SANDBOX, facet, 'model-config.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
