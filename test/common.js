/*jshint latedef:nofunc */
'use strict';
var generators = require('yeoman-generator');

exports.createGenerator = createGenerator;

function createGenerator(name, path, deps, args, opts) {
  var env = generators();

  deps = deps || [];
  deps.forEach(function(d) {
    d = Array.isArray(d) ? d : [d];
    env.register.apply(env, d);
  });

  env.register(path, name);

  return env.create(name, { arguments: args || [], options: opts || {} });
}
