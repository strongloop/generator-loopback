'use strict';

var ActionsMixin = require('../lib/actions');
var yeoman = require('yeoman-generator');
var ZosConnect = require('zosconnect-node');
var fs = require('fs');
var jsf = require('json-schema-faker');
var chalk = require('chalk');
var wsModels = require('loopback-workspace').models;

var helpText = require('../lib/help');

module.exports = class ZosconnecteeGenerator extends ActionsMixin(yeoman) {
  constructor(args, opts) {
    super(args, opts);
    this.updateObj = function(obj, parameters) {
      for (var key in obj) {
        if (typeof obj[key] === 'object') {
          this.updateObj(obj[key], parameters);
        } else {
          obj[key] = '{' + key + '}';
          parameters.push(key);
        }
      }
      return obj;
    };
  }

  help() {
    return helpText.customHelp(this, 'loopback_zosconnectee_usage.txt');
  }

  initializing() {
    var done = this.async();
    var that = this; // that will be used as a reference to this in all the async jobs

    wsModels.DataSourceDefinition.find(
      function(err, dsDef) {
        var tempList = [];
        dsDef.map(function(datasource) {
          if (datasource.connector == 'zosconnectee') {
            tempList.push(datasource);
          }
        });
        that.datasources = tempList;
        if (that.datasources.length == 0) {
          that.env.error(
            'Define a zosconnectee datasource before running this command'
          );
        }
        done(); // End the sync
      }
    );
  }

  getDataSources() {
    return this.prompt([{
      type: 'list',
      name: 'ds',
      message: 'Which data source you want to Discover APIs for?',
      choices: this.datasources,
      validate: function(input) {
        var done = this.async();
        if (input == '') {
          done('You should provide at least one data source');
        }
        done(null, true);
      },
    }]).then(function(answers) {
      var tempSource;
      this.datasources.map(function(datasource) {
        if (answers.ds.indexOf(datasource.name) >= 0) {
          tempSource = datasource;
        }
      });
      this.dataSource = tempSource;
    }.bind(this));
  }
  getapis() {
    var that = this;
    var done = this.async();
    var options = {
      uri: this.dataSource.baseURL,
      strictSSL: false,
    };
    if (this.dataSource.user !== '') {
      options.auth = {
        user: this.dataSource.user,
        pass: this.dataSource.password,
      };
    }
    this.zosconnect = new ZosConnect(options);
    this.zosconnect.getApis()
      .then(function(apis) { that.apiList = apis; done(null, true); })
      .catch(done);
  }
  selectApi() {
    return this.prompt([{
      type: 'list',
      name: 'api',
      message: 'Choose API',
      choices: this.apiList,
    }]).then(function(answers) {
      this.apiName = answers.api;
    }.bind(this));
  }
  loadApi() {
    var done = this.async();
    var that = this;
    this.zosconnect.getApi(this.apiName)
      .then(function(api) { that.api = api; done(null, true); })
      .catch(done);
  }
  loadSwagger() {
    var done = this.async();
    var that = this;
    this.api.getApiDoc('swagger')
      .then(function(swagger) {
        that.swagger = JSON.parse(swagger);
        done(null, true);
      })
      .catch(done);
  }
  generateTemplate() {
    this.masterTemplate = {};
    var masterTemplate = this.masterTemplate;
    masterTemplate.name = this.swagger.info.title;
    masterTemplate.baseURL = this.api.basePath;
    masterTemplate.crud = false;
    masterTemplate.connector = 'zosconnectee';
    if (this.dataSource.user !== '') {
      masterTemplate.options = {
        auth: {
          user: this.dataSource.user,
          pass: this.dataSource.password,
        },
      };
    }
    var operations = [];
    for (var path in this.swagger.paths) {
      for (var method in this.swagger.paths[path]) {
        var functions = {};
        var template = {};
        var that = this;
        template.method = method;
        template.url = this.api.basePath + path;
        template.headers = {
          'accepts': 'application/json',
          'content-type': 'application/json',
        };
        var operation = this.swagger.paths[path][method];
        var parameters = [];
        operation.parameters.map(function(parameter) {
          if (parameter.required) {
            if (parameter['in'] == 'query') {
              if (template.query === undefined) {
                template.query = {};
              }
              template.query[parameter.name] = '{' + parameter.name + '}';
              parameters.push(parameter.name);
            } else if (parameter['in'] == 'path') {
              parameters.push(parameter.name);
            } else if (parameter['in'] == 'body') {
              var schemaRef = parameter.schema.$ref;
              template.body = that.updateObj(jsf(that.swagger.definitions[schemaRef.substring(schemaRef.lastIndexOf('/') + 1)]), parameters);
            }
          }
        });
        functions[operation.operationId] = parameters;
        template.responsePath = '$';
        operations.push({
          'functions': functions,
          'template': template,
        });
      }
    }
    masterTemplate.operations = operations;
  }
  writeDataSource() {
    var dataSources = JSON.parse(fs.readFileSync('server/datasources.json'));
    var templateFile = 'server/' + this.dataSource.name + '_template.json';
    fs.writeFileSync(templateFile,
      JSON.stringify(this.masterTemplate, null, 2));
    dataSources[this.dataSource.name].template =
      this.dataSource.name + '_template.json';
    fs.writeFileSync('server/datasources.json',
      JSON.stringify(dataSources, null, 2));
  }
  end() {
    this.log('Configured DataSource', chalk.bold(this.dataSource.name),
      'for API', chalk.bold(this.apiName));
  }
};
