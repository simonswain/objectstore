"use strict";

var async = require('async');

var config = require( '../config')(process.env.NODE_ENV);

var os = require('../lib');
var api = os.api(config);

var fooUuid = '00000000-0000-0000-0000-000000000000';

var myObj, myChild, myOtherChild;

exports.objects = {
  'reset': function(test) {
    api.reset(function() {
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
    test.expect(4);

    myObj = {
      type: 'thing',
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
        test.equal(res.slug, myObj.slug);
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

  'get-type': function(test) {
    test.expect(3);
    api.get(
      myObj.id,
      myObj.type,
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

  'set-slug': function(test) {
    test.expect(2);
    api.set(
      myObj.id,
      'slug',
      'new-slug',
      function(err) {
        api.get(
          myObj.id,
          function(err, res) {
            test.equal(err, null);
            test.equal(res.slug, 'new-slug');
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
  },

  'add-parent': function(test){
    myObj = {
      type: 'parent',
      slug: 'parent'
    };

    api.add(
      myObj,
      function(err, res){
        myObj.id = res.id;
        test.done();
      });
  },

  // add two objs
  'add-child': function(test){
    myChild = {
      type: 'child',
      slug: 'child'
    };
    api.add(
      myChild,
      function(err, res){
        myChild.id = res.id;
        test.done();
      });
  },

  'add-other-child': function(test){
    myOtherChild = {
      type: 'child',
      slug: 'other'
    };
    api.add(
      myOtherChild,
      function(err, res){
        myOtherChild.id = res.id;
        test.done();
      });
  },

  //find objs by type
  'find-type': function(test){
    test.expect(1);
    api.find({
      type: 'child'
    }, function(err, res){
      test.equal(res.length, 2);
      test.done();
    });
  },

  'count-type': function(test){
    test.expect(1);
    api.count({
      type: 'child'
    }, function(err, res){
      test.equal(res, 2);
      test.done();
    });
  },

  // relate child to parent and find
  'rel': function(test){
    api.rel(
      myObj.id, myChild.id,
      function(err, res){
        test.done();
      });
  },

  'find-rel': function(test){
    test.expect(2);
    api.find({
      id: myObj.id,
      type: 'child'
    }, function(err, res){
      test.equal(res.length, 1);
      test.equal(res[0].id, myChild.id);
      test.done();
    });
  },

  'count-rel': function(test){
    test.expect(1);
    api.count({
      id: myObj.id,
      type: 'child'
    }, function(err, res){
      test.equal(res, 1);
      test.done();
    });
  },

  // find named slug in parent-child rel
  'get-rel': function(test){
    test.expect(2);
    api.get({
      id: myObj.id,
      slug: 'child'
    }, function(err, res){
      test.equal(res.id, myChild.id);
      test.equal(res.slug, 'child');
      test.done();
    });
  },

  // find named slug not in parent-child rel (should get nothing)
  'get-rel-none': function(test){
    test.expect(1);
    api.get({
      id: myObj.id,
      slug: 'other'
    }, function(err, res){
      test.equal(res, false);
      test.done();
    });
  },

  // find named slug of type in parent-child rel
  'get-rel-type': function(test){
    test.expect(2);
    api.get({
      id: myObj.id,
      slug: 'child',
      type: 'child'
    }, function(err, res){
      test.equal(res.id, myChild.id);
      test.equal(res.slug, 'child');
      test.done();
    });
  },

  // should find nothing
  'get-rel-type-none': function(test){
    test.expect(1);
    api.get({
      id: myObj.id,
      slug: 'other',
      type: 'cousin'
    }, function(err, res){
      test.equal(res, false);
      test.done();
    });
  },

  // relate other to parent with role and find
  'other-rel': function(test){
    api.rel(
      myObj.id, myOtherChild.id, {
        role: 'family'
      }, function(err, res){
        test.done();
      });
  },

  'find-role': function(test){
    test.expect(2);
    api.find({
      id: myObj.id,
      type: 'child',
      role: ['family','friends']
    }, function(err, res){
      test.equal(res.length, 1);
      test.equal(res[0].id, myOtherChild.id);
      test.done();
    });
  },

  //find objs by type
  'children': function(test){
    test.expect(1);
    api.children(
      myObj.id,
      'child',
      function(err, res){
        test.equal(res.length, 2);
        test.done();
      });
  },

  //find objs by type
  'parent': function(test){
    test.expect(1);
    api.parent(
      myChild.id,
      'parent',
      function(err, res){
        test.equal(res.id, myObj.id);
        test.done();
      });
  },

  //find objs by type
  'quit': function(test){
    api.quit(
      function(err, res){
        test.done();
      });
  }


};
