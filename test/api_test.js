"use strict";

var async = require('async');

var api = require('../api');
var reset = require('../db/reset.js');

var myDevice = {};

var fooUuid = '00000000-0000-0000-0000-000000000000';

var myObj = {
};

exports.objects = {
  'reset': function(test) {
    reset(function() {
      test.done();
    });
  },
  'find-none': function(test) {
    test.expect(2);
    api.find(
      {},
      function(err, objs) {
        test.equal(err, null);
        test.equal(objs.length, 0);
        test.done();
      });
  },
  'get-not-found': function(test) {
    test.expect(2);
    api.get(
      fooUuid, 
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
    },
  'add': function(test){
    test.expect(3);

    myObj = {
      type: 'Thing',
      slug: 'thing',
      attrs: {
        foo: 'bar'
      }
    };

    api.add(
      myObj,
      function(err, res){ 
        myObj.id = res.id;
        test.equal(err, null);
        test.equal(res.type, myObj.type);
        test.deepEqual(res.attrs, myObj.attrs);
        test.done();
      });
  },
  'get': function(test) {
    test.expect(3);
    api.get(
      myObj.id, 
      function(err, res) {
        test.equal(err, null);
        test.equal(res.id, myObj.id);
        test.deepEqual(res.attrs, myObj.attrs);
        test.done();
      });
  },
  'set': function(test) {
    test.expect(2);

    var attrs = {
      setting: 321
    };

    api.set(
      myObj.id, 
      attrs,
      function(err) {
        api.get(
          myObj.id, 
          function(err, res) {
            test.equal(err, null);
            test.deepEqual(res.attrs, attrs);
            test.done();
          });
      });
  },
  'delete': function(test) {
    test.expect(2);
    api.del(
      myObj.id, 
      function(err) {
        api.get(
          myObj.id, 
          function(err, res) {
            test.equal(err, null);
            test.equal(res, false);
            test.done();
          });
      });
  }

};
