"use strict";

var async = require('async');
var _ = require('underscore');

var os = require('../lib');
var config = require( '../config')(process.env.NODE_ENV);
var api = os.api(config);

var user1, group1, group2, doc1, doc2, doc3;

exports.access = {

  'reset': function(test) {
    api.reset(function() {
      test.done();
    });
  },

  'add-user': function(test){
    user1 = {
      type: 'user',
      slug: 'user1'
    };
    api.add(
      user1,
      function(err, res){
        user1.id = res.id;
        test.done();
      });
  },

  'add-group-1': function(test){
    group1 = {
      type: 'group',
      slug: 'group1'
    };
    api.add(
      group1,
      function(err, res){
        group1.id = res.id;
        test.done();
      });
  },

  'add-group-2': function(test){
    group2 = {
      type: 'group',
      slug: 'group2'
    };
    api.add(
      group2,
      function(err, res){
        group2.id = res.id;
        test.done();
      });
  },

  'join-group-1': function(test){
    api.rel(
      group1.id,
      user1.id,
      {role: 'view'},
      function(err, res){
        test.done();
      });
  },

  'join-group-2': function(test){
    api.rel(
      group2.id,
      user1.id,
      {role: 'edit'},
      function(err, res){
        test.done();
      });
  },


  'find-user-groups': function(test){
    test.expect(1);
    api.find({
      rel_id: user1.id,
      type: 'group'
    }, function(err, res){
      test.equal(res.length, 2);
      //test.equal(res[0].id, user1.id);
      test.done();
    });
  },

  'add-doc-1': function(test){
    doc1 = {
      type: 'doc',
      slug: 'doc1'
    };
    api.add(
      doc1,
      function(err, res){
        doc1.id = res.id;
        test.done();
      });
  },

  'add-doc-2': function(test){
    doc2 = {
      type: 'doc',
      slug: 'doc2'
    };
    api.add(
      doc2,
      function(err, res){
        doc2.id = res.id;
        test.done();
      });
  },

  'add-doc-3': function(test){
    doc3 = {
      type: 'doc',
      slug: 'doc3'
    };
    api.add(
      doc3,
      function(err, res){
        doc3.id = res.id;
        test.done();
      });
  },

  'join-doc-1-group-1': function(test){
    api.rel(
      group1.id,
      doc1.id,
      function(err, res){
        test.done();
      });
  },

  'join-doc-2-group-1': function(test){
    api.rel(
      group1.id,
      doc2.id,
      function(err, res){
        test.done();
      });
  },

  'join-doc-2-group-2': function(test){
    api.rel(
      group2.id,
      doc2.id,
      function(err, res){
        test.done();
      });
  },

  'join-doc-3-group-2': function(test){
    api.rel(
      group2.id,
      doc3.id,
      function(err, res){
        test.done();
      });
  },

  'find-joined': function(test){
    test.expect(1);
    api.join({
      id: user1.id,
      link: 'group',
      type: 'doc'
    }, {
      //debug: true
    }, function(err, res){
      test.equal(res.length, 3);
      test.done();
    });
  },

  'count-joined': function(test){
    test.expect(1);
    api.join({
      id: user1.id,
      link: 'group',
      type: 'doc'
    }, {
      //debug: true,
      count: true
    }, function(err, res){
      test.equal(res, 3);
      test.done();
    });
  },

  'can-user-view-doc1-yes': function(test){
    test.expect(1);

    api.can({
      id: user1.id,
      target_id: doc1.id,
      link: 'group',
      role: 'view'
    }, function(err, res){
      // true if can
      test.ok(res);
      test.done();
    });
  },

  'can-user-edit-doc1-no': function(test){
    test.expect(1);

    api.can({
      id: user1.id,
      target_id: doc1.id,
      link: 'group',
      role: 'edit'
    }, function(err, res){
      test.ok(!res);
      test.done();
    });
  },

  'can-user-view-doc2-yes': function(test){
    test.expect(1);

    api.can({
      id: user1.id,
      target_id: doc2.id,
      link: 'group',
      role: 'view'
    }, function(err, res){
      // true if can
      test.ok(res);
      test.done();
    });
  },

  'can-user-edit-doc2-yes': function(test){
    test.expect(1);

    api.can({
      id: user1.id,
      target_id: doc2.id,
      link: 'group',
      role: 'edit'
    }, function(err, res){
      // true if can
      test.ok(res);
      test.done();
    });
  },

  // passing in multiple roles (view should provide true)
  'can-user-view-edit-doc1-yes': function(test){
    test.expect(1);

    api.can({
      id: user1.id,
      target_id: doc2.id,
      link: 'group',
      role: ['view','edit']
    }, function(err, res){
      // true if can
      test.ok(res);
      test.done();
    });
  },

  // // passing in multiple roles
  // 'can-user-view-edit-doc2-yes': function(test){
  //   test.expect(1);

  //   api.can({
  //     id: user1.id,
  //     target_id: doc2.id,
  //     link: 'group',
  //     role: 'edit'
  //   }, function(err, res){
  //     // true if can
  //     test.ok(res);
  //     test.done();
  //   });
  // },


  'quit': function(test){
    api.quit(
      function(err, res){
        test.done();
      });
  }

};
