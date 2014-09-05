var os = require('./lib');
var logger = require( './lib/logger');
var config = require( './config');
var server = os.server(config);

server.start(function(){
  logger.log( 'info','Objectstore running on ' + config.host + ':' + config.port );
});

process.on( 'SIGINT', function() {
  logger.log( 'info','Shutting Down...' );
  server.stop(function(){
    logger.log( 'info','Finished.' );
  });
});
