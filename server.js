var os = require('./lib');
var config = require( './config');
var server = os.Server(config);

server.start();

process.on( 'SIGINT', function() {
  console.log( 'info','Shutting Down...' );
  server.stop(function(){
    console.log( 'info','Finished.' );
  });
});
