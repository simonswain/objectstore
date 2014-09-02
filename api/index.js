"use strict";

var _ = require('underscore');
var async = require('async');

var db = require('../lib/db.js');
var validate = require('../lib/validate.js');

module.exports = {};

var cleanOpts = function(opts){

  if (opts.hasOwnProperty('base')){
    opts.base = Number(opts.base);
  }

  if (!opts.hasOwnProperty('base') || ! opts.base || ! _.isNumber(opts.base)){
    opts.base = 0;
  }

  if (opts.hasOwnProperty('limit')){
    opts.limit = Number(opts.limit);
  }

  if (!opts.hasOwnProperty('limit') || !opts.limit || ! _.isNumber(opts.limit)) {
    opts.limit = 100;
  }

  if (!opts.hasOwnProperty('sort') || typeof opts.sort !== 'undefined') {
    opts.sort = false;
  }

  if(!opts.sort){
    opts.sort = 'id';
  }

  opts.order = false;

  if (opts.sort && opts.sort.substr(0,1) === '-') {
    opts.order = 'DESC';
  }

  if (!opts.hasOwnProperty('text') || ! opts.text){
    opts.text = false;
  }

  if (!opts.hasOwnProperty('rel')){
    opts.rel = false;
  }

  if (!opts.hasOwnProperty('rel_id')){
    opts.rel_id = false;
  }

  return opts;

};


module.exports.find = function(opts, next) {

  opts = cleanOpts(opts);

  var sql;
  sql = "SELECT *";
  sql += " FROM obj ";

  // where ...

  // limit only makes sense if using order by
  // sql += " LIMIT " + opts.limit;
  // sql += " OFFSET " + opts.base;

  db.query(
    sql,
    function(err, rows){
      next(err, rows);
    });

};

module.exports.count = function(opts, next) {

  opts = cleanOpts(opts);

  var sql;
  sql = "SELECT COUNT(*) AS count";
  sql += " FROM obj ";
  
  // where ...

  db.queryOne(
    sql,
    function(err, row){
      next(err, row.count);
    });

};

module.exports.get = function(q, next) {

  var id = false;
  var opts = false;

  if(validate.uuid(q)){
    id = q;
  }

  if(_.isObject(q)){
    opts = id;
  }

  if(!id && !opts){
    return next();
  }

  var sql;
  var arg;

  // where id of parent and rel = this objs type [role]

  // if(opts){
  //   sql += " WHERE id = $1";
  //   arg = opts.id;
  // }

  if(id){
    sql = "SELECT * ";
    sql += " FROM obj ";
    sql += " WHERE id = $1";

    db.queryOne(
      sql,
      [id],      
      next
    );
  }

};


module.exports.add = function(obj, next) {

  var add = function(done){
    var sql;
    sql = "INSERT INTO obj";
    sql += " (type, slug) ";
    sql += " VALUES ";
    sql += " ($1, $2) ";
    sql += " RETURNING id;";
    
    db.queryOne(
      sql,
      [obj.type, obj.slug],
      function(err, row){
        obj.id = row.id;
        done();
      });
  };

  var set = function(done){
    module.exports.set(obj.id, obj.attrs, done);
  };

  async.series(
    [add, set],
    function(){
      next(null, obj);
    });

};

module.exports.set = function(id, attrs, next) {

  if (!validate.uuid(id)) {
    return next(new Error('INVALID id'));
  }

  if (typeof attrs !== 'object') {
    return next(new Error('Invalid attrs'));
  }
  
  var sql;
  sql = "UPDATE obj SET ";
  sql += " attrs = $2 ";
  sql += " WHERE id = $1";

  db.query(
    sql,
    [id, attrs],
    function(err){
      module.exports.get(id, next);
    });

};

module.exports.del = function(id, next) {

  if (!validate.uuid(id)) {
    return next(new Error('Invalid id'));
  }

  var sql;
  sql = "DELETE ";
  sql += " FROM obj ";
  sql += " WHERE id = $1";

  db.query(
    sql,
    [id],
    function(err){
      next(err);
    });

};
