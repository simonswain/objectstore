"use strict";

var _ = require('underscore');
var async = require('async');

var db = require('../lib/db.js');
var validate = require('../lib/validate.js');

module.exports = {};

module.exports.purge = function(next){

  var objs = function(done){
    var sql;
    sql = "DELETE FROM obj ";
    db.query(
      sql,
      function(err){
        done(err);
      });
  };

  var rels = function(done){
    var sql;
    sql = "DELETE FROM rel ";
    db.query(
      sql,
      function(err){
        done(err);
      });
  };

  async.series([objs, rels], next);

};

var cleanOpts = function(opts){

  if (!opts.hasOwnProperty('type')){
    opts.type = false;
  }

  if (!opts.hasOwnProperty('id')){
    opts.id = false;
  }

  if (!opts.hasOwnProperty('rel_id')){
    opts.rel_id = false;
  }

  if (!opts.hasOwnProperty('role')){
    opts.role = false;
  }

  if (opts.role && !_.isArray(opts.role)){
    opts.role = [opts.role];
  }

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
    opts.sort = 'position';
  }

  opts.order = 1;

  if (opts.sort && opts.sort.substr(0,1) === '-') {
    opts.order = -1;
  }

  // validate. return false if not valid

  if(!opts.type){
  }

  return opts;

};

module.exports.find = function(opts, next) {

  opts = cleanOpts(opts);

  if(!opts){
    return next(null, []);
  }

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;

  // related objs query
  if(opts.id){
    sql = "SELECT o.*, r.role, r.position";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.rel_id ";
  } else {
    sql = "SELECT *";
    sql += " FROM obj o ";
  }

  // add options

  if(opts.id){
    conds.push(" r.id = $" + ix);
    args.push(opts.id);
    ix ++;
  }

  if(opts.type){
    conds.push(" o.type = $" + ix);
    args.push(opts.type);
    ix ++;
  }

  if(opts.id && opts.role){
    var cx = [];
    _.each(opts.role, function(x){
      cx.push(ix);
      ix ++;
      args.push(x);
    });
    conds.push(" r.role IN($" + cx.join(', $') + ")");
  }

  // create query

  if(conds.length>0){
    sql += " WHERE";
    sql += conds.join(" AND ");
  }

  // sql += " ORDER BY o." + opts.sort;
  // if(opts.order === -1){
  //   sql += " DESC";
  // }

  sql += " LIMIT " + opts.limit;
  if(opts.base > 0){
    sql += " OFFSET " + opts.base;
  }

  db.query(
    sql,
    args,
    function(err, rows){
      next(err, rows);
    });

};

module.exports.count = function(opts, next) {

  opts = cleanOpts(opts);

  if(!opts){
    return next(null, []);
  }

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;

  // related objs query
  if(opts.id){
    sql = "SELECT COUNT(*) AS count";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.rel_id ";
  } else {
    sql = "SELECT COUNT(*) AS count";
    sql += " FROM obj o ";
  }

  if(opts.id){
    conds.push(" r.id = $" + ix);
    args.push(opts.id);
    ix ++;
  }

  if(opts.type){
    conds.push(" o.type = $" + ix);
    args.push(opts.type);
    ix ++;
  }

  if(conds.length>0){
    sql += " WHERE";
    sql += conds.join(" AND ");
  }

  db.queryOne(
    sql,
    args,
    function(err, rows){
      next(err, Number(rows.count));
    });

};


module.exports.getById = function(id, next){

  if(!validate.uuid(id)){
    return next(new Error('invalid id'));
  }

  var sql;

  sql = "SELECT * ";
  sql += " FROM obj ";
  sql += " WHERE id = $1";

  db.queryOne(
    sql,
    [id],
    next
  );

};

module.exports.getBy = function(opts, next){

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;

  if(!opts.hasOwnProperty('type')){
    opts.type = false;
  }

  if(!opts.hasOwnProperty('slug')){
    opts.slug = false;
  }


  sql = "SELECT * ";
  sql += " FROM obj o";

  if(opts.type){
    conds.push(" o.type = $" + ix);
    args.push(opts.type);
    ix ++;
  }

  if(opts.slug){
    conds.push(" o.slug = $" + ix);
    args.push(opts.slug);
    ix ++;
  }

  // must have some conditions
  if(conds.length === 0){
    return next(null, false);
  }

  sql += " WHERE";
  sql += conds.join(" AND ");

  db.queryOne(
    sql,
    args,
    next
  );
};

module.exports.get = function(q, next) {

  if(validate.uuid(q)){
    return module.exports.getById(q, next);
  }

  if(_.isObject(q)){
    return module.exports.getBy(q, next);
  }

  return next();

};

module.exports.add = function(obj, rels, next) {

  if(typeof rels === 'function'){
    next = rels;
    rels = false;
  }

  if(rels && !_.isArray(rels)){
    rels = [rels];
  }

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
    module.exports.set(obj.id, obj.attrs, function(){
      done();
    });
  };

  var addRels = function(done){

    if(!rels){
      return done();
    }

    // for convenience, if rels were provided as an array of ids,
    // convert them to an array of objects.
    if(_.isArray(rels)){
      rels = _.map(rels, function(x){
        if(_.isObject(x)){
          return x;
        } else {
          return {id: x};
        }
      });
    }

    var addRel = function(x, cb){
      if(!x.opts){
        x.opts = {};
      }
      module.exports.rel(
        x.id,
        obj.id,
        x.opts,
        function(err){
          cb();
        });
    };

    async.eachSeries(rels, addRel, done);

  };

  async.series(
    [add, set, addRels],
    function(){
      next(null, obj);
    });

};

module.exports.set = function(id, attrs, next) {

  if (!validate.uuid(id)) {
    return next(new Error('INVALID id'));
  }

  if (typeof attrs !== 'object') {
    return next(new Error('invalid attrs'));
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
    return next(new Error('invalid id'));
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



module.exports.unrel = function(id, rel_id, next) {

  if (!validate.uuid(id)) {
    return next(new Error('invalid id'));
  }

  if (!validate.uuid(rel_id)) {
    return next(new Error('invalid id'));
  }

  var sql;
  sql = "DELETE ";
  sql += " FROM rel ";
  sql += " WHERE id = $1";
  sql += " AND rel_id = $2";

  db.query(
    sql,
    [id, rel_id],
    function(err){
      next(err);
    });

};

module.exports.rel = function(id, rel_id, opts, next) {

  // opts is and optional param. all fields in opts are optional and
  // will be set to null if not provided

  //{role: <role>, expires: <datetime>, position: x}

  if(typeof opts === 'function'){
    next = opts;
    opts = {};
  }

  if (!validate.uuid(id)) {
    return next(new Error('invalid id'));
  }

  if (!validate.uuid(rel_id)) {
    return next(new Error('invalid rel_id'));
  }

  if(!opts.hasOwnProperty('role')){
    opts.role = null;
  }

  if(!opts.hasOwnProperty('expires')){
    opts.expires = null;
  }

  if(!opts.hasOwnProperty('position')){
    opts.position = null;
  }

  var unrel = function(done){
    module.exports.unrel(id, rel_id, done);
  };

  var rel = function(done){

    var sql;
    sql = "INSERT INTO rel ";
    sql += " (id, rel_id, role, expires, position)";
    sql += " VALUES ";
    sql += " ($1, $2, $3, $4, $5)";

    db.query(
      sql,
      [id, rel_id, opts.role, opts.expires, opts.position],
      function(err){
        done(err);
      });
  };

  async.series([unrel, rel], next);

};