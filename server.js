var config = require( '../config');
var server = require('./api/server')(config);
server.start();

process.on( 'SIGINT', function() {
  console.log( 'info','Shutting Down...' );
  server.stop(function(){
    console.log( 'info','Finished.' );
  });
});
