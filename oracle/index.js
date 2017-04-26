// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var open = require('open');

var helpText = require('../lib/help');
var oci = require('./oci');
var discoverOCI = oci.dsicoverOCI;
var detectClientPlatform = oci.detectClientPlatform;

var INSTALL_URL =
  'https://github.com/oracle/node-oracledb/blob/master/INSTALL.md';
var ORACLE_IC_URL =
  'http://www.oracle.com/technetwork/database/features/' +
  'instant-client/index-097480.html';

var binary = 'node_modules/oracledb/build/Release/oracledb.node';

module.exports = yeoman.Base.extend({

  constructor: function() {
    yeoman.Base.apply(this, arguments);

    this.option('connector', {
      desc: g.f('Install loopback-connector-oracle module'),
      required: false,
      type: Boolean,
    });

    this.option('driver', {
      desc: g.f('Install oracledb module'),
      required: false,
      type: Boolean,
    });

    this.option('verbose', {
      desc: g.f('Print verbose information'),
      required: false,
      type: Boolean,
    });

    // Prevent "warning: possible EventEmitter memory leak detected"
    // when adding more than 10 properties
    // See https://github.com/strongloop/generator-loopback/issues/99
    this.env.sharedFs.setMaxListeners(256);

    // A workaround to get rid of deprecation notice
    //   "generator#invoke() is deprecated. Use generator#composeWith()"
    // See https://github.com/strongloop/generator-loopback/issues/116
    this.invoke = require('yeoman-generator/lib/actions/invoke');
  },

  help: function() {
    return helpText.customHelp(this, 'loopback_oracle_usage.txt');
  },

  checkConnector: function() {
    try {
      var m = require(
        this.destinationPath('node_modules/loopback-connector-oracle'));
      this.log(chalk.green('Oracle connector is ready.'));
      if (!this.options.connector && !this.options.driver) this.skip = true;
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        // loopback-connector-oracle is not installed
        this.log(chalk.red(
          'Module is not installed: ' + e));
        this.options.connector =
          e.message.indexOf('loopback-connector-oracle') !== -1;
        this.options.driver =
          e.message.indexOf('oracledb') !== -1;
      } else {
        // oracledb cannot be loaded due to dynamic lib issues
        this.log(chalk.red(
          'Module oracledb fails to load: ' + e));
        this.options.driver = true;
      }
    }
  },

  discoverOCI: function() {
    if (this.skip) return;
    var oci = discoverOCI(this.options.verbose ? this.log : null);
    if (!oci.libDir) {
      this.log(chalk.red('Oracle Instant Client is not found. ' +
        'Please follow instructions at ' + INSTALL_URL));
      var done = this.async();

      var prompts = [
        {
          name: 'openIC',
          message: g.f('Open Oracle instant client download page?'),
          type: 'confirm',
          default: true,
        },
      ];

      return this.prompt(prompts).then(function(props) {
        if (props.openIC) {
          open(ORACLE_IC_URL);
          this.skip = true;
        }
        done();
      }.bind(this));
    } else {
      process.env.OCI_LIB_DIR = oci.libDir;
      process.env.OCI_INC_DIR = oci.incDir;
      this.log(chalk.green('Oracle Instant Client is found:'));
      this.log(chalk.green('  - Library path: ' + oci.libDir));
      this.log(chalk.green('  - Include path: ' + oci.incDir));
      if (oci.dylibDir) {
        this.log(chalk.green('  - Dynamic library path: ' + oci.dylibDir));
      }

      var client = detectClientPlatform();
      this.log(chalk.green('Current platform:'));
      for (var i in client) {
        this.log(chalk.green('  - ' + i + ': ' + client[i]));
      }
    }
  },

  installConnector: function() {
    if (!this.options.connector) return;
    var npmModule = 'loopback-connector-oracle';

    var done = this.async();

    var prompts = [
      {
        name: 'installConnector',
        message: g.f('Install %s?', npmModule),
        type: 'confirm',
        default: true,
        when: !this.skip,
      },
    ];

    return this.prompt(prompts).then(function(props) {
      if (props.installConnector) {
        // Delete node_modules/loopback-oracle-installer so that
        // npm install loopback-connector-oracle will trigger post-install
        var dir = this.destinationPath(
          'node_modules/loopback-oracle-installer');
        if (this.options.verbose) {
          this.log('Removing directory: ' + dir);
        }
        fse.removeSync(dir);
        this.npmInstall([npmModule],
          {save: true, verbose: this.options.verbose});
        done();
      } else {
        done();
      }
    }.bind(this));
  },

  installDriver: function() {
    if (!this.options.driver) return;
    var npmModule = 'oracledb';
    var done = this.async();

    var prompts = [
      {
        name: 'installDriver',
        message: g.f('Install %s?', npmModule),
        type: 'confirm',
        default: true,
        when: !this.skip,
      },
    ];

    return this.prompt(prompts).then(function(props) {
      if (props.installDriver) {
        // Delete node_modules/loopback-connector-oracle/node_modules/oracledb
        // so that the top-level oracledb will be used
        var dir =
          this.destinationPath(
            'node_modules/loopback-connector-oracle/node_modules/oracledb');
        if (this.options.verbose) {
          this.log('Removing directory: ' + dir);
        }
        fse.removeSync(dir);
        // Force RPATH
        process.env.FORCE_RPATH = '1';
        this.npmInstall([npmModule],
          {save: false, verbose: this.options.verbose});
        done();
      } else {
        done();
      }
    }.bind(this));
  },

  // Make sure checkDriver will be run after npm install
  end: {
    requireConnector: function() {
      if (this.skip) return;
      try {
        var m = require(
          this.destinationPath('node_modules/loopback-connector-oracle'));
        this.log(chalk.green('Oracle connector is ready.'));
      } catch (e) {
        this.log(chalk.red('Oracle connector fails to load: ' + e));
        this.log(
          chalk.red('Please try `lb oracle --driver` or ' +
            'follow instructions at ' + INSTALL_URL + '.'));
        var done = this.async();

        var prompts = [
          {
            name: 'openInstruction',
            message: g.f('Open oracledb installation page?'),
            type: 'confirm',
            default: true,
          },
        ];

        return this.prompt(prompts).then(function(props) {
          if (props.openInstruction) {
            open(INSTALL_URL);
          }
          done();
        }.bind(this));
      }
    },
  },

});
