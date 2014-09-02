var Hapi = require('hapi');
var async = require('async');

var api = require('./api');

var server = Hapi.createServer('localhost', 8000);

server.route({
  method: 'GET',
  path: '/ping',
  handler: function (request, reply) {
    reply({pong: new Date().getTime()});
  }
});

server.route({
  method: 'GET',
  path: '/status',
  handler: function (request, reply) {
    reply({status: 'ok'});
  }
});

server.route({
  method: 'GET',
  path: '/stats',
  handler: function (request, reply) {
    var stats = {};
    reply(stats);
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
