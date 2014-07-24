#!/usr/bin/env node

/**
 * This script creates weighted random load on the sample server.
 */

var request = require('request');
var shuffle = require('shuffle').shuffle;
var table = require('text-table');
var weighted = require('weighted');

// If false, non-GET requests are enabled. Not recommended for shared (e.g. C9)
// servers.
var safeMode = true;

/**
 * Returns `body` parsed as JSON if it's not already been parsed, `body
 * otherwise.
 */
function toJSON(body) {
  if (typeof body !== 'string') {
    return body;
  }

  return JSON.parse(body);
}

/**
 * Returns a random Array with half the elements from `arr`.
 */
function randomHalf(arr) {
  var size = Math.ceil(arr.length / 2);

  return shuffle({ deck: arr }).draw(size);
}

/**
 * Returns a tabular string of `choices`' contents, with all weights converted
 * to relative percentages.
 */
function toWeightTable(choices) {
  return table([
    ['Route', 'Weight'],
    ['-----', '-----']
  ].concat(Object.keys(choices).map(function (key) {
    return [key, Math.round(choices[key] * 10000) / 100 + '%'];
  })));
}

function getBaseURL() {
  var ip = process.env.IP || process.env.HOST || '127.0.0.1';
  var port = process.env.PORT || 3000;
  var baseURL = 'http://' + ip + ':' + port + '/api';
  return baseURL;
}
/**
 * This kicks off the application
 * @type {[type]}
 */
function start() {
  request.get(getBaseURL() + '/routes', function (err, response, body) {
    if(err)
      throw err;
    body = toJSON(body);

    var routes = distillRoutes(body);
    routes = randomHalf(routes);

    var choices = weighChoices(routes);

    // We print out the choice table so the user can compare the weighted load
    // to analytics and monitoring data.
    console.log('Hitting routes with the following weights:');
    console.log(toWeightTable(choices));

    // Go!
    hit(choices);
  });
}

/**
 * Returns an Array of choices distilled from the complete route table,
 * `routes`.
 */
function distillRoutes(routes) {
  return routes.filter(function (route) {
    if (safeMode && route.verb.toUpperCase() !== 'GET') {
      return false;
    }

    return true;
  }).map(function (route) {
    // TODO(schoon) - Handle the `accepts` in a meaningful way.
    return route.verb.toUpperCase() + ' ' + route.path;
  });
}

/**
 * Returns a weighted choice table from an Array of choices.
 */
function weighChoices(routes) {
  var total = 0;
  var choices = routes.reduce(function (obj, route) {
    obj[route] = Math.random();
    total += obj[route];

    return obj;
  }, {});

  // For simplicity, we normalize the weights to add up to 1.
  Object.keys(choices).forEach(function (key) {
    choices[key] /= total;
  });

  return choices;
}

/**
 * Hits a randomly-selected route from the available `choices`.
 */
function hit(choices) {
  var route = weighted(choices);
  var parts = route.split(' ');
  var verb = parts[0].toLowerCase();
  var path = parts[1];

  // We replace any :id path fragments with 1, which we hope exists.
  path = path.replace(/\:id/g, 1);

  if (verb === 'all') {
    verb = 'post';
  }

  // Make the request.
  request[verb](getBaseURL() + path, {
    json: {}
  }, function (err/*, response, body*/) {
    if (err) {
      console.error('Request error with %s: %s', route, err);
      return;
    }

    // Ignore the result.
  });

  // TODO(schoon) - Make the request rate configurable.
  setTimeout(function () {
    hit(choices);
  }, 100);
}

// Now that all the pieces have been defined, it's time to `start` the engine!
start();
