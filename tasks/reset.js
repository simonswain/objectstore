"use strict";

module.exports = function(grunt) {
  grunt.registerTask('reset', 'Resets database to pristine state', function() {
    var done = this.async();
    var config = require('../config')(process.env.NODE_ENV);
    var api = require('../lib').api(config);
    api.reset(done);
  });
};
