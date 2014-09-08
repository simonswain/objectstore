"use strict";

module.exports = function(grunt) {
  grunt.registerTask('reset', 'Resets database to pristine state', function() {
    var done = this.async();
    var config = require('../config');
    var api = require('../lib').api(config);
    api.reset(done);
  });
};
