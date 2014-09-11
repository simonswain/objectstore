"use strict";

var _ = require('underscore');
var async = require('async');
var validate = require('./validate.js');

module.exports = function(config){

  var db = require('./db.js')(config);

  var api = {};

  /**
   * initialise the database
   */
  api.reset = function(next){

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

  api.quit = function(done){
    db.close();
    if(done){
      done();
    }
  };

  /**
   * delete all data from the database
   */
  api.purge = function(next){

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
   * get some basic stats
   */
  api.stats = function(next){

    var sql;
    sql = "SELECT ";
    sql += " (SELECT COUNT(*) FROM obj) AS objects, ";
    sql += " (SELECT COUNT(*) FROM rel) AS relations ";

    db.queryOne(
      sql,
      next
    );

  };


  /**
   * all objects
   */
  api.all = function(opts, next) {

    var sql;
    var args;

    args = [];
    
    // related objs query
    sql = "SELECT id, type, slug";
    sql += " FROM obj o ";

    // sql += " ORDER BY o." + opts.sort;
    // if(opts.order === -1){
    //   sql += " DESC";
    // }

    // sql += " LIMIT " + opts.limit;
    // if(opts.base > 0){
    //   sql += " OFFSET " + opts.base;
    // }

    db.query(
      sql,
      //args,
      function(err, rows){
        next(err, rows);
      });

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

  // can user role_id perform action role on doc rel_id given membership
  // of group id -- same semantics as find with role_id.
  api.can = function(role_id, rel_id, id, role, next){

    // role is optional

    if(typeof role === 'function'){
      next = role;
      role = false;
    }

    if(role && !_.isArray(role)){
      role = [role];
    }

    var sql;
    var args = [];
    var conds = [];
    var ix = 1;
    var cx;

    if(!id || !validate.uuid(id)){
      return next(new Error('invalid id'));
    }

    if(!rel_id || !validate.uuid(rel_id)){
      return next(new Error('invalid rel_id'));
    }

    if(!role_id || !validate.uuid(role_id)){
      return next(new Error('invalid role_id'));
    }

    sql = "";
    sql += "SELECT COUNT(*) FROM obj u";
    sql += " INNER JOIN rel g ";
    sql += "  ON g.rel_id = u.id ";
    sql += "  AND g.id = $" + ix;
    args.push(id);
    ix ++;

    // if role or [role, role, ...]
    if(role){
      cx = [];
      _.each(role, function(x){
        cx.push(ix);
        ix ++;
        args.push(x);
      });
      sql += " AND g.role IN($" + cx.join(', $') + ")";
    }

    sql += " INNER JOIN rel r ";
    sql += "  ON r.id = g.id ";
    sql += "  AND r.rel_id = $" + ix;
    args.push(rel_id);
    ix ++;

    sql += " WHERE u.id=$" + ix;
    args.push(role_id);
    ix ++;

    db.queryOne(
      sql,
      args,
      function(err, res){
        var can = (Number(res.count) === 1);
        next(err, can);
      });

  };

  /**
   * find a set of objects
   */
  api.find = function(opts, next) {

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
  api.count = function(opts, next) {

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
   * get a single object by id, optionally enforcing type
   */
  api.getById = function(id, type, next){

    if(typeof type === 'function'){
      next = type;
      type = false;
    }

    if(!validate.uuid(id)){
      return next(new Error('invalid id'));
    }

    var sql;
    var args = [id];

    sql = "SELECT * ";
    sql += " FROM obj ";
    sql += " WHERE id = $1";
    if(type){
      sql += " AND type = $2";
      args.push(type);
    }

    db.queryOne(
      sql,
      args,
      next
    );

  };

  /**
   * get a single object by it slug and type. If more than one exists
   * with the same slug, one will be returned at random
   */
  api.getBy = function(opts, next){

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
  api.get = function(q, type, next) {

    if(typeof type === 'function'){
      next = type;
      type = false;
    }

    if(validate.uuid(q)){
      if(type){
        return api.getById(q, type, next);
      } else {
        return api.getById(q, next);
      }
    }

    if(_.isObject(q)){
      return api.getBy(q, next);
    }

    return next();

  };


  /**
   * create an object. can optionally set rels at the same time
   */
  api.add = function(obj, rels, next) {

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
      api.set(obj.id, obj.attrs, function(){
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
        api.rel(
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
  api.setSlug = function(id, slug, next) {

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
        api.get(id, next);
      });

  };

  /**
   * update the json blob on an existing object
   */
  api.set = function(id, attrs, next) {

    if (!validate.uuid(id)) {
      return next(new Error('invalid id'));
    }

    // overloaded for setting arbitrary field on obj table. currently
    // only slug can be set.
    if (arguments[1] === 'slug') {
      return api.setSlug(id, arguments[2], arguments[3]);
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
        api.get(id, next);
      });

  };


  /**
   * delete an object by id
   */
  api.del = function(id, next) {

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
  api.unrel = function(id, rel_id, next) {

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
  api.rel = function(id, rel_id, opts, next) {

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
      api.unrel(id, rel_id, done);
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

  // export the api methods
  return api;

};
