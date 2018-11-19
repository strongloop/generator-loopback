// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var wsModels = require('loopback-workspace').models;

var ActionsMixin = require('../lib/actions');
var debug = require('debug')('loopback:generator:model');
var helpers = require('../lib/helpers');
var helpText = require('../lib/help');
var validateRequiredName = helpers.validateRequiredName;
var validateOptionalName = helpers.validateOptionalName;
var fs = require('fs');
const EventEmitter = require('events');

module.exports = class ModelGenerator extends ActionsMixin(yeoman) {
  // NOTE(bajtos)
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  constructor(args, opts) {
    super(args, opts);
    this.abort = false;
    this.databaseModel = true; // `false` if using ibm-object-store datasource
    this.option('bluemix', {
      desc: g.f('Bind to a Bluemix datasource'),
    });

    this.argument(g.f('name'), {
      desc: g.f('Name of the model to create.'),
      required: false,
      type: String,
    });

    // Prevent "warning: possible EventEmitter memory leak detected"
    // when adding more than 10 properties
    // See https://github.com/strongloop/generator-loopback/issues/99
    this.env.sharedFs.setMaxListeners(256);
  }

  help() {
    return helpText.customHelp(this, 'loopback_model_usage.txt');
  }

  loadProject() {
    debug('loading project...');
    this.loadProjectForGenerator();
    debug('loaded project.');
  }

  loadDataSources() {
    debug('loading datasources...');
    this.loadDatasourcesForGenerator();
    debug('loaded datasources.');
  }

  loadModels() {
    debug('loading models...');
    this.loadModelsForGenerator();
    debug('loaded models.');
  }

  addNullDataSourceItem() {
    this.addNullDataSourceItemForGenerator();
  }

  setBluemixDatasourceState() {
    if (this.abort) return;
    if (this.options.bluemix) {
      var configPath = this.destinationPath('.bluemix/datasources-config.json');
      if (!fs.existsSync(configPath)) {
        this.abort = true;
        this.log('datasources-config.json not found.');
      } else {
        try {
          var datasourcesConfig = JSON.parse(fs.readFileSync(configPath));
          this.bluemixDataSourcesList = datasourcesConfig.datasources;
          if (Object.keys(this.bluemixDataSourcesList).length) {
            this.hasDatasources = true;
          } else {
            this.hasDatasources = false;
          }
        } catch (err) {
          this.abort = true;
          this.log('Error parsing datasources-config.json.');
        }
      }
    }
  }

  checkForDatasource() {
    if (this.abort) return;
    if (!this.hasDatasources) {
      if (this.options.bluemix) {
        this.abort = true;
        this.log('No Bluemix datasource found.');
        var done = this.async();
        return done();
      } else {
        var warning = chalk.red(g.f('Warning: Found no data sources to ' +
        'attach model. There will be no data-access methods available until ' +
        'datasources are attached.'));
        this.log(warning);
        return;
      }
    }
  }

  askForName() {
    if (this.abort) return;

    if (this.arguments && this.arguments.length >= 1) {
      debug('model name is provided as %s', this.arguments[0]);
      this.name = this.arguments[0];
      var valid = validateRequiredName(this.name);
      if (valid === true) return;
      this.log(valid);
      this.name = undefined;
    }

    var prompts = [
      {
        name: 'name',
        message: g.f('Enter the model name:'),
        default: this.name,
        validate: validateRequiredName,
      },
    ];

    return this.prompt(prompts).then(function(props) {
      this.name = props.name;
      this.displayName = chalk.yellow(this.name);
    }.bind(this));
  }

  askForDataSource() {
    if (this.abort) return;
    if (!this.hasDatasources) {
      this.dataSource = null;
      return;
    }

    var dsConnectorMap = {};

    var promptObject = {
      name: 'dataSource',
      message: g.f('Select the datasource to attach %s' +
        ' to:', this.displayName),
      type: 'list',
    };

    if (this.options.bluemix) {
      var bluemixDataSources = [];
      var bluemixDataSourcesList = this.bluemixDataSourcesList;
      Object.keys(bluemixDataSourcesList)
        .forEach(function(datasourceName) {
          var datasource = bluemixDataSourcesList[datasourceName];
          var bluemixDataSource = {
            name: datasourceName + ' (' + datasource.connector + ')',
            value: datasourceName,
            _connector: datasource.connector,
          };
          bluemixDataSources.push(bluemixDataSource);
        });
      promptObject.default = null;
      promptObject.choices = bluemixDataSources;
    } else {
      promptObject.default = this.defaultDataSource;
      promptObject.choices = this.dataSources;
    }

    promptObject.choices.forEach(function(ds) {
      dsConnectorMap[ds.value] = ds._connector;
    });

    var prompts = [promptObject];
    var self = this;
    return this.prompt(prompts).then(function(props) {
      if (this.hasDatasources) {
        this.dataSource = props.dataSource;
        if (dsConnectorMap[props.dataSource] === 'loopback-component-storage') {
          self.databaseModel = false;
        }
      } else {
        this.dataSource = null;
      }
      debug('database is chosen.');
    }.bind(this));
  }

  getBaseModels() {
    debug('getting the base model....');
    if (this.abort) return;
    if (!this.dataSource) {
      this.baseModel = 'Model';
      return;
    }
    var done = this.async();
    helpers.getBaseModelForDataSourceName(
      this.dataSource, this.dataSources, function(err, model) {
        if (err) return done(err);
        this.baseModel = model;
        done();
      }.bind(this)
    );
  }

  askForParameters() {
    debug('asking for the parameters....');
    if (this.abort) return;
    this.displayName = chalk.yellow(this.name);

    var baseModelChoices = ['Model', 'PersistedModel']
      .concat(this.modelNames)
      .concat([{
        name: g.f('(custom)'),
        value: null,
      }]);
    var prompts;

    if (this.databaseModel) {
      prompts = [
        {
          name: 'base',
          message: g.f('Select model\'s base class'),
          type: 'list',
          default: this.baseModel,
          choices: baseModelChoices,
        },
        {
          name: 'customBase',
          message: g.f('Enter the base model name:'),
          required: true,
          validate: validateRequiredName,
          when: function(answers) {
            return answers.base === null;
          },
        },
        {
          name: 'public',
          message: g.f('Expose %s via the REST API?', this.displayName),
          type: 'confirm',
        },
        {
          name: 'plural',
          message: g.f('Custom plural form (used to build REST URL):'),
          when: function(answers) {
            return answers.public;
          },
        },
        {
          name: 'facetName',
          message: g.f('Common model or server only?'),
          type: 'list',
          default: 'common',
          choices: [
            {name: g.f('common'), value: 'common'},
            {name: g.f('server'), value: 'server'}],
        },
      ];
    } else {
      prompts = [
        {
          name: 'public',
          message: g.f('Expose %s via the REST API?', this.displayName),
          type: 'confirm',
        },
        {
          name: 'plural',
          message: g.f('Custom plural form (used to build REST URL):'),
          when: function(answers) {
            return answers.public;
          },
        },
        {
          name: 'facetName',
          message: g.f('Common model or server only?'),
          type: 'list',
          default: 'common',
          choices: [
            {name: g.f('common'), value: 'common'},
            {name: g.f('server'), value: 'server'}],
        },
      ];
    }
    return this.prompt(prompts).then(function(props) {
      this.public = props.public;
      this.plural = props.plural || undefined;
      this.facetName = props.facetName;
      if (this.databaseModel) this.base = props.customBase || props.base;
      else this.base = 'Model';
    }.bind(this));
  }

  modelDefinition() {
    if (this.abort) return;
    var done = this.async();
    var config = {
      name: this.name,
      plural: this.plural,
      base: this.base,
      facetName: this.facetName,
    };

    wsModels.ModelDefinition.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  }

  modelConfiguration() {
    if (this.abort) return;
    var done = this.async();
    var config = {
      name: this.name,
      facetName: 'server', // hard-coded for now
      dataSource: this.dataSource,
      public: this.public,
    };

    wsModels.ModelConfig.create(config, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  }

  delim() {
    if (this.abort) return;
    if (this.base === 'KeyValueModel' || !this.databaseModel)
      return;

    this.log(g.f('Let\'s add some %s properties now.\n', this.displayName));
  }

  property() {
    if (this.abort) return;
    if (this.databaseModel) {
      var done = this.async();

      if (this.base === 'KeyValueModel')
        return;

      this.log(g.f('Enter an empty property name when done.'));
      var prompts = [
        {
          name: 'propertyName',
          message: g.f('Property name:'),
          validate: validateOptionalName,
        },
      ];
      this.prompt(prompts).then(function(answers) {
        if (answers.propertyName == null || answers.propertyName === '') {
          return done();
        }
        const emitter = new EventEmitter();
        this.composeWith(
          'loopback:property',
          {
            nested: true,
            projectDir: this.projectDir,
            project: this.project,
            modelName: this.name,
            propertyName: answers.propertyName,
            modelEmitter: emitter,
          }
        );
        // `this.composeWith` doesn't wait until the sub-generator finishes,
        // but runs tasks according to yeoman-generator's run loop, which determine
        // the task sequences by phases, details see
        // http://yeoman.io/authoring/composability.html
        // as a workaround, an event emitter is introduced to invoke another property prompts
        emitter.on('finished', ()=> {
          this.log(g.f('\nLet\'s add another %s property.', this.displayName));
          this.property();
        });
        return done();
      }.bind(this));
    }
  }

  saveProject() {
    this.saveProjectForGenerator();
  }
};
