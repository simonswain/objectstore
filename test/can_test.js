"use strict";

var async = require('async');
var _ = require('underscore');

var os = require('../lib');
var config = require( '../config');
var api = os.api(config);

var myUser, myAdmin, myGroup, myDoc, myIndex;

var myDocs;

exports.access = {

  'reset': function(test) {
    api.reset(function() {
      test.done();
    });
  },

  'add-user': function(test){
    myUser = {
      type: 'user',
      slug: 'username'
    };
    api.add(
      myUser,
      function(err, res){
        myUser.id = res.id;
        test.done();
      });
  },

  'get-user-by-slug': function(test){
    api.get({
      type: 'user',
      slug: myUser.slug
    }, function(err, res){
      test.done();
    });
  },

  'add-admin': function(test){
    myAdmin = {
      type: 'user',
      username: 'admin'
    };
    api.add(
      myAdmin,
      function(err, res){
        myAdmin.id = res.id;
        test.done();
      });
  },

  'add-group': function(test){
    myGroup = {
      type: 'group'
    };
    api.add(
      myGroup,
      function(err, res){
        myGroup.id = res.id;
        test.done();
      });
  },

  'join-group': function(test){
    api.rel(
      myGroup.id,
      myUser.id,
      {role: 'view'},
      function(err, res){
        test.done();
      });
  },

  'find-user-with-role': function(test){
    test.expect(2);
    api.find({
      id: myGroup.id,
      type: 'user',
      role: 'view'
    }, function(err, res){
      test.equal(res.length, 1);
      test.equal(res[0].id, myUser.id);
      test.done();
    });
  },

  'add-index': function(test){
    myIndex = {
      type: 'index'
    };
    api.add(
      myIndex,
      function(err, res){
        myIndex.id = res.id;
        test.done();
      });
  },

  'add-docs': function(test){

    var add = function(x, next){
      x.type = 'doc';
      api.add(
        x,
        //either way is OK
        //[myIndex.id],
        {id: myIndex.id},
        next
      );
    };

    var docs = [
      {slug:'help'},
      {slug:'about'},
      {slug:'services'}
    ];

    async.eachSeries(docs, add, test.done);
  },

  'find-docs': function(test){
    test.expect(1);
    api.find({
      id: myIndex.id,
      type: 'doc'
    }, function(err, res){
      myDocs = res;
      test.equal(res.length, 3);
      test.done();
    });
  },

  // add two of the docs to the group, providing access control
  'add-group-docs': function(test){
    var docs = _.take(myDocs, 1);

    var add = function(x, next){
      x.type = 'doc';
      api.rel(
        myGroup.id,
        x.id,
        next
      );
    };
    async.eachSeries(docs, add, test.done);
  },

  // can user view docs based on group role (should be yes)
  'can-user-view': function(test){
    test.expect(1);

    var doc = myDocs[0];

    api.can(
      myUser.id,
      doc.id,
      myGroup.id,
      'view',
      function(err, res){
        test.ok(res);
        test.done();
      }
    );
  },
  // can user edit docs based on group role (should be no)
  'can-user-edit': function(test){
    test.expect(1);

    var doc = myDocs[0];

    api.can(
      myUser.id,
      doc.id,
      myGroup.id,
      'edit',
      function(err, res){
        test.equal(res, false);
        test.done();
      }
    );
  }


};
