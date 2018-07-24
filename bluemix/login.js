// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var ora = require('ora');
var g = require('../lib/globalize');
var path = require('path');
var os = require('os');
var chalk = require('chalk');
var cf = require('loopback-bluemix').cf;

module.exports = login;

function login() {
  var config = cf.getCfConfig();
  if (config) {
    this.accessToken = config.accessToken;
  }
  // Skip login if --login=false
  if (this.options.login === false) return;
  // Skip login if --login or --sso is not present and accessToken is found
  if (!(this.options.login || this.options.sso) && this.accessToken) return;
  var done = this.async();
  this.log(g.f('Log into your Bluemix account:'));
  var prompts = [
    {
      name: 'apiURL',
      message: g.f('URL for bluemix APIs:'),
      default: config.apiURL || 'https://api.ng.bluemix.net',
    },
    {
      name: 'sso',
      message: g.f('Use Single Sign-On (SSO):'),
      type: 'confirm',
      default: false,
      when: this.options.sso === undefined,
    },
  ];
  this.prompt(prompts).then(function(answers) {
    this.apiURL = answers.apiURL;
    this.sso = this.options.sso || answers.sso;
    var options = {apiURL: this.apiURL, sso: this.sso};
    var prompts = [];
    if (this.sso) {
      prompts = [
        {
          name: 'password',
          message: g.f('Get one time passcode from ' +
            'https://iam.ng.bluemix.net/oidc/passcode:'),
          type: 'password',
        },
      ];
    } else {
      prompts = [
        {
          name: 'email',
          message: g.f('Email for your account:'),
          validate: function(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return email.match(re) ? true : g.f('Invalid email: ') + email;
          },
        },
        {
          name: 'password',
          message: g.f('Password for your account:'),
          type: 'password',
        },
      ];
    }
    this.prompt(prompts).then(function(answers) {
      var spinner = ora(g.f('Logging into Bluemix...')).start();
      cf.login(answers.email, answers.password, options, function(err, result) {
        if (err || 'error' in result) {
          var errMsg = err || result.error;
          spinner.fail(g.f('Login failed: ') + errMsg);
          var prompts = [
            {
              name: 'tryAgain',
              message: g.f('Do you want to try again? '),
              type: 'confirm',
              default: true,
            },
          ];
          this.prompt(prompts).then(function(answers) {
            if (answers.tryAgain) {
              login.apply(this);
            } else {
              this.log(chalk.red(g.f('Login aborted.')));
              process.exit();
            }
          }.bind(this));
          return;
        }
        this.bluemixCredentials = result;
        this.accessToken = result['access_token'];
        this.refreshToken = result['refresh_token'];
        spinner.text = g.f('Listing organizations from Bluemix...');
        cf.getOrganizations(this.accessToken, options, function(err, orgs) {
          if (err) return done(err);
          var choices = orgs.map(function(o) {
            return {
              name: o.entity.name,
              value: o,
            };
          });
          if (choices.length === 1) {
            this.log(chalk.cyan(
              g.f('> Default organization: ') + choices[0].name
            ));
            this.organization = choices[0].value;
          }
          var prompts = [
            {
              name: 'organization',
              message: g.f('Choose the default organization: '),
              type: 'list',
              choices: choices,
              when: choices.length > 1,
            },
          ];
          this.prompt(prompts).then(function(answers) {
            if ('organization' in answers) {
              this.organization = answers.organization;
            }
            spinner.text = g.f('Listing spaces from Bluemix...');
            cf.getSpaces(this.organization, this.accessToken, options,
              function(err, spaces) {
                if (err) return done(err);
                var choices = spaces.map(function(s) {
                  return {
                    name: s.entity.name,
                    value: s,
                  };
                });
                if (choices.length === 1) {
                  this.log(chalk.cyan(
                    g.f('> Default space: ') + choices[0].name
                  ));
                  this.space = choices[0].value;
                }
                var prompts = [
                  {
                    name: 'space',
                    message: g.f('Choose the default space: '),
                    type: 'list',
                    choices: choices,
                    when: choices.length > 1,
                  },
                  {
                    name: 'rememberMe',
                    message: g.f('Remember my login:'),
                    type: 'confirm',
                    default: true,
                  },
                ];
                spinner.stop();
                this.prompt(prompts).then(function(answers) {
                  if ('space' in answers) {
                    this.space = answers.space;
                  }
                  if (answers.rememberMe) {
                    var conf = {
                      apiURL: this.apiURL,
                      accessToken: this.accessToken,
                      organization: {
                        guid: this.organization.metadata.guid,
                        name: this.organization.entity.name,
                      },
                      space: {
                        guid: this.space.metadata.guid,
                        name: this.space.entity.name,
                      },
                    };
                    this.fs.writeJSON(path.join(os.homedir(),
                      '.bluemix/.loopback/config.json'), conf);
                  }
                  done();
                }.bind(this));
              }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
}
