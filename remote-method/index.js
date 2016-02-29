'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var util = require('util');
var path = require('path');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateName = helpers.validateName;
var checkPropertyName = helpers.checkPropertyName;
var typeChoices = helpers.getTypeChoices();
var ModelDefinition = require('loopback-workspace').models.ModelDefinition;

module.exports = yeoman.generators.Base.extend({
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('modelName', {
      desc: 'Name of the model',
      required: false,
      type: String
    });

    this.argument('methodName', {
      desc: 'Name of the remote method',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadProject: actions.loadProject,

  loadModels: actions.loadModels,

  askForModel: function() {
    if (this.modelName) {
      this.modelDefinition = this.projectModels.filter(function(m) {
        return m.name === this.modelName;
      }.bind(this))[0];

      if (!this.modelDefinition) {
        var msg = 'Model not found: ' + this.modelName +
                  '. Please choose from Model List:';
        this.log(chalk.red(msg));
      }
    }

    if (!this.modelDefinition) {
      var done = this.async();
      var prompts = [
        {
          name: 'model',
          message: 'Select the model:',
          type: 'list',
          choices: this.editableModelNames
        }
      ];
      this.prompt(prompts, function(answers) {
        this.modelName = answers.model;
        done();
      }.bind(this));
    }
  },

  findModelDefinition: function() {
    this.modelDefinition = this.projectModels.filter(function(m) {
      return m.name === this.modelName;
    }.bind(this))[0];

    if (!this.modelDefinition) {
      var msg = 'Model not found: ' + this.modelName;
      this.log(chalk.red(msg));
      this.async()(new Error(msg));
    }
  },

  askForParameters: function() {
    var done = this.async();
    var name = this.methodName;
    var prompts = [
      {
        name: 'methodName',
        message: 'Enter the remote method name:',
        required: true,
        default: name,
        validate: checkPropertyName
      },
      {
        name: 'isStatic',
        message: 'Is Static?',
        required:true,
        type: 'confirm',
        default: true
      },
      {
        name: 'description',
        message: 'Description for method:'
      }
    ];
    this.prompt(prompts, function(answers) {
      this.methodName = answers.methodName;
      this.isStatic = answers.isStatic;
      this.description = answers.description;
      done();
    }.bind(this));
  },

  delimEndpoints: function() {
    this.log('Let\'s add some HTTP Endpoints now.\n');
    this.http = [];
  },

  askForEndpoints: function() {
    var done = this.async();
    this.log('Enter an empty path when done.');

    var prompts = [
      {
        name: 'httpPath',
        message: 'Enter the path of this endpoint:',
        required: true
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.httpPath == null || answers.httpPath === '') {
        return done();
      }
      var subprompts = [
        {
          name: 'httpVerb',
          message: 'HTTP verb:',
          type: 'list',
          choices: ['post', 'put', 'delete', 'get', {
            name: '(other)',
            value: null
          }]
        },
        {
          name: 'customHttpVerb',
          message:
          'Enter the custom http verb',
          validate: validateName,
          when: function(answers) {
            return answers.httpVerb === null;
          }
        }
      ];

      var httpPath = answers.httpPath;

      this.prompt(subprompts, function(answers) {
        this.http.push({
          path: httpPath,
          verb: answers.httpVerb || answers.customHttpVerb
        });
        this.log('\nLet\'s add another endpoint.');
        this.askForEndpoints();
      }.bind(this));
    }.bind(this));
  },

  delimAccepts: function() {
    this.log('Let\'s add some Accept Arguments now.\n');
    this.accepts = [];
  },

  askForAccepts: function() {
    var done = this.async();
    this.log('Enter an empty name when done.');

    var prompts = [
      {
        name: 'acceptsArg',
        message: 'Enter name for accept argument:',
        required: true,
        validate: validateName
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.acceptsArg == null || answers.acceptsArg === '') {
        return done();
      }
      var subprompts = [
        {
          name: 'acceptsType',
          message: 'The type of accept argument:',
          type: 'list',
          choices: typeChoices
        },
        {
          name: 'acceptsRequired',
          message: 'Required?',
          type: 'confirm',
          default: false
        },
        {
          name: 'acceptsDes',
          message: 'Description of accept argument:',
          required: true
        },
        {
          name: 'httpSource',
          message: 'Mapping to http source:',
          type: 'list',
          choices: [
            {
              name: '(auto)',
              value: null
            },
            'form',
            'path',
            'query',
            {
              name: 'store the whole request body',
              value: 'body'
            },
            {
              name: 'store the full request object',
              value: 'req'
            },
            {
              name: 'store the full response object',
              value: 'res'
            },
            {
              name: 'store the whole context object',
              value: 'context'
            }
          ]
        }
      ];

      var argName = answers.acceptsArg;

      this.prompt(subprompts, function(answers) {
        var entry = {
          arg: argName,
          type: answers.acceptsType,
          required: answers.acceptsRequired,
          description: answers.acceptsDes,
        };
        if (answers.httpSource) {
          entry.http = { source: answers.httpSource };
        }
        this.accepts.push(entry);
        this.log('\nLet\'s add another accept argument.');
        this.askForAccepts();
      }.bind(this));
    }.bind(this));
  },

  delimReturns: function() {
    this.log('Let\'s add some Return Arguments now.\n');
    this.returns = [];
  },

  askForReturns: function() {
    var done = this.async();
    this.log('Enter an empty name when done.');

    var prompts = [
      {
        name: 'returnsArg',
        message: 'Enter name for return argument:',
        required: true,
        validate: validateName
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.returnsArg == null || answers.returnsArg === '') {
        return done();
      }
      var subprompts = [
        {
          name: 'returnsType',
          message: 'The type of return argument:',
          type: 'list',
          choices: typeChoices
        },
        {
          name: 'returnsRoot',
          message: 'Is it root',
          type: 'confirm',
          default: false
        },
        {
          name: 'returnsDes',
          message: 'Description of return argument:',
          required: true
        }
      ];

      var argName = answers.returnsArg;

      this.prompt(subprompts, function(answers) {
        this.returns.push({
          arg: argName,
          type: answers.returnsType,
          root: answers.returnsRoot,
          description: answers.returnsDes
        });
        this.log('\nLet\'s add another return argument.');
        this.askForReturns();
      }.bind(this));
    }.bind(this));
  },

  remote: function() {
    var done = this.async();
    var def = {
      name: this.methodName,
      isStatic: this.isStatic,
      description: this.description,
      accepts: this.accepts,
      returns: this.returns,
      http: this.http
    };

    this.modelDefinition.methods.create(def, function(err) {
      helpers.reportValidationError(err, this.log);
      return done(err);
    }.bind(this));
  },

  printSampleRemoteMethodSource: function() {
    var text = [
      buildIntroduction(this),
      buildJsdoc(this),
      buildMethodSource(this)
    ].join('\n\n');
    this.log(text);
    // print an empty line as a visual delimiter
    this.log();
  },

  saveProject: actions.saveProject
});

