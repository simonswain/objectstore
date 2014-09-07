var db = {
  poolMin: 2,
  poolMax: 2,
  url: 'postgres://postgres@localhost:5432/os_test'
};

exports.port = 3003;
exports.env = 'test';
exports.db = db;

