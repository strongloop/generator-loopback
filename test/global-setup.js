/*global describe, beforeEach, it */
'use strict';

var workspace = require('loopback-workspace');

beforeEach(function resetMemoryConnector() {
  var cache = workspace.dataSources.db.adapter.cache;
  for (var model in cache) {
    cache[model] = {};
  }
});
