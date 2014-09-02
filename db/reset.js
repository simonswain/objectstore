var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var pg = function(next){

  var db = require('../lib/db.js');
  var schema = fs.readFileSync ( __dirname + '/../db/schema.sql', 'ascii');
  schema = schema.trim();
  schema = schema.split(';');

  schema = _.reduce(
    schema, 
    function(memo, sql){
      sql = sql.trim();
      if(sql !== ''){
        memo.push(sql);
      }
      return memo;
    }, []);

  async.eachSeries(
    schema,
    db.query,
    function(err){ 
      next();
    });

};

module.exports = function(done) {

  async.series(
    [pg],
    function(){
      done();
    });

};
