var Hapi = require('hapi');
var async = require('async');
var logger = require('./logger');

module.exports = function(config){

  var api = require('./api.js')(config);

  var server = Hapi.createServer(
    config.host,
    config.port
  );

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply({'objectstore': '0.0.1'});
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
    method: 'GET',
    path: '/objects/{id}',
    handler: function (request, reply) {
      reply('Not implemented yet');
    }
  });

  server.route({
    method: 'GET',
    path: '/objects',
    handler: function (request, reply) {
      api.find({}, function(err, objs){
        reply(objs);
      });
    }
  });

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

  return{
    start: start,
    stop: stop
  };

};

