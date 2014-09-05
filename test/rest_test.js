"use strict";

var _ = require('underscore');
var async = require('async');

var config = require( '../config');

var os = require('../lib');
var api = os.api(config);
var server = os.server(config);

var client = require('nodeunit-httpclient').create({
  port: config.port,
  path: '/',
  status: 200
});

var myObj;

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
      'stats', function(res) {
        test.equals(typeof res.data, 'object');
        test.ok(res.data.hasOwnProperty('objects'));
        test.ok(res.data.hasOwnProperty('relations'));
        test.done();
      });
  },

  'get-none': function(test) {
    test.expect(6);
    client.get(
      test, 
      'objects', function(res) {
        test.equals(typeof res.data, 'object');
        test.ok(res.data.hasOwnProperty('objects'));
        test.ok(res.data.hasOwnProperty('count'));
        test.equals(res.data.count, 0);
        test.equals(res.data.objects.length, 0);
        test.done();
      });
  },

  'add': function(test) {
    test.expect(4);

    myObj = {
      type: 'doc',
      slug: 'doc-1',
      attrs: {
        foo: 'bar'
      }
    };

    client.post(
      test, 
      'objects', {
        data: myObj
      }, function(res) {
        myObj.id = res.data.id;
        test.equals(typeof res.data, 'object');
        test.equal(res.data.type, myObj.type);
        test.equal(res.data.slug, myObj.slug);
        test.done();
      });
  },

  'get-one': function(test) {
    test.expect(3);
    client.get(
      test,
      'objects/' + myObj.id, 
      function(res) {
        test.equals(typeof res.data, 'object');
        test.deepEqual(res.data, myObj);
        test.done();
      });
  },

  'set': function(test) {
    test.expect(2);

    myObj.attrs.foo = 'baz';

    client.put(
      test, 
      'objects/' + myObj.id, {
        data: myObj.attrs
      }, function(res) {
        test.deepEqual(res.data.attrs, myObj.attrs);
        test.done();
      });
  },

  'get-set': function(test) {
    test.expect(2);
    client.get(
      test,
      'objects/' + myObj.id, {
        status: 200
      }, function(res) {
        test.deepEqual(res.data.attrs, myObj.attrs);
        test.done();
      });
  },

  'stats-one': function(test) {
    test.expect(2);
    client.get(
      test, 
      'stats', 
      function(res) {
        test.equals(res.data.objects, 1);
        test.done();
      });
  },

  'del': function(test) {
    test.expect(1);

    client.del(
      test, 
      'objects/' + myObj.id,
      function(res) {
        test.done();
      });
  },

  'del-done-stats': function(test) {
    test.expect(2);
    client.get(
      test, 
      'stats', {
      }, function(res) {
        test.equals(res.data.objects, 0);
        test.done();
      });
  },

  'del-done-get?': function(test) {
    test.expect(1);
    client.get(
      test,
      'objects/' + myObj.id, {
      }, {
        status: 404
      }, function(res) {
        test.done();
      });
  },


  'server-stop': function(test) {
    server.stop(function(){
      test.done();
    });
  }

};
