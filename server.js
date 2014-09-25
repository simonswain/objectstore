var os = require('./lib');
var logger = require( './lib/logger');
var config = require( './config')(process.env.NODE_ENV);
var server = os.server(config);

server.start(function(){
  logger.log('info', config.nickname + ' ' + config.env + ' ' + config.server.host + ':' + config.server.port);
});

process.on( 'SIGINT', function() {
  logger.log('info','Shutting Down...');
  server.stop(function(){
    logger.log('info','Finished.');
  });
});
