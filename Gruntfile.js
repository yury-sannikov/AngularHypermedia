module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-ngmin');

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		uglify: {
			options: {
				banner: "/*!\n * <%= pkg.name %> <%= pkg.version %>-<%= grunt.template.today('yyyymmdd') %>\n * Copyright 2013 Jeremy Marquis (@_jmarquis)\n * http://github.com/jmarquis/angular-hateoas\n */\n"
			},
			build: {
				src: "src/<%= pkg.name %>.js",
				dest: "build/<%= pkg.name %>.min.js"
			}
		},
		karma: {
			unit: {
				configFile: "karma.conf.js"
			},
			continuous: {
				configFile: "karma.conf.js",
				singleRun: true
			}
		}
	});

	grunt.registerTask("default", ["karma:continuous", "uglify"]);

	grunt.registerTask("startTestServer", ["karma:unit:start"]);
	grunt.registerTask("runTests", ["karma:unit:run"]);
	grunt.registerTask("test", ["karma:continuous"]);
  	grunt.registerTask('build', ['clean', 'jshint',
    	'copy:build_appjs', 'copy:build_unitjs', 'copy:build_vendorjs']);

};