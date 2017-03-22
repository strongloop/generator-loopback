#!/usr/bin/env node
// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const camelCaseKeys = require('camelcase-keys');
const debug = require('debug')('loopback:cli');
const nopt = require('nopt');
const path = require('path');

const opts = nopt({
  help: Boolean,
  version: Boolean,
  commands: Boolean,
}, {
  h: '--help',
  v: '--version',
  l: '--commands',
});

if (opts.version) {
  const ourVersion = require('../package.json').version;
  const generatorVersion = require('./../package.json').version;
  console.log('%s (chtr-generator-loopback@%s)', ourVersion, generatorVersion);
  return;
}

// Tell the generator to replace "yo loopback:" with "lb"
process.env.SLC_COMMAND = 'chtr-loopback-cli';

// NOTE(bajtos) Loading chtr-generator-loopback takes about a second,
// therefore I am intentionally loading it only after we have
// handled the "--version" case which becomes much faster as the result.
const lbGenerator = require('../app/index');
const yeoman = lbGenerator._yeoman; // chtr-generator-loopback should export _yeoman
assert(yeoman, 'chtr-generator-loopback should export _yeoman');

const env = yeoman();

// Change the working directory to the chtr-generator-loopback module so that
// yeoman can discover the generators
const root = path.dirname(require.resolve('../package.json'));
const cwd = process.cwd();
debug('changing directory to %s', root);
process.chdir(root);

// lookup for every namespaces, within the environments.paths and lookups
env.lookup();
debug('changing directory back to %s', cwd);
process.chdir(cwd); // Switch back

// list generators
if (opts.commands) {
  console.log('Available commands: ');
  var list = Object.keys(env.getGeneratorsMeta())
    .filter(name => /^loopback:/.test(name))
    .map(name => name.replace(/^loopback:/, '  lbchtr '));
  console.log(list.join('\n'));
  return;
}

const args = opts.argv.remain;
const originalCommand = args.shift();
const command = 'loopback:' + (originalCommand || 'app');
args.unshift(command);
debug('invoking generator', args);

// `yo` is adding flags converted to CamelCase
const options = camelCaseKeys(opts, {exclude: ['--', /^\w$/, 'argv']});
Object.assign(options, opts);

// Handle unknown command (generator)
// This code overrides the error reported by yeoman:
//   You don’t seem to have a generator with the name “' + n + '” installed.
//   But help is on the way:
//   (etc.)
try {
  const generator = env.create(command, {args});
  if (generator instanceof Error)
    throw generator;
} catch (err) {
  debug('Cannot load generator %s: %s', command, err.stack);
  console.error(
    'Unknown command %j\n' +
      'Run "%s --commands" to print the list of available commands.',
    originalCommand, process.argv[1]);
  process.exit(1);
}

debug('env.run %j %j', args, options);
env.run(args, options);
