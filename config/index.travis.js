module.exports = function(env){

  var env = process.env.NODE_ENV || 'development';

  var nickname = 'os';

  var server = {
    host: 'localhost',
    port: 8003
  };

  var db = {
    url: 'postgres://postgres@localhost:5432/os_test'
  };

  return {
    nickname: nickname,
    env: 'test',
    server: server,
    db: db
  };

};
