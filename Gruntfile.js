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
		clean :
		{
			'clean': 
			[
				'build' 
			],
		},
		uglify: {
			options: {
				banner: "/*!\n * <%= pkg.name %> <%= pkg.version %>-<%= grunt.template.today('yyyymmdd') %>\n * http://github.nreca.org/yxs0/angular-hypermedia\n */\n"
			},
			build: {
				src: "build/<%= pkg.name %>.js",
				dest: "build/<%= pkg.name %>.js"
			}
		},
		concat: {
			compile_js: {
				options: {
				},
				src: [
					'src/*.js'
				],
				dest: 'build/<%= pkg.name %>.js'
			}
		},
		copy: {
			publish : {
				files: [
				{
					src: [ 'build/<%= pkg.name %>.js' ],
					dest: 'lib/<%= pkg.name %>.min.js',
					cwd: '.',
					expand: false
				}
				]
			},		
		},
		karma: {
			unit: {
				configFile: "karma.conf.js"
			},
			continuous: {
				configFile: "karma.conf.js",
				singleRun: true
			},
			continuous_minified: {
				configFile: "karma.conf.build.js",
				singleRun: true
			}
		}
	});

	grunt.registerTask("default", ["clean","karma:continuous", "concat", "uglify"]);
	grunt.registerTask("publish", ["clean", "concat", "uglify", "karma:continuous_minified", "copy"]);

	grunt.registerTask("startTestServer", ["karma:unit:start"]);
	grunt.registerTask("runTests", ["karma:unit:run"]);
	grunt.registerTask("test", ["karma:continuous"]);
  	grunt.registerTask('build', ['clean', 'jshint',
    	'copy:build_appjs', 'copy:build_unitjs', 'copy:build_vendorjs']);

};