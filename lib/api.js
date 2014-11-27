"use strict";

var _ = require('underscore');
var async = require('async');
var validate = require('./validate.js');

module.exports = function(config){

  var db = require('./db.js')(config);

  var api = {};

  api.version = {
    'objectstore': '0.0.3'
  };

  /**
   * initialise the database
   */
  api.reset = function(done){

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
        done();
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
  api.purge = function(done){

    var objs = function(next){
      var sql;
      sql = "DELETE FROM obj ";
      db.query(
        sql,
        function(err){
          next(err);
        });
    };

    var rels = function(next){
      var sql;
      sql = "DELETE FROM rel ";
      db.query(
        sql,
        function(err){
          next(err);
        });
    };

    async.series([objs, rels], done);

  };


  /**
   * get some basic stats
   */
  api.stats = function(done){

    var sql;
    sql = "SELECT ";
    sql += " (SELECT COUNT(*) FROM obj) AS objects, ";
    sql += " (SELECT COUNT(*) FROM rel) AS relations, ";
    sql += " (SELECT COUNT(DISTINCT(type)) FROM obj) AS types ";

    db.queryOne(
      sql,
      done
    );

  };


  /**
   * find a set of objects
   */

  api.find = function(query, opts, done) {

    if(typeof opts === 'function'){
      done = opts;
      opts = {};
    }

    opts.count = (opts.hasOwnProperty('count'));
    opts.one = (opts.hasOwnProperty('one'));

    if (!query.hasOwnProperty('type')){
      query.type = false;
    }

    if (!query.hasOwnProperty('slug')){
      query.slug = false;
    }

    if (!query.hasOwnProperty('id')){
      query.id = false;
    }

    if (!query.hasOwnProperty('rel_id')){
      query.rel_id = false;
    }

    if (!query.hasOwnProperty('role')){
      query.role = false;
    }

    if (query.role && !_.isArray(query.role)){
      query.role = [query.role];
    }

    // filtering and ordering

    if (!query.hasOwnProperty('sort') || typeof query.sort === 'undefined') {
      query.sort = false;
    }

    // ascending
    query.order = 1;

    // descending
    if (query.sort && query.sort.substr(0,1) === '-') {
      query.order = -1;
      query.sort = query.sort.substr(1);
    }

    // filter based on json values

    if (!query.hasOwnProperty('where')){
      query.where = false;
    }

    if (typeof query.where !== 'object'){
      query.where = false;
    }

    // paging

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

    if(!opts.debug){
      opts.debug = false;
    }

    if(!query){
      return done(null, []);
    }

    // all of type
    // {type: '<type>'}

    // all of type where they are rel_id of id (== children)
    // {id: <id>, type: '<type>'}

    // reverse lookup
    // all of type where they are id of rel_id (== parents)
    // {rel_id: <rel_id>, type: '<type>'}

    var sql;
    var args = [];
    var conds = [];
    var wheres = [];
    var ix = 1;
    var cx;

    if(query.id || query.rel_id){
      if(opts.count){
        sql = "SELECT COUNT(*) AS count";
      } else {
        sql = "SELECT o.*, r.role, r.position";
      }
      sql += " FROM rel r ";
      sql += " INNER JOIN obj o ";
      if(query.rel_id){
        // reverse lookup
        sql += " ON o.id = r.id ";
      } else {
        sql += " ON o.id = r.rel_id ";
      }
    } else {
      // by type
      if(opts.count){
        sql = "SELECT COUNT(*)";
      } else {
        sql = "SELECT *";
      }
      sql += " FROM obj o ";
    }

    if(query.type){
      // objects of this type will be found
      conds.push(" o.type = $" + ix);
      args.push(query.type);
      ix ++;
    }

    if(query.id){
      conds.push(" r.id = $" + ix);
      args.push(query.id);
      ix ++;
    }

    if(query.rel_id){
      conds.push(" r.rel_id = $" + ix);
      args.push(query.rel_id);
      ix ++;
    }

    if(query.slug){
      conds.push(" o.slug = $" + ix);
      args.push(query.slug);
      ix ++;
    }

    // filter by json key matching
    if(query.where){

      wheres = [];

      _.each(query.where, function(val, key){
        var s = '';
        s += " o.attrs->>$" + ix;
        args.push(key);
        ix ++;

        s += " ILIKE $" + ix;
        args.push(val + '%');
        ix ++;
        wheres.push(s);
      });

      if(wheres.length>0){
        conds.push (" (" + wheres.join(" OR ") + ")");
      }

    }

    // create query
    if(conds.length>0){
      sql += " WHERE";
      sql += conds.join(" AND ");
    }

    // if role or [role, role, ...]
    if(query.role){
      cx = [];
      _.each(query.role, function(x){
        cx.push(ix);
        ix ++;
        args.push(x);
      });
      sql += " AND r.role IN($" + cx.join(', $') + ")";
    }

    
    if(opts.count){

      if(opts.debug){
        console.log(query, opts, sql, args);
      }

      db.queryOne(
        sql,
        args,
        function(err, row){
          done(err, Number(row.count));
        });

    } else if(opts.one){

      // when only one record is expected

      sql += " LIMIT 1";

      if(opts.debug){
        console.log(query, opts, sql, args);
      }

      db.queryOne(
        sql,
        args,
        function(err, row){
          done(err, row);
        });

    } else {

      // sort by key in top level of attrs
      if(query.sort){
        sql += " ORDER BY o.attrs->>$" + ix;
        args.push(query.sort);
        ix ++;
        if(query.order === -1){
          sql += " DESC";
        }
      }

      sql += " LIMIT $" + ix;
      args.push(opts.limit);
      ix ++;

      if(opts.base > 0){
        sql += " OFFSET $" + ix;
        args.push(opts.base);
        ix ++;
      }

      if(opts.debug){
        console.log(query, opts, sql, args);
      }

      db.query(
        sql,
        args,
        function(err, rows){
          done(err, rows);
        });

    }

  };


  /**
   * convenience method - count how many objects exists according to criteria
   */
  api.count = function(query, done) {
    api.find(query, {count: true}, done);
  };

  // can user id perform action as [role] on doc rel_id given membership
  // of group id -- same semantics as find with role_id.
  api.can = function(query, done){

    if(!query.id || !validate.uuid(query.id)){
      return done(new Error('invalid id'));
    }

    if(!query.target_id || !validate.uuid(query.target_id)){
      return done(new Error('invalid target_id'));
    }

    query.role = query.role || false;

    // if string, convert to array to allow for mulitple roles
    if(query.role && typeof query.role !== 'object'){
      query.role = [query.role];
    }

    var sql;
    var args = [];
    var tmp = [];

    sql = "";
    sql += "SELECT COUNT(*) AS can ";
    sql += " FROM rel r1 ";
    // o1 is the link
    sql += " INNER JOIN obj o1 ON o1.id = r1.id ";
    sql += " INNER JOIN rel r2 ON r2.id = r1.id ";
    sql += " AND r2.rel_id = $1 ";
    // o2 is the target
    sql += " INNER JOIN obj o2 ON o2.id = r2.rel_id";
    sql += " WHERE r1.rel_id = $2 ";
    sql += " AND o1.type = $3";

    args = [query.id, query.target_id, query.link];

    if(query.role){
      tmp = [];
      query.role.forEach(function(role, ix){
        args.push(role);
        tmp.push('$' + (4+ix));
      });
      sql += " AND r2.role IN(" + tmp.join(',') + ")";
    }
    db.queryOne(
      sql,
      args,
      function(err, res){ 
       var can = (Number(res.can) > 0);
        done(err, can);
      });

  };


  // find a set of objects and roles accesssible by id via link object
  api.join = function(query, opts, done) {
   
    if(typeof opts === 'function'){
      done = opts;
      opts = {};
    }

    // count mode

    opts.count = (opts.hasOwnProperty('count'));

    // selection

    if (!query.hasOwnProperty('id')){
      query.id = false;
    }

    if(!validate.uuid(query.id)){
      query.id = false;
    }

    if (!query.hasOwnProperty('link')){
      query.link = false;
    }

    if (!query.hasOwnProperty('type')){
      query.type = false;
    }


    if(!query.id || !query.link || !query.type){
      return done(new Error('invalid query'));
    }

    // filtering and ordering

    if (!query.hasOwnProperty('sort') || typeof query.sort === 'undefined') {
      query.sort = false;
    }

    // ascending
    query.order = 1;

    // descending
    if (query.sort && query.sort.substr(0,1) === '-') {
      query.order = -1;
      query.sort = query.sort.substr(1);
    }

    // filter based on json values

    if (!query.hasOwnProperty('where')){
      query.where = false;
    }

    if (typeof query.where !== 'object'){
      query.where = false;
    }

    // paging

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

    if(!opts.debug){
      opts.debug = false;
    }

    var sql = "";
    var args = [];
    var conds = [];
    var wheres = [];
    var ix;

    // o1 is the link type (eg group)
    // o2 is the objs we want to find (eg docs)

    if(opts.count){
      sql = "SELECT COUNT(DISTINCT(o2.id)) AS count";
      sql += " FROM rel r1";
      sql += " INNER JOIN obj o1 ON o1.id = r1.id AND o1.type=$1";
      sql += " LEFT JOIN rel r2 ON r2.id = r1.id";
      sql += " INNER JOIN obj o2 ON o2.id = r2.rel_id AND o2.type=$2";
      sql += " WHERE r1.rel_id = $3";
    } else {
      sql += "SELECT o2.*, ARRAY_AGG(r1.role) AS roles";
      sql += " FROM rel r1";
      sql += " INNER JOIN obj o1 ON o1.id = r1.id AND o1.type=$1";
      sql += " LEFT JOIN rel r2 ON r2.id = r1.id";
      sql += " INNER JOIN obj o2 ON o2.id = r2.rel_id AND o2.type=$2";
      sql += " WHERE r1.rel_id = $3";
    }

    args = [
      query.link,
      query.type,
      query.id
    ];

    ix = 4;

    // filter by json key matching
    if(query.where){

      wheres = [];

      _.each(query.where, function(val, key){
        var s = '';
        s += " o2.attrs->>$" + ix;
        args.push(key);
        ix ++;

        s += " ILIKE $" + ix;
        args.push(val + '%');
        ix ++;
        wheres.push(s);
      });

      if(wheres.length>0){
        conds.push (" (" + wheres.join(" OR ") + ")");
      }

    }

    // create query
    if(conds.length>0){
      // already have a WHERE above
      sql += " AND ";
      sql += conds.join(" AND ");
    }

    if(opts.count){
      // noop
    } else {
      sql += " GROUP BY o2.id";
    }

    if(opts.debug){
      console.log(query);
      console.log(opts);
      console.log(sql);
      console.log(args);
    }

    if(opts.count){

      db.queryOne(
        sql,
        args,
        function(err, row){
          done(err, Number(row.count));
        });

    } else {

      // for when we want to add more args below

      // should be sorting on a json key in attrs

      // sql += " ORDER BY o." + query.sort;
      // if(query.order === -1){
      //   sql += " DESC";
      // }

      query.sort = 'title';

      // sort by key in top level of attrs
      if(query.sort){
        sql += " ORDER BY o2.attrs->>$" + ix;
        args.push(query.sort);
        ix ++;
        if(query.order === -1){
          sql += " DESC";
        }
      }

      sql += " LIMIT $" + ix;
      args.push(opts.limit);
      ix ++;

      if(query.base > 0){
        sql += " OFFSET $" + ix;
        args.push(opts.base);
        ix ++;
      }

      db.query(
        sql,
        args,
        function(err, rows){
          done(err, rows);
        });

    }

  };
  

  /**
   * get a single object by id, optionally enforcing type
   */
  api.getById = function(id, type, done){

    if(typeof type === 'function'){
      done = type;
      type = false;
    }

    if(!validate.uuid(id)){
      return done(new Error('invalid id'));
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
      done
    );

  };

  /**
   * get a single object by it slug and type. If more than one exists
   * with the same slug, one will be returned at random
   */
  api.getBy = function(query, done){

    var sql;
    var args = [];
    var conds = [];
    var ix = 1;

    if(!query.hasOwnProperty('id') || ! validate.uuid(query.id)){
      query.id = false;
    }

    if(!query.hasOwnProperty('type')){
      query.type = false;
    }

    if(!query.hasOwnProperty('slug')){
      query.slug = false;
    }

    if(query.id){
      sql = "SELECT o.*";
      sql += " FROM rel r ";
      sql += " INNER JOIN obj o ";
      sql += " ON o.id = r.rel_id ";
    } else {
      sql = "SELECT *";
      sql += " FROM obj o ";
    }

    if(query.id){
      conds.push(" r.id = $" + ix);
      args.push(query.id);
      ix ++;
    }

    if(query.type){
      conds.push(" o.type = $" + ix);
      args.push(query.type);
      ix ++;
    }

    if(query.slug){
      conds.push(" o.slug = $" + ix);
      args.push(query.slug);
      ix ++;
    }

    // must have some conditions
    if(conds.length === 0){
      return done(null, false);
    }

    sql += " WHERE";
    sql += conds.join(" AND ");

    db.queryOne(
      sql,
      args,
      done
    );
  };


  /**
   * get a single object that matches the type and json fields
   * provided in query.where. If more than one exists with the same
   * slug, one will be returned at random
   */
  api.getWhere = function(query, done){

    var sql;
    var args = [];
    var conds = [];
    var ix = 1;

    if(!query.hasOwnProperty('type')){
      query.type = false;
    }

    if(!query.hasOwnProperty('where')){
      query.slug = false;
    }

    sql = "SELECT *";
    sql += " FROM obj o ";

    if(query.type){
      conds.push(" o.type = $" + ix);
      args.push(query.type);
      ix ++;
    }

    // json key matching
    if(query.where){

      _.each(query.where, function(val, key){
        var s = '';
        s += " o.attrs->>$" + ix;
        args.push(key);
        ix ++;

        s += "=$" + ix;
        args.push(val);
        ix ++;
        conds.push(s);
      });

    }


    // must have some conditions
    if(conds.length === 0){
      return done(null, false);
    }

    sql += " WHERE";
    sql += conds.join(" AND ");

    db.queryOne(
      sql,
      args,
      done
    );
  };


  /**
   * get an object by id or type + slug
   */
  api.get = function(q, type, done) {

    if(typeof type === 'function'){
      done = type;
      type = false;
    }

    // json key matching
    if(q.where){
      return api.getWhere(q, done);
    }
    
    if(validate.uuid(q)){
      if(type){
        return api.getById(q, type, done);
      } else {
        return api.getById(q, done);
      }
    }

    if(_.isObject(q)){
      return api.getBy(q, done);
    }

    return done();

  };


  /**
   * parent of a specific object. If you know there will be only one
   * parent, you can omit type. Otherwise parent of a specific type
   * wil be looked for
   */
  api.parent = function(rel_id, type, done){

    if(!validate.uuid(rel_id)){
      return done(new Error('invalid id'));
    }

    if(typeof type === 'function'){
      done = type;
      type = false;
    }

    var sql, args;

    args = [rel_id];

    if(type){
      args.push(type);
    }

    sql = "SELECT o.*";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.id ";
    sql += " WHERE r.rel_id = $1 ";
    if(type){
      sql += " AND o.type = $2 ";
    }

    db.queryOne(
      sql,
      args,
      done
    );

  };


  /**
   * children by type of a specific object SHOULD BE ABLE TO DO THIS WITH #FIND
   */
  api.children = function(id, type, done){

    if(!validate.uuid(id)){
      return done(new Error('invalid id'));
    }

    var sql;
    var args = [id, type];

    sql = "SELECT o.*";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.rel_id ";
    sql += " WHERE r.id = $1 ";
    sql += " AND o.type = $2 ";

    db.query(
      sql,
      args,
      function(err, rows){
        done(err, rows);
      });

  };

  /**
   * Get a child of a specific object. Useful for enforcing the given
   id for the child is actually from the parent
   */
  api.child = function(id, child_id, type, done){

    if(!validate.uuid(id)){
      return done(new Error('invalid id'));
    }

    var sql;
    var args = [id, type, child_id];

    sql = "SELECT o.*";
    sql += " FROM rel r ";
    sql += " INNER JOIN obj o ";
    sql += " ON o.id = r.rel_id ";
    sql += " WHERE r.id = $1 ";
    sql += " AND o.type = $2 ";
    sql += " AND o.id = $3 ";

    db.queryOne(
      sql,
      args,
      function(err, row){
        done(err, row);
      });

  };


  /**
   * create an object. can optionally set rels at the same time
   */
  api.add = function(obj, rels, done) {

    if(typeof rels === 'function'){
      done = rels;
      rels = false;
    }

    if(rels && !_.isArray(rels)){
      rels = [rels];
    }

    if(!obj.hasOwnProperty('attrs') || ! obj.attrs){
      obj.attrs = {};
    }

    var add = function(next){
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
          next();
        });
    };

    var set = function(next){
      api.set(obj.id, obj.attrs, function(){
        next();
      });
    };

    var addRels = function(next){

      if(!rels){
        return next();
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

      async.eachSeries(rels, addRel, next);

    };

    async.series(
      [add, set, addRels],
      function(){
        done(null, obj);
      });

  };


  /**
   * update an objects's slug (treated as a private method)
   */
  api.setSlug = function(id, slug, done) {

    if(!validate.uuid(id)) {
      return done(new Error('invalid id'));
    }

    var sql;
    sql = "UPDATE obj SET ";
    sql += " slug = $2 ";
    sql += " WHERE id = $1";

    db.query(
      sql,
      [id, slug],
      function(err){
        api.get(id, done);
      });

  };

  /**
   * update the json blob on an existing object
   */
  api.set = function(id, attrs, done) {

    if (!validate.uuid(id)) {
      return done(new Error('invalid id'));
    }

    // overloaded for setting arbitrary field on obj table. currently
    // only slug can be set.
    if (arguments[1] === 'slug') {
      return api.setSlug(id, arguments[2], arguments[3]);
    }

    if (typeof attrs !== 'object') {
      return done(new Error('invalid attrs'));
    }

    var sql;
    sql = "UPDATE obj SET ";
    sql += " attrs = $2 ";
    sql += " WHERE id = $1";

    db.query(
      sql,
      [id, attrs],
      function(err){
        api.get(id, done);
      });

  };


  /**
   * delete an object and it's rels by id
   */
  api.del = function(id, done) {

    if (!validate.uuid(id)) {
      return done(new Error('invalid id'));
    }

    var delObj = function(next){
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

    var delRels = function(next){
      var sql;
      sql = "DELETE ";
      sql += " FROM rel ";
      sql += " WHERE id = $1";
      sql += " OR rel_id = $1";

      db.query(
        sql,
        [id],
        function(err){
          next(err);
        });
    };

    async.series([
      delObj, delRels
    ], done);


  };


  /**
   * remove any existing relationship between two objects
   */
  api.unrel = function(id, rel_id, done) {

    if (!validate.uuid(id)) {
      return done(new Error('invalid id'));
    }

    if (!validate.uuid(rel_id)) {
      return done(new Error('invalid id'));
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
        done(err);
      });

  };


  /**
   * create a relationship between two objects
   */
  api.rel = function(id, rel_id, opts, done) {

    // opts is and optional param. all fields in opts are optional and
    // will be set to null if not provided

    //{role: <role>, expires: <datetime>, position: x}

    if(typeof opts === 'function'){
      done = opts;
      opts = {};
    }

    if (!validate.uuid(id)) {
      return done(new Error('invalid id'));
    }

    if (!validate.uuid(rel_id)) {
      return done(new Error('invalid rel_id'));
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

    var unrel = function(next){
      api.unrel(id, rel_id, next);
    };

    var rel = function(next){

      var sql;
      sql = "INSERT INTO rel ";
      sql += " (id, rel_id, role, expires, position)";
      sql += " VALUES ";
      sql += " ($1, $2, $3, $4, $5)";

      db.query(
        sql,
        [id, rel_id, opts.role, opts.expires, opts.position],
        function(err){
          next(err);
        });
    };

    async.series([unrel, rel], done);

  };

  // export the api methods
  return api;

};
