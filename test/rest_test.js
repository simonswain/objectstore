"use strict";

var _ = require('underscore');
var async = require('async');

var config = require( '../config');

var os = require('../lib');
var api = os.Api(config);
var server = os.Server(config);

var client = require('nodeunit-httpclient').create({
  port: config.port,
  path: '/',
  status: 200
});

exports.rest = {

  setUp: function(done) {
    // setup here
    done();
  },

  'reset': function(test) {
    // just reset once, at the start of the sequence
    api.reset( function() {
      test.done();
    });
  },

  'server-start': function(test) {
    server.start(function(){
      test.done();
    });
  },

  'stats': function(test) {
    test.expect(4);
    client.get(
      test, 
      'stats', {
        status: 200
      }, function(res) {
        test.equals(typeof res.data, 'object');
        test.ok(res.data.hasOwnProperty('objects'));
        test.ok(res.data.hasOwnProperty('relations'));
        test.done();
      });
  },

  'server-stop': function(test) {
    server.stop(function(){
      test.done();
    });
  }

};
