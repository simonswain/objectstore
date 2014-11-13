"use strict";

var Hapi = require('hapi');
var async = require('async');
var logger = require('./logger');
var validate = require('./validate');
var Path = require('path');

module.exports = function(opts){

  opts = opts || {};

  if(!opts.hasOwnProperty('server')){
    opts.server = {
      host: '127.0.0.1',
      port: 8002
    };
  }

  var api = require('./api.js')(opts);

  var root = __dirname + '/server/public';
 
  var server = Hapi.createServer(
    opts.server.host, 
    opts.server.port
  );

  server.views({
    engines: {
      html: require('handlebars')
    },
    path: Path.join(__dirname, 'server/views')
  });

  // asset routes - css, js, images

  server.route({
    method: 'GET',
    path: '/images/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'server/public/images'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/vendor/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'server/public/vendor'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/js/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'server/public/js'),
        listing: false,
        index: false
      }
    }
  });

  // less

  server.pack.register({
    plugin: require('hapi-less'),
    options: {
      home: Path.join(__dirname, 'server/public/less'),
      route: '/css/{filename*}',
      less: {
        compress: true
      }
    }
  }, function (err) {
    if (err) {
      console.log('Failed loading hapi-less');
    }
  });

  // view routes - html

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply.view('app');
    }
  });


  // rest methods

  server.route({
    method: 'GET',
    path: '/api',
    handler: function (request, reply) {
      reply(api.version);
    }
  });

  server.route({
    method: 'GET',
    path: '/stats',
    handler: function (request, reply) {
      api.stats(function(err, res){
        reply(res);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/reset',
    handler: function (request, reply) {
      api.reset(function(err, res){
        reply(res);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/objects',
    handler: function (request, reply) {
      var res = {};

      var find = function(next){
        api.find(
          request.query, 
          function(err, objs){
            res.objects = objs;
            next();
          });
      };

      var count = function(next){
        api.count(
          request.query, 
          function(err, count){
            res.count = count;
            next();
          });
      };

      async.parallel([find, count], function(){
        reply(res);
      });

    }
  });

  server.route({
    method: 'POST',
    path: '/objects',
    handler: function (request, reply) {
      api.add(
        request.payload,
        function(err, obj){
          reply(obj);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/objects/{id}',
    handler: function (request, reply) {
      api.get(
        request.params.id,
        function(err, obj){
          if(!obj){
            return reply(false).code(404);
          }
          api.set(
            request.params.id,
            request.payload,
            function(err, obj){
              reply(obj);
            });
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/objects/{id}',
    handler: function (request, reply) {
      api.del(
        request.params.id,
        function(err){
          reply();
        });
    }
  });

  server.route({
    method: 'GET',
    path: '/objects/{id}',
    handler: function (request, reply) {
      api.get(
        request.params.id,
        function(err, obj){
          if(!obj){
            return reply(false).code(404);
          }
          reply(obj);
        });
    }
  });

  // // get specific rel_ids related to {id}

  // // /objects/{id}/rel?type=xx&&slug=xx
  // server.route({
  //   method: 'GET',
  //   path: '/objects/{id}/rels',
  //   handler: function (request, reply) {
  //     api.get(
  //       request.params.id,
  //       function(err, obj){
  //         if(!obj){
  //           return reply(false).code(404);
  //         }
  //         reply(obj);
  //       });
  //   }
  // });


  var start = function(done){
    server.start(function(){
      if(done){
        done();
      }
    });
  };

  var stop = function(done){
    api.quit(function(){
      server.stop({
        timeout: 1000
      }, function(err, res){
        done();
      });
    });
  };

  return {
    start: start,
    stop: stop
  };

};

