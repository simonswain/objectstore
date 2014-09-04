"use strict";

var _ = require('underscore');
var async = require('async');

var db = require('../lib/db.js');
var validate = require('../lib/validate.js');

module.exports = {};

/**
* initialise the database
*/
module.exports.reset = function(next){

  var fs = require('fs');

  var schema = fs.readFileSync (
    __dirname + '/../db/schema.sql',
    'ascii'
  );

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


/**
* delete all data from the database
*/
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


/**
* shared routine to clean up opts used by #find and #count
*/
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

  if (!opts.hasOwnProperty('role_id')){
    opts.role_id = false;
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


/**
* find a set of objects
*/
module.exports.find = function(opts, next) {

  opts = cleanOpts(opts);

  if(!opts){
    return next(null, []);
  }

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;
  var cx;

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

  // options

  // if type set, objects of this type will be found
  if(opts.type){
    conds.push(" o.type = $" + ix);
    args.push(opts.type);
    ix ++;
  }

  // if id set, objs will be found that are related to obj id
  if(opts.id){
    conds.push(" r.id = $" + ix);
    args.push(opts.id);
    ix ++;
  }

  // if role_id set, role_id obj must have relationship with id, and
  // specified role. role will not be used when filtering the
  // individual rel_id objects

  if(opts.role_id){
    var role_sql = "";
    role_sql += "(SELECT COUNT(*) FROM rel";
    role_sql += " WHERE id=$" + ix;
    args.push(opts.id);
    ix ++;

    role_sql += " AND rel_id=$" + ix;
    args.push(opts.role_id);
    ix ++;

    role_sql += " AND rel_id=$" + ix;
    args.push(opts.role_id);
    ix ++;

    // if role or [role, role, ...]
    if(opts.role){
      cx = [];
      _.each(opts.role, function(x){
        cx.push(ix);
        ix ++;
        args.push(x);
      });
      role_sql += " AND role IN($" + cx.join(', $') + ")";
    }

    role_sql += ") = 1";
    conds.push(role_sql);
  }

  // if role or [role, role] then rel must have these roles. don't use
  // if role_is is being used to check role
  if(!opts.role_id && opts.id && opts.role){
    cx = [];
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


/**
* count how many objects exists according to criteria
*/
module.exports.count = function(opts, next) {

  opts = cleanOpts(opts);

  if(!opts){
    return next(null, []);
  }

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;
  var cx;

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

  // options

  // if type set, objects of this type will be found
  if(opts.type){
    conds.push(" o.type = $" + ix);
    args.push(opts.type);
    ix ++;
  }

  // if id set, objs will be found that are related to obj id
  if(opts.id){
    conds.push(" r.id = $" + ix);
    args.push(opts.id);
    ix ++;
  }

  // if role_id set, role_id obj must have relationship with id, and
  // specified role. role will not be used when filtering the
  // individual rel_id objects

  if(opts.role_id){
    var role_sql = "";
    role_sql += "(SELECT COUNT(*) FROM rel";
    role_sql += " WHERE id=$" + ix;
    args.push(opts.id);
    ix ++;

    role_sql += " AND rel_id=$" + ix;
    args.push(opts.role_id);
    ix ++;

    role_sql += " AND rel_id=$" + ix;
    args.push(opts.role_id);
    ix ++;

    // if role or [role, role, ...]
    if(opts.role){
      cx = [];
      _.each(opts.role, function(x){
        cx.push(ix);
        ix ++;
        args.push(x);
      });
      role_sql += " AND role IN($" + cx.join(', $') + ")";
    }

    role_sql += ") = 1";
    conds.push(role_sql);
  }

  // if role or [role, role] then rel must have these roles. don't use
  // if role_is is being used to check role
  if(!opts.role_id && opts.id && opts.role){
    cx = [];
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

  db.queryOne(
    sql,
    args,
    function(err, rows){
      next(err, Number(rows.count));
    });

};


/**
* get a single object by id
*/
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

/**
* get a single object by it slug and type. If more than one exists
* with the same slug, one will be returned at random
*/
module.exports.getBy = function(opts, next){

  var sql;
  var args = [];
  var conds = [];
  var ix = 1;

  if(!opts.hasOwnProperty('id') || ! validate.uuid(opts.id)){
    opts.id = false;
  }

  if(!opts.hasOwnProperty('type')){
    opts.type = false;
  }

  if(!opts.hasOwnProperty('slug')){
    opts.slug = false;
  }

  if(opts.id){
    sql = "SELECT o.*";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.rel_id ";
  } else {
    sql = "SELECT *";
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


/**
* get an object by id or type + slug
*/
module.exports.get = function(q, next) {

  if(validate.uuid(q)){
    return module.exports.getById(q, next);
  }

  if(_.isObject(q)){
    return module.exports.getBy(q, next);
  }

  return next();

};


/**
* create an object. can optionally set rels at the same time
*/
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


/**
* update an objects's slug (treated as a private method)
*/
module.exports.setSlug = function(id, slug, next) {

  if(!validate.uuid(id)) {
    return next(new Error('invalid id'));
  }

  var sql;
  sql = "UPDATE obj SET ";
  sql += " slug = $2 ";
  sql += " WHERE id = $1";

  db.query(
    sql,
    [id, slug],
    function(err){
      module.exports.get(id, next);
    });

};

/**
* update the json blob on an existing object
*/
module.exports.set = function(id, attrs, next) {

  if (!validate.uuid(id)) {
    return next(new Error('invalid id'));
  }

  // overloaded for setting arbitrary field on obj table. currently
  // only slug can be set.
  if (arguments[1] === 'slug') {
    return module.exports.setSlug(id, arguments[2], arguments[3]);
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


/**
* delete an object by id
*/
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


/**
 * remove any existing relationship between two objects
 */
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


/**
 * create a relationship between two objects
 */
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
