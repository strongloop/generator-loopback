// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var path = require('path');
var g = require('strong-globalize')();
var glob = require('glob');
var fs = require('fs');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;
var readChunk = require('read-chunk');
var istextorbinary = require('istextorbinary');

module.exports = function ActionsMixin(baseClass) {
  return class extends baseClass {
    constructor(args, opts) {
      super(args, opts);
    }
    // All actions defined in this file should be called with `this` pointing
    // to a generator instance

    /**
 * Decide where to create the project, possibly asking the user,
 * and set the generator environment so that everything is generated
 * in the target directory.
 */
    configureDestinationDir() {
      if (this.options.nested && this.options.projectDir) {
        // no-op when called from `yo loopback:example`
        return;
      }

      if (this.appname === path.basename(this.destinationRoot())) {
        // When the project name is the same as the current directory,
        // we are assuming the user has already created the project dir
        return;
      }

      var done = this.async();
      return this.prompt([
        {
          name: 'dir',
          message: g.f('Enter name of the directory to contain the project:'),
          default: this.appname,
        },
      ]).then(function(answers) {
        var dir = answers.dir;
        this.dir = dir;
        if (!dir || dir === '.') return done();

        var root = path.join(this.destinationRoot(), dir);
        if (!fs.existsSync(root)) {
          this.log.create(dir + '/');
          fs.mkdirSync(root);
        }
        this.destinationRoot(root);
        this.log.info(g.f('change the working directory to %s', dir));
        this.log();
        done();
      }.bind(this));
    }

    /**
 * Initialize the workspace to use the destination root as WORKSPACE_DIR.
 */
    initWorkspaceForGenerator() {
      if (this.options && this.options.nested && this.options.projectDir) {
        this._externalProject = true;
        this.projectDir = this.options.projectDir;
        return true;
      }

      this.projectDir = this.destinationRoot();

      process.env.WORKSPACE_DIR = this.projectDir;

      return false;
    }

    /**
 * Load the project in `this.destinationRoot()`.
 * Set `this.projectDir`.
 * @async
 */
    // NOTE(jannyhou)
    // Renamed this function to avoid the dup name in each generator's index.js file.
    loadProjectForGenerator() {
      if (this.initWorkspaceForGenerator())
        return;

      var done = this.async();
      Workspace.isValidDir(done);
    }

    /**
 * Save the current project, update all project files.
 */
    saveProjectForGenerator() {
      if (this._externalProject) {
        return;
      }

      // no-op in workspace 3.0
    }

    /**
 * Load all models of the current project.
 * `this.projectModels` will contain an array of all models (Array.<Model>)
 * `this.modelNames` will contain an array of names (Array.<string>)
 * `this.editableModels` will contain an array of models without read-only
 * models (Array.<Model>)
 * `this.editableModelNames` will contain an array of names (Array.<string>)
 */
    loadModelsForGenerator() {
      var done = this.async();
      workspace.models.ModelDefinition.find(function(err, results) {
        if (err) return done(err);
        this.projectModels = results;
        this.modelNames = results.map(function(m) {
          return m.name;
        });
        this.editableModels = results.filter(function(result) {
          return !result.readonly;
        });
        this.editableModelNames = this.editableModels.map(function(m) {
          return m.name;
        });
        done();
      }.bind(this));
    }

    /**
 * Install npm dependencies, unless the option "skip-install" is enabled.
 *
 * Note that this action only schedules the install step to the task queue,
 * the actual installation is invoked later as part of the "installing" phase.
 */
    installDeps() {
      // yeoman-generator 0.20.x checks this.options.skipInstall
      this.options.skipInstall = this.options['skip-install'];

      this.installDependencies({
        npm: true,
        bower: false,
      });
    }

    /**
 * Load all data sources of the current project
 * `this.dataSources` will contain an array of data sources
 */
    loadDatasourcesForGenerator() {
      var self = this;
      var done = self.async();

      workspace.models.DataSourceDefinition.find(function(err, results) {
        if (err) {
          return done(err);
        }
        self.dataSources = results.map(function(ds) {
          return {
            name: ds.name + ' (' + ds.connector + ')',
            value: ds.name,
            _connector: ds.connector,
            data: ds.__data,
          };
        });

        self.hasDatasources = self.dataSources && self.dataSources.length > 0;

        // Use 'db' as the default datasource if it exists
        var defaultDS = null;
        if (self.hasDatasources) {
          var found = self.dataSources.some(function(ds) {
            return ds.value === 'db';
          });
          if (found) {
            defaultDS = 'db';
          } else {
            // default to 1st one
            defaultDS = self.dataSources[0].value;
          }
        }
        self.defaultDataSource = defaultDS;
        done();
      });
    }

    /**
 * Modify the list of datasources created by {@link loadDataSources}
 * and append an item for `null` datasource.
 */
    addNullDataSourceItemForGenerator() {
      this.dataSources.push({
        name: '(no datasource)',
        value: null,
      });
    }

    /**
 * Make some of the file API aware of our source/destination root paths.
 * `copy`, `template` (only when could be applied/required by legacy code),
 * `write` and alike consider.
 *
 * @param {String} source      Source file to copy from. Relative to this.sourceRoot()
 * @param {String} destination Destination file to write to. Relative to this.destinationRoot()
 */

    copy(source, dest) {
      dest = dest || source;
      source = this.templatePath(source);
      var headers = readChunk.sync(source, 0, 512);

      if (istextorbinary.isBinarySync(undefined, headers)) {
        this.fs.copy(source, this.destinationPath(dest));
      } else {
        this.template(source, dest);
      }
    }

    directory(source, destination) {
      // Only add sourceRoot if the path is not absolute
      var root = this.templatePath(source);
      var files = glob.sync('**', {dot: true, nodir: true, cwd: root});

      destination = destination || source;

      if (typeof destination === 'function') {
        process = destination;
        destination = source;
      }

      var cp = this.copy;

      // get the path relative to the template root, and copy to the relative destination
      for (var i in files) {
        var dest = path.join(destination, files[i]);
        cp.call(this, path.join(root, files[i]), dest, process);
      }
    }

    /**
 * Gets a template at the relative source, executes it and makes a copy
 * at the relative destination. If the destination is not given it's assumed
 * to be equal to the source relative to destination.
 *
 * The template engine processing the file is [ejs](http://ejs.co)
 *
 * use options to pass parameters to engine (ejs options)
 *
 * @param {String} source      Source file to read from. Relative to this.sourceRoot()
 * @param {String} destination Destination file to write to. Relative to this.destinationRoot().
 * @param {Object} data        Hash to pass to the template. Leave undefined to use the generator instance context.
 * @param {Object} options
 */

    template(source, dest, data, options) {
      if (typeof dest !== 'string') {
        options = data;
        data = dest;
        dest = source;
      }
      var destPath = this.destinationPath(dest);
      this.fs.copyTpl(
        this.templatePath(source),
        destPath,
        data || this,
        options
      );
    }
  };
};

