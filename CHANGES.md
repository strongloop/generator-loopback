2015-03-11, Version 1.9.0
=========================

 * Create .yo-rc.json when scaffolding new apps (Simon Ho)


2015-03-11, Version 1.8.0
=========================

 * Add boot script generator (Simon Ho)


2015-02-24, Version 1.7.3
=========================

 * Use async features in example generator (Simon Ho)

 * Upgrade strong-cached-install to ^2.0 for io.js (Miroslav Bajtoš)


2015-02-18, Version 1.7.2
=========================

 * Refactor `injectWorkspaceCopyRecursive` (Simon Ho)

 * Fix tests failing on latest yeoman-generator (Miroslav Bajtoš)


2015-01-22, Version 1.7.1
=========================

 * test: fix jshint warning (Ryan Graham)

 * example: support both flavours of status route (Miroslav Bajtoš)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-12-18, Version 1.7.0
=========================

 * Allow subpath for basePath (Raymond Feng)

 * Fix swagger v2.0 version str (Raymond Feng)


2014-12-11, Version 1.6.2
=========================

 * Fix bad path expansion in loopback:example (Ryan Graham)


2014-12-04, Version 1.6.1
=========================

 * Update dependencies (Miroslav Bajtoš)


2014-12-02, Version 1.6.0
=========================

 * example: use the new middleware registration (Miroslav Bajtoš)

 * Drop `must`, use `chai` instead (Miroslav Bajtoš)

 * Fix path encoding when it contains brackets (Peter Nagy)


2014-11-05, Version 1.5.1
=========================

 * Bump version (Raymond Feng)

 * Capture the dir property (Raymond Feng)


2014-11-05, Version 1.5.0
=========================

 * model: prompt for base model (Miroslav Bajtoš)


2014-11-03, Version 1.4.0
=========================

 * Rework the prompt for the destination dir (Miroslav Bajtoš)

 * Allow through model for hasMany relations (Raymond Feng)

 * Skip accessType prompt if acl scope is method (Raymond Feng)

 * example: compat fix (Miroslav Bajtoš)

 * fixed doc link (Rand McKinney)

 * model: support null data source (Miroslav Bajtoš)


2014-10-02, Version 1.3.2
=========================

 * Bump version (Raymond Feng)

 * Normalize the appname (Raymond Feng)

 * Add contribution guidelines (Ryan Graham)


2014-09-26, Version 1.3.1
=========================

 * Allow custom roles to be specified (Raymond Feng)

 * app: fix instructions (Miroslav Bajtoš)

 * Fix the default connector name (Raymond Feng)

 * Create ACLs in series (Ritchie Martori)

 * Bump version (Raymond Feng)

 * Fix the default access type (Raymond Feng)

 * Update project description (Raymond Feng)

 * Add a section to cover swagger 1.2 (Raymond Feng)

 * Update README (Raymond Feng)


2014-09-05, Version 1.3.0
=========================

 * Bump version (Raymond Feng)

 * Fix the base model (Raymond Feng)

 * Add README as a tutorial (Raymond Feng)

 * Add loopback:swagger generator (Raymond Feng)

 * example: add geo to sample locations (Miroslav Bajtoš)

 * example: fix sample-data/import script (Miroslav Bajtoš)

 * Improve loopback:relation for custom model name (Clark Wang)


2014-08-20, Version 1.2.2
=========================

 * Bump version (Raymond Feng)

 * Fix the require path (Raymond Feng)


2014-08-06, Version 1.2.1
=========================

 * Bump version (Raymond Feng)

 * Enhance the help to print out list of generators (Raymond Feng)


2014-08-04, Version 1.2.0
=========================

 * Update strong-cli references to strongloop (Krishna Raman)

 * Fix the require to reference server instead of app for 2.x (Raymond Feng)

 * Bump version (Raymond Feng)

 * Make sure the help text will reflect the command (slc or yo) (Raymond Feng)

 * Make generator-loopback friendly to slc (Raymond Feng)


2014-07-25, Version 1.1.2
=========================

 * Bump version (Raymond Feng)

 * Fix loopback:acl for all models (Raymond Feng)


2014-07-25, Version 1.1.1
=========================

 * Downgrade to yeoman-generator 0.16 (Miroslav Bajtoš)


2014-07-24, Version 1.1.0
=========================

 * example: add LICENSE, README and create-load.js (Miroslav Bajtoš)

 * example: fix a bug introduced by yeoman upgrade (Miroslav Bajtoš)

 * example: use `npm pretest` from workspace (Miroslav Bajtoš)

 * relation: provide default for 'asPropertyName' (Miroslav Bajtoš)

 * Upgrade yeoman-generator dependency to 0.17 (Miroslav Bajtoš)

 * example: use the new generator `loopback:relation` (Miroslav Bajtoš)

 * relation: prompt for `foreignKey` (Miroslav Bajtoš)


