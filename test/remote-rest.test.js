/*global describe, before, it */
'use strict';
var extend = require('util')._extend;
var RemoteObjects = require('strong-remoting');
var express = require('express');
var request = require('supertest');
// var expect = require('chai').expect;

describe('remote-method-http-setting-test', function() {
  var app;
  var server;
  var objects;
  var remotes;
  var adapterName = 'rest';
  var lastRequest, lastResponse;

  before(function(done) {
    app = express();
    app.disable('x-powered-by');
    app.use(function(req, res) {
      // create the handler for each request
      objects.handler(adapterName).apply(objects, arguments);
      lastRequest = req;
      lastResponse = res;
    });
    server = app.listen(done);

    if (process.env.NODE_ENV === 'production') {
      process.env.NODE_ENV = 'test';
    }
    objects = RemoteObjects.create({json: {limit: '1kb'},
      errorHandler: {disableStackTrace: false}});
    remotes = objects.exports;

    // connect to the app
    objects.connect('http://localhost:' + server.address().port, adapterName);
  });

  it('shoud return 404 when verb is not properly used', function(done) {
    var method = givenSharedStaticMethod(
      function bar(cb) {
        cb(null, 3);
      },
      {
        accepts: [],
        returns: { arg: 'n', type: 'number' },
        http: { verb: 'put', path: '/' }
      }
    );
    // Should return 404 when http verb is set as `put` but called as `get`
    request(app).get(method.classUrl)
    .expect(404, done);
  });

  it('should return 404 when http is not properly set', function(done) {
    var method = givenSharedStaticMethod(
      function bar(cb) {
        cb(null, 3);
      },
      {
        accepts: [],
        returns: { arg: 'n', type: 'number' },
        http: { verb: 'put', wrongPathName: '/' }
      }
    );
    // Should return 404 when path is not set properly
    request(app).put(method.classUrl)
    .expect(404, done);
  });

  it('should return 200 when verb and http are set properly', function(done) {
    var method = givenSharedStaticMethod(
      function bar(a, b, cb) {
        cb(null, a + b);
      },
      {
        accepts: [
          { arg: 'b', type: 'number', http: {source: 'header' } },
          { arg: 'a', type: 'number', http: {source: 'header' } }
        ],
        returns: { arg: 'n', type: 'number' },
        http: { verb: 'put', path: '/' }
      }
    );
    // Should return 200 when verb and path are both set properly
    request(app).put(method.classUrl)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('a', 1)
      .set('b', 2)
      .send()
      .expect('Content-Type', /json/)
      .expect({ n: 3 }, done);
  });

  function givenSharedStaticMethod(fn, config) {
    if (typeof fn === 'object' && config === undefined) {
      config = fn;
      fn = null;
    }
    fn = fn || function(cb) { cb(); };

    remotes.testClass = { testMethod: fn };
    config = extend({ shared: true }, config);
    extend(remotes.testClass.testMethod, config);
    return {
      name: 'testClass.testMethod',
      url: '/testClass/testMethod',
      classUrl: '/testClass'
    };
  }
});