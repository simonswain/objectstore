"use strict";

var async = require('async');

var config = require( '../config')(process.env.NODE_ENV);

var os = require('../lib');
var api = os.api(config);

var NATO = [ 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'];

var createLimit = 26;

exports.objects = {
  'reset': function(test) {
    api.reset(function() {
      test.done();
    });
  },

  'add-many': function(test) {
    var add = function(x, next){

      var obj = {
        type: 'nato',
        slug: NATO[x%26],
        attrs: {
          title: NATO[x%26] + ' ' + x
        }
      };

      api.add(
        obj,
        function(err, res){
          next();
        });
    };

    async.timesSeries(createLimit, add, function(){
      test.done();
    });

  },

  //find objs by type
  'find-all': function(test){
    test.expect(1);
    api.find({
      type: 'nato'
    }, function(err, res){
      test.equal(res.length, 26);
      test.done();
    });
  },

  'count-by-type': function(test){
    test.expect(1);
    api.count({
      type: 'nato'
    }, function(err, res){
      test.equal(res, 26);
      test.done();
    });
  },

  'find-sort': function(test){
    test.expect(3);
    api.find({
      type: 'nato',
      order: 'title'
    }, function(err, res){
      test.equal(res[0].attrs.title.substr(0,1), 'a');
      test.equal(res[1].attrs.title.substr(0,1), 'b');
      test.equal(res[25].attrs.title.substr(0,1), 'z');
      test.done();
    });
  },

  'find-sort-desc': function(test){
    test.expect(3);
    api.find({
      type: 'nato',
      sort: '-title'
    }, function(err, res){
      test.equal(res[0].attrs.title.substr(0,1), 'z');
      test.equal(res[1].attrs.title.substr(0,1), 'y');
      test.equal(res[25].attrs.title.substr(0,1), 'a');
      test.done();
    });
  },

  'limit': function(test){
    test.expect(1);
    api.find({
      type: 'nato',
      sort: 'title'
    }, {
      limit: 3
    }, function(err, res){
      test.equal(res.length, 3);
      test.done();
    });
  },

  'base-limit': function(test){
    test.expect(2);
    api.find({
      type: 'nato',
      sort: 'title'
    }, {
      base: 3,
      limit: 3
    }, function(err, res){
      test.equal(res.length, 3);
      test.equal(res[0].attrs.title.substr(0,1), 'd');
      test.done();
    });
  },

  // where title is partial match

  'where': function(test){
    test.expect(2);
    api.find({
      type: 'nato',
      where: {
        title: 'alp'
      },
      sort: 'title'
    }, {
    }, function(err, res){
      test.equal(res.length, 1);
      test.equal(res[0].attrs.title, 'alpha 0');
      test.done();
    });
  },

  'quit': function(test){
    api.quit(
      function(err, res){
        test.done();
      });
  }

};