2014-07-22, Version 1.0.0
=========================

 * example: fix sample query in index.html (Miroslav Bajtoš)

 * example: update intro text and URL in index.html (Miroslav Bajtoš)

 * package: update dependencies (Miroslav Bajtoš)

 * Use this.dir to control print out of 'cd <dir>' (Raymond Feng)

 * Make validation messages more meaningful (Raymond Feng)

 * Add test cases (Raymond Feng)

 * model: set `base` depending on connector used (Miroslav Bajtoš)

 * example: update for recent boot changes (Miroslav Bajtoš)

 * relation: fix jshint warnings (Miroslav Bajtoš)

 * Remove sourcemap to avoid 404 (Raymond Feng)

 * Add validations to app/model/property/connector/ds names (Raymond Feng)

 * Add instructions to cd <app-dir> (Raymond Feng)

 * Update package description (Raymond Feng)

 * Add relation generator (Ritchie Martori)


2014-07-17, Version 1.0.0-beta2
===============================

 * Remove the 'files' attr which prevents other files to be installed (Raymond Feng)


2014-07-17, Version 1.0.0-beta1
===============================

 * 1.0.0-beta1 (Miroslav Bajtoš)

 * property: fix array type (Miroslav Bajtoš)

 * example: slow down Google Maps API request (Miroslav Bajtoš)

 * package: use loopback-workspace from npm (Miroslav Bajtoš)

 * acl: remove "property" from the list of scopes (Miroslav Bajtoš)

 * model: ask for the plural form (Miroslav Bajtoš)

 * property: support typed array (Miroslav Bajtoš)

 * model: show connector names in list of datasources (Miroslav Bajtoš)

 * datasource: prompt for the datasource name (Miroslav Bajtoš)

 * model: prompt for the model name (Miroslav Bajtoš)

 * app: add dummy client/README.md (Miroslav Bajtoš)

 * Update to the new workspace layout (Miroslav Bajtoš)

 * package: fixate loopback-workspace version (Miroslav Bajtoš)

 * test: fix expected location of models' idInjection (Miroslav Bajtoš)

 * example: fix typo in relation definition (Miroslav Bajtoš)

 * example: add jshint and fix style violations (Miroslav Bajtoš)

 * example: remove models/car.js template (Miroslav Bajtoš)

 * example: make db connectors an optional dependency (Miroslav Bajtoš)

 * test: fix typo in example.test.js (Miroslav Bajtoš)

 * test: improve logs when a files was not created (Miroslav Bajtoš)

 * package: update "must" to "^0.12.0" (Miroslav Bajtoš)

 * test: increase test timeout (Miroslav Bajtoš)

 * app,example: ask where to create the project (Miroslav Bajtoš)

 * test/end-to-end: use strong-cached-install (Miroslav Bajtoš)

 * app: fail in an non-empty directory (Miroslav Bajtoš)

 * example: scaffold rest-api tests (Miroslav Bajtoš)

 * example: fix indentation and jshint warnings (Miroslav Bajtoš)

 * example: implement nearby query (Miroslav Bajtoš)

 * example: add sample data generator (Miroslav Bajtoš)

 * example: fix database mappings (Miroslav Bajtoš)

 * example: Update demo datasource config (Miroslav Bajtoš)

 * example: Initial implementation (Miroslav Bajtoš)

 * test: fix tests depending on race condition (Miroslav Bajtoš)

 * model: support undefined answers.propertyName (Miroslav Bajtoš)

 * test: remove `id` from acl entries (Miroslav Bajtoš)

 * Extract method actions.initWorkspace (Miroslav Bajtoš)

 * model: fix model config in models.json (Miroslav Bajtoš)

 * actions: validate the workspace dir in loadProject (Miroslav Bajtoš)

 * test/app: check *.js files are created (Miroslav Bajtoš)

 * app: Provide custom copyRecursive implementation (Miroslav Bajtoš)

 * clean up TODO comments (Miroslav Bajtoš)

 * Rework the implementation to workspace 3.0 (Miroslav Bajtoš)

 * jshintrc: use the strongloop coding style (Miroslav Bajtoš)

 * jshintrc: set latedef to nofunc (Miroslav Bajtoš)

 * fixup! app option --skip-install (Miroslav Bajtoš)

 * model: implement the Model generator (Miroslav Bajtoš)

 * app: implement the main generator (Miroslav Bajtoš)


2014-06-27, Version 0.9.0
=========================

 * First release!