function buildIntroduction(def) {
  var modelDef = def.modelDefinition;
  var projectRoot = def.destinationRoot();
  var jsonFilePath = ModelDefinition.getPath(modelDef.facetName, modelDef);
  var jsFilePath = modelDef.getScriptPath();
  jsFilePath = path.relative(projectRoot, jsFilePath);
  jsFilePath = chalk.yellow(jsFilePath);
  jsonFilePath = chalk.yellow(jsonFilePath);

  var tip = [
    util.format(
      'We have added strong-remoting metadata for your new method to %s',
      jsonFilePath
    ),
    util.format(
      'Now it\'s up to you to provide implementation in %s',
      jsFilePath
    ),
    'Here is a sample code to get you started:'
  ].join('\n');

  return tip;
}

function buildJsdoc(def) {
  var jsdocLines =  [
    '/**',
    util.format(' * %s', def.description),
  ];

  jsdocLines = jsdocLines.concat(buildInputJsdoc(def.accepts));
  jsdocLines = jsdocLines.concat(buildReturnsJsdoc(def.returns));

  jsdocLines.push(' */');
  return jsdocLines.join('\n');
}

function buildMethodSource(def) {
  var ref = util.format(
    '%s%s%s',
    def.modelName,
    (def.isStatic ? '.' : '.prototype.'),
    def.methodName
  );
  var functionDef = [util.format(
    ref + ' = funtion(%s) {',
    chalk.green(buildInputArgs(def.accepts).join(', '))
    )
  ];

  if (def.returns.length > 0)
    functionDef.push(buildReturnDeclare(def.returns));

  functionDef.push('  // TODO');
  functionDef.push('  ' + buildCallback(def.returns));
  functionDef.push('};');

  return functionDef.join('\n');
}

function buildInputJsdoc(accepts) {
  var acceptJsdoc = accepts.map(function(accept) {
    return util.format(
      ' * \@param {%s} %s %s',
      accept.type,
      chalk.green(accept.arg),
      accept.description
    );
  });

  return acceptJsdoc;
}

function buildReturnsJsdoc(returns) {
  var returnTypes = ['Error'].concat(returns.map(function(_return) {
    return _return.type;
  })).join(', ');
  var returnDef = util.format(
    ' * \@param {Function(%s)} callback',
    chalk.green(returnTypes)
  );
  return returnDef;
}

function buildInputArgs(accepts) {
  var acceptArg = accepts.map(function(accept) {
    return accept.arg;
  });
  acceptArg.push('callback');
  return acceptArg;
}

function buildReturnDeclare(returns) {
  var returnArgs = buildReturnArgs(returns);
  returnArgs.shift();
  var returnDef = util.format(
    '  var %s;',
    chalk.green(returnArgs.join(', '))
  );
  return returnDef;
}

function buildCallback(returns) {
  var callbackLine = util.format(
    'callback(%s);',
    chalk.green(buildReturnArgs(returns).join(', '))
  );
  return callbackLine;
}

function buildReturnArgs(returns) {
  var returnArg = ['null'].concat(returns.map(function(_return) {
    return _return.arg;
  }));
  return returnArg;
}
