"use strict";

var async = require('async');

var config = require( '../config')(process.env.NODE_ENV);

var os = require('../lib');
var api = os.api(config);

var NATO = [ 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'];

var createLimit = 26;
var ids;

exports.get = {
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
          //.push(res.id);
          next();
        });
    };

    async.timesSeries(createLimit, add, function(){
      test.done();
    });

  },

  'get-where': function(test){
    test.expect(1);
    api.get({
      where: {
        title: 'alpha 0'
      },
    }, {
    }, function(err, res){
      test.equal(res.attrs.title, 'alpha 0');
      test.done();
    });
  },

  'get-where-type': function(test){
    test.expect(1);
    api.get({
      type: 'nato',
      where: {
        title: 'alpha 0'
      },
    }, {
    }, function(err, res){
      test.equal(res.attrs.title, 'alpha 0');
      test.done();
    });
  },

  'get-where-not-found': function(test){
    test.expect(1);
    api.get({
      type: 'nato',
      where: {
        title: 'alpha 999'
      },
    }, {
    }, function(err, res){
      test.equal(res, false);
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
