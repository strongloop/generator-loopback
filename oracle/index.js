// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var g = require('../lib/globalize');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var fse = require('fs-extra');
var open = require('opn');
var ActionsMixin = require('../lib/actions');
var helpText = require('../lib/help');
var oci = require('./oci');
var discoverOCI = oci.discoverOCI;
var detectClientPlatform = oci.detectClientPlatform;

var INSTALL_URL =
  'https://github.com/oracle/node-oracledb/blob/master/INSTALL.md';
var ORACLE_IC_URL =
  'http://www.oracle.com/technetwork/database/features/' +
  'instant-client/index-097480.html';

module.exports = class OracleGenerator extends ActionsMixin(yeoman) {
  constructor(args, opts) {
    super(args, opts);

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
  }

  help() {
    return helpText.customHelp(this, 'loopback_oracle_usage.txt');
  }

  checkConnector() {
    try {
      var m = require(
        this.destinationPath('node_modules/loopback-connector-oracle')
      );
      this.log(chalk.green(g.f('Oracle connector is ready.')));
      if (!this.options.connector && !this.options.driver) this.skip = true;
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        // loopback-connector-oracle is not installed
        this.log(chalk.red(
          g.f('Module is not installed: %s', e)
        ));
        this.options.connector =
          e.message.indexOf('loopback-connector-oracle') !== -1;
        this.options.driver =
          e.message.indexOf('oracledb') !== -1;
      } else {
        // oracledb cannot be loaded due to dynamic lib issues
        this.log(chalk.red(
          g.f('Module oracledb fails to load: %s', e)
        ));
        this.options.driver = true;
      }
    }
  }

  discoverOCI() {
    if (this.skip) return;
    var oci = discoverOCI(this.options.verbose ? this.log : null);
    if (!oci.libDir) {
      this.log(chalk.red(g.f('Oracle Instant Client is not found. \
Please follow instructions at %s.', INSTALL_URL)));
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
      this.log(chalk.green(g.f('Oracle Instant Client is found:')));
      this.log(chalk.green(g.f('  - Library path: ' + oci.libDir)));
      this.log(chalk.green(g.f('  - Include path: ' + oci.incDir)));
      if (oci.dylibDir) {
        this.log(chalk.green(g.f('  - Dynamic library path: ' + oci.dylibDir)));
      }

      var client = detectClientPlatform();
      this.log(chalk.green(g.f('Current platform:')));
      for (var i in client) {
        this.log(chalk.green(g.f('  - ' + i + ': ' + client[i])));
      }
    }
  }

  installConnector() {
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
          'node_modules/loopback-oracle-installer'
        );
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
  }

  installDriver() {
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
            'node_modules/loopback-connector-oracle/node_modules/oracledb'
          );
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
  }

  // Make sure checkDriver will be run after npm install
  requireDriver() {
    if (this.skip) return;
    try {
      // We cannot check by requiring node_modules/loopback-connector-oracle
      // here as it's cached by previous require
      // First check node_modules/oracledb
      require(
        this.destinationPath('node_modules/oracledb')
      );
      this.log(chalk.green(g.f('Oracle driver is ready.')));
    } catch (e) {
      try {
        // Try the local oracledb inside loopback-connector-oracle
        require(
          this.destinationPath(
            'node_modules/loopback-connector-oracle/node_modules/oracledb'
          )
        );
        this.log(chalk.green(g.f('Oracle driver is ready.')));
      } catch (e) {
        this.log(chalk.red(g.f('Oracle driver fails to load: %s', e)));
        this.log(
          chalk.red(
            g.f(
              'Please try `lb oracle --driver` or follow instructions at %s.',
              INSTALL_URL
            )
          )
        );
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
    }
  }
};
