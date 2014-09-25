"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    nodeunit: {
      core: [
        'test/*.js'
      ]
    },
    jshint: {
      files: ['Gruntfile.js',
              'db/**/*.js',
              'lib/*.js', 
              'lib/server/public/js/**/*.js', 
              'test/**/*.js',
              'server.js'
             ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      }
    },
    env : {
      dev : {
        NODE_ENV : 'development'
      },
      test : {
        NODE_ENV : 'test'
      },
      staging : {
        NODE_ENV : 'staging'
      },
      production : {
        NODE_ENV : 'production'
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('lint', ['jshint']);

  grunt.registerTask('test', ['jshint', 'env:test', 'nodeunit:core']);
 
  grunt.registerTask('default', ['test']);


};
