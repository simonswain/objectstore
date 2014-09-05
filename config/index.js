var env = process.env.NODE_ENV || 'dev';

var nickname = 'os';

var pg = {
  host:'localhost', 
  port: 5432,
  username: 'os', //nickname, 
  password: 'os', 
  database: ''
};

switch ( env ) {
case 'test' :
  exports.host = 'localhost';
  exports.port = 8003;
  pg.database = nickname + '_test';
  break;

case 'dev' :
  exports.host = 'localhost';
  exports.port = 8002;
  pg.database = nickname + '_dev';
  break;

case 'live' :
  exports.host = 'localhost';
  exports.port = 800;
  pg.database = nickname + '_live';
  break;
}

var db = {
  url: 'postgres://' + pg.username + ':' + pg.password + '@' + pg.host + '/' + pg.database
};

exports.env = env;
exports.db = db;

