/*global describe, before, it */
'use strict';
var path = require('path');
var exec = require('child_process').exec;
var extend = require('util')._extend;
var install = require('strong-cached-install');
var helpers = require('yeoman-generator').test;
var common = require('../common');

var SANDBOX = path.resolve(__dirname, '..', 'sandbox');
var PKG_CACHE = path.resolve(__dirname, '..', '.pkgcache');
var TEST_SLOW = process.env.TEST_SLOW;

// Note: this end-to-end test takes several minutes to run.
describe('loopback:example generator (end-to-end)', function() {
  this.timeout(30 * 60 * 1000); // 30 minutes

  before(common.resetWorkspace);
  before(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  before(function runGenerator(done) {
    var gen = common.createExampleGenerator();
    helpers.mockPrompt(gen, {
      dir: '.'
    });
    gen.run(done);
  });

  before(function installPackage(done) {
    console.error('Installing project dependencies');

    var deps = ['dependencies', 'devDependencies'];
    if (TEST_SLOW)
      deps.push('optionalDependencies');

    install(SANDBOX, PKG_CACHE, deps, done);
  });

  test('memory');

  if (TEST_SLOW) {
    ['mongodb', 'mysql', 'oracle'].forEach(function(db) {
      it('passes generated tests against ' + db, function(done) {
        var opts = {
          cwd: SANDBOX,
          env: { DB: db }
        };
        execNpm(['test'], opts, done);
      });
    });
  } else {
    console.error('Skipping tests against demo databases.');
    console.error('Run with TEST_SLOW=1 to enable those tests.');
  }

  function test(db) {
    it('passes generated tests against ' + db, function(done) {
      var opts = {
        cwd: SANDBOX,
        env: { DB: db }
      };
      execNpm(['test'], opts, done);
    });
  }
});

function execNpm(args, options, cb) {
  var debug = require('debug')('test:exec-npm');
  options = options || {};
  options.env = extend(
    {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
    },
    options.env
  );

  var command = 'npm ' + args.map(quoteArg).join(' ');
  debug(command);
  return exec(command, options, function(err, stdout, stderr) {
    debug('--npm install stdout--\n%s\n--npm install stderr--\n%s\n--end--',
      stdout, stderr);
    cb(err, stdout, stderr);
  });
}

function quoteArg(arg) {
  if (!/[ \t]/.test(arg))
    return arg;
  if (!/"/.test(arg))
    return '"' + arg + '"';

  // See strongloop/lib/command for full implementation of windows quoting
  // https://github.com/strongloop/strongloop/blob/master/lib/command.js
  // Since we don't expect " in npm arguments, let's skip full quoting
  // and throw an error instead.
  throw new Error('command line arguments must not contain \'"\' character');
}
