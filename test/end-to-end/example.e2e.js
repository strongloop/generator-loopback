/*global describe, before, it */
'use strict';
var exec = require('child_process').exec;
var extend = require('util')._extend;
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX = path.resolve(__dirname, '..', 'sandbox');
var common = require('../common');

// Note: this end-to-end test takes several minutes to run.
describe('loopback:example generator (end-to-end)', function() {
  this.timeout(30 * 60 * 1000); // 30 minutes

  before(common.resetWorkspace);
  before(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  before(function runGenerator(done) {
    var gen = common.createExampleGenerator();
    helpers.mockPrompt(gen, {});

    gen.run({}, function() {});
    gen.once('end', done);
  });

  before(function installPackage(done) {
    console.error('Running `npm install`');
    execNpm(['install'], { cwd: SANDBOX }, done);
  });

  test('memory');

  if (process.env.TEST_SLOW) {
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

  // See strong-cli/lib/command for full implementation of windows quoting
  // https://github.com/strongloop/strong-cli/blob/master/lib/command.js
  // Since we don't expect " in npm arguments, let's skip full quoting
  // and throw an error instead.
  throw new Error('command line arguments must not contain \'"\' character');
}
