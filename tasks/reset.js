"use strict";

module.exports = function(grunt) {
  grunt.registerTask('reset', 'Resets database to pristine state', function() {
    var done = this.async();
    var api = require('../api');
    api.reset(done);
  });
};
