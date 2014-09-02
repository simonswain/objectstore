//require('shelljs/global');

module.exports = function(grunt) {
 
  grunt.registerTask('reset', 'Resets database to pristine state', function() {
    var done = this.async();

    //rm('data/*');

    var reset = require('../db/reset.js');
    reset(done);
  });

}
