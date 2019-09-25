// Copyright IBM Corp. 2017,2019. All Rights Reserved.
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
var nock = require('nock');

var apiSwagger = require('./zosconnectee/swagger.json');

describe('loopback:zosconnectee generator', function() {
  beforeEach(common.resetWorkspace);

  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  beforeEach(function createDataSource() {
    return helpers.run(path.join(__dirname, '../datasource'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'zosconnectee',
        connector: 'zosconnectee',
        baseURL: 'http://test:9080',
        user: 'user',
        password: 'pass',
        installConnector: false,
      }).then();
  });

  it('creates and configures CatalogManager API',
    function() {
      // Setup the http requests
      nock('http://test:9080').get('/zosConnect/apis').reply(200, {
        apis: [
          {
            adminUrl: 'http://test:9080/zosConnect/apis/catalog',
            description: '',
            name: 'catalog',
            version: '1.0.0',
          },
        ],
      });
      nock('http://test:9080').get('/zosConnect/apis/catalog').reply(200, {
        apiUrl: 'http://test:9080/catalog',
        description: '',
        documentation: {
          swagger: 'http://test:9080/catalog/api-docs',
        },
        name: 'catalog',
        status: 'started',
        version: '1.0.0',
      });
      nock('http://test:9080').get('/catalog/api-docs').reply(200, apiSwagger);

      return helpers.run(path.join(__dirname, '../zosconnectee'))
        .cd(SANDBOX)
        .withPrompts({
          ds: 'zosconnectee',
          api: 'catalog',
        }).then(function() {
          var template = readTemplateJsonSync('zosconnectee_template.json');
          expect(template).to.have.property('name', 'catalog');
          expect(template).to.have.property('connector', 'zosconnectee');
          expect(template).to.have.property('baseURL', 'http://test:9080/catalog');
          expect(template).to.have.property('operations').with.lengthOf(3);
          var datasources = readDataSourcesJsonSync('server');
          expect(datasources).to.have.property('zosconnectee');
          expect(datasources.zosconnectee).to.have.property('template',
            'zosconnectee_template.json');
        });
    });

  function readDataSourcesJsonSync(facet) {
    var filepath = path.resolve(SANDBOX, facet || 'server', 'datasources.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }

  function readTemplateJsonSync(template) {
    var content = fs.readFileSync(SANDBOX + '/server/' + template, 'utf-8');
    return JSON.parse(content);
  }
});
