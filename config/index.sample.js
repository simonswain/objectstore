var env = process.env.NODE_ENV || 'development';

var nickname = 'os';

var pg = {
  host:'localhost',
  port: 5432,
  username: 'os',
  password: 'os',
  database: ''
};

exports.host = 'localhost';

switch ( env ) {
case 'test' :
  exports.port = 8003;
  pg.database = nickname + '_test';
  break;

case 'development' :
  exports.port = 8002;
  pg.database = nickname + '_dev';
  break;

case 'production' :
  exports.port = 8001;
  pg.database = nickname + '_live';
  break;
}

var db = {
  url: 'postgres://' + pg.username + ':' + pg.password + '@' + pg.host + '/' + pg.database
};

exports.env = env;
exports.db = db;

