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
  exports.port = 3003;
  pg.database = nickname + '_test';
  break;

case 'dev' :
  exports.port = 3002;
  pg.database = nickname + '_dev';
  break;

case 'live' :
  exports.listen = '/tmp/' + nickname + '.sock';
  pg.database = nickname + '_live';
  break;
}

var db = {
  poolMin: 2,
  poolMax: 2,
  url: 'postgres://' + pg.username + ':' + pg.password + '@' + pg.host + '/' + pg.database
};

exports.env = env;
exports.db = db;

