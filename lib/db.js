"use strict";

var anyDB = require('any-db');

module.exports = function(config){

  if(!config.db.hasOwnProperty('poolMin')){
    config.db.poolMin = 1;
  }

  if(!config.db.hasOwnProperty('poolMax')){
    config.db.poolMax = 2;
  }

  var pool = anyDB.createPool(
    config.db.url, {
      min: config.db.poolMin, 
      max: config.db.poolMax, 
      onConnect: function (conn, done) { 
        done(null, conn);
      }
    }
  );

  var conn = function(callback) {
    return anyDB.createConnection(
      config.db.url, 
      callback
    );
  };

  var close = function(){
    pool.close();
  };

  var query = function(){

    var sql, args, cols, next;

    switch(arguments.length){
    case 2:
      sql = arguments[0];
      next = arguments[1]; 
      break;

    case 3:
      sql = arguments[0];
      args = arguments[1];
      next = arguments[2]; 
      break;

    case 4: 
      sql = arguments[0];
      args = arguments[1];
      cols = arguments[2];
      next = arguments[3]; 
      break;
    }

    conn(
      function(err, myConn){

        if(err){
          return next(err);
        }

        myConn.query(
          sql,
          args,
          function(err, res){
            if(err){
              console.log(err);
              myConn.end();
              return next(err);
            }
            myConn.end();
            next(null, res.rows);
          });
      });
    
  };

  var queryOne = function(){

    var sql, args, cols, next;

    switch(arguments.length){
    case 2:
      sql = arguments[0];
      next = arguments[1]; 
      break;

    case 3:
      sql = arguments[0];
      args = arguments[1];
      next = arguments[2]; 
      break;

    case 4: 
      sql = arguments[0];
      args = arguments[1];
      cols = arguments[2];
      next = arguments[3]; 
      break;
    }

    query(
      sql, 
      args, 
      cols, 
      function(err, rows){
        var row = false;
        if(rows.length === 1){
          row = rows[0];
        }
        next(null, row);
      });
    
  };

  return {
    query: query,
    queryOne: queryOne,
    close: close
  };

};
