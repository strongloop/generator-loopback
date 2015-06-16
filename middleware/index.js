'use strict';
var chalk = require('chalk');
var yeoman = require('yeoman-generator');

var wsModels = require('loopback-workspace').models;

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateName = helpers.validateName;

function toNumberedList(items) {
  var lastIndex = items.length - 1;
  return items.map(function(item, index) {
    var name = item;
    if (index !== lastIndex) {
      // Last item should not be numbered
      name = (index + 1) + '. ' + item;
    }
    return {
      name: name,
      value: item
    };
  });
}

var OTHER_PHASE = '(custom phase)';
var LAST_PHASE = '(last phase)';

module.exports = yeoman.generators.Base.extend({
  // This generator does not track file changes via yeoman,
  // as loopback-workspace is editing (modifying) files when
  // saving project changes.

  loadProject: actions.loadProject,

  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('name', {
      desc: 'Name of the middleware to create.',
      required: false,
      type: String
    });
  },

  help: function() {
    return helpers.customHelp(this);
  },

  loadPhases: function() {
    var done = this.async();
    wsModels.Middleware.getPhases(function(err, list) {
      if (err) {
        return done(err);
      }

      this.phases = list.map(function(m) {
        return m.phase;
      });

      done();
    }.bind(this));
  },

  askForName: function() {
    var done = this.async();

    var prompts = [
      {
        name: 'name',
        message: 'Enter the middleware name:',
        default: this.name,
        validate: function(name) {
          return name && validateName(name);
        }
      }
    ];

    this.prompt(prompts, function(props) {
      this.name = props.name;
      done();
    }.bind(this));

  },

  askForPhase: function() {
    var done = this.async();

    var displayName = chalk.yellow(this.name);

    var prompts = [
      {
        name: 'phase',
        message: 'Select the phase for ' + displayName + ':',
        type: 'list',
        default: 'routes',
        choices: toNumberedList(this.phases.concat([OTHER_PHASE]))
      },
      {
        name: 'customPhase',
        message: 'Enter the phase name:',
        validate: validateName,
        when: function(answers) {
          return answers.phase === OTHER_PHASE;
        }
      },
      {
        name: 'nextPhase',
        message: 'Select the phase before which the new one will be inserted:',
        type: 'list',
        default: 'routes',
        choices: toNumberedList(this.phases.concat([LAST_PHASE])),
        when: function(answers) {
          return answers.phase === OTHER_PHASE;
        }
      },
      {
        name: 'subPhase',
        message: 'Select the sub phase for ' + displayName + ':',
        type: 'list',
        default: '',
        choices: [
          {name: '1. before', value: 'before'},
          {name: '2. regular', value: ''},
          {name: '3. after', value: 'after'}
        ]
      },
    ];

    this.prompt(prompts, function(props) {
      this.phase = props.customPhase || props.phase;
      this.customPhase = props.customPhase;
      this.nextPhase = props.nextPhase;
      this.subPhase = props.subPhase;
      done();
    }.bind(this));
  },

  promptForPaths: function() {
    var displayName = chalk.yellow(this.name);
    this.log('Specify paths for ' + displayName + ':');
  },

  askForPaths: function() {
    var done = this.async();
    this.log('Enter an empty path name when done.');
    var prompts = [
      {
        name: 'path',
        message: 'Path uri:',
        validate: function(input) {
          if (input) {
            if (input.indexOf('/') !== 0) {
              return 'Path must start with /';
            } else {
              return true;
            }
          } else {
            return true;
          }
        }
      }
    ];
    this.prompt(prompts, function(answers) {
      if (answers.path == null || answers.path === '') {
        return done();
      }

      this.paths = this.paths || [];
      this.paths.push(answers.path);
      this.log('Let\'s add another path.');
      this.askForPaths();
    }.bind(this));
  },

  askForParams: function() {
    var done = this.async();
    var prompts = [
      {
        name: 'params',
        message: 'Configuration parameters in JSON format:',
        default: '{}',
        validate: function(input) {
          if (input) {
            try {
              JSON.parse(input);
            } catch (err) {
              return err;
            }
            return true;
          } else {
            return true;
          }
        }
      }
    ];
    this.prompt(prompts, function(answers) {
      this.params = JSON.parse(answers.params);
      done();
    }.bind(this));
  },

  middleware: function() {
    var done = this.async();
    var config = {
      name: this.name,
      phase: this.phase,
      subPhase: this.subPhase,
      paths: this.paths,
      params: this.params || {},
      facetName: 'server' // hard-coded for now
    };

    var self = this;

    if (self.customPhase && self.nextPhase) {
      if (self.nextPhase === LAST_PHASE) {
        self.nextPhase = null;
        config.nextPhase = self.nextPhase;
      } else {
        config.nextPhase = self.nextPhase;
      }
    }

    wsModels.Middleware.addMiddleware(config, function(err, inst) {
      helpers.reportValidationError(err, self.log);
      if (!err && inst) {
        self.log(
          'Middleware %s is added to phase %s.', inst.name, inst.phase);
      }
      return done(err);
    });
  },

  saveProject: actions.saveProject
});
