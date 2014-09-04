var Hapi = require('hapi');
var async = require('async');


var logger = require('./lib/logger');
var api = require('./api');
var db = require('./lib/db');

var server = Hapi.createServer('localhost', 8000);

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

process.on( 'SIGINT', function() {
  logger.log( 'info','Shutting Down...' );
  server.stop(function(){
    db.close();
    logger.log( 'info','Finished.' );
  });
});

server.start();
