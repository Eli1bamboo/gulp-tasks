var browserSync 	= require('browser-sync');
var connect			= require('gulp-connect-php');
var gulp 			= require('gulp');
var sass        	= require('gulp-sass');
var notify 			= require("gulp-notify");
var sourcemaps  	= require('gulp-sourcemaps');
var autoprefixer	= require('gulp-autoprefixer');
var bulkSass    	= require('gulp-sass-glob-import');
var uglify      	= require("gulp-uglify");

var args   			= require('yargs').argv;
var gulpif 			= require('gulp-if');

// gulp task --env env

//Tasks:
//Default: Will mount a virtual server to work with BrowserSync.
//wp: Watch and compile assets once the theme is installed.

// Environments
// prod: will minify assets
// dev: won't minify assets

var isProd		 	= args.env === 'prod';
var isDev 			= args.env === 'dev';

// Compile sass into CSS & auto-inject into browsers
gulp.task('scss', function() {
    return gulp.src(['assets/css/scss/app.scss'])
        .pipe(bulkSass())
        .pipe(sourcemaps.init())
		.pipe(gulpif(isProd, sass({outputStyle: 'compressed'}).on('error', function(err) {
            notify().write(err);
            this.emit('end');
        }))) // only minify if production
		.pipe(gulpif(isDev, sass().on('error', function(err) {
            notify().write(err);
            this.emit('end');
        }))) // not minify if development
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest("assets/css"))
        .pipe(browserSync.stream());
});

// Compile and minify vendor js assets
gulp.task('vendor-js', function() {
    return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'node_modules/jquery/dist/jquery.min.js', 'node_modules/slick-carousel/slick/slick.js'])
		.pipe(uglify())
		.pipe(gulp.dest("assets/js"))
        .pipe(browserSync.stream());
});

gulp.task('custom-js', function() {
    return gulp.src(['assets/js/main.js'])
		.pipe(gulpif(isProd, uglify())) // only minify if production
		// .pipe(gulpif(isDev, uglify({compress: false, output: { beautify: true }}))) // not minify if development
		.pipe(gulp.dest("assets/js"))
        .pipe(browserSync.stream());
});

// Compile templates
gulp.task('templates', function () {
   return gulp.src(['**/*.php'])
   .pipe(browserSync.stream());
})

// Random port generator to work with multiple projects at the same time
var min = 3000;
var max = 4000;
var randomPort = Math.floor(Math.random() * (max - min + 1)) + min;

// Php Server Tasks
gulp.task('connect', function() {
	connect.server({
		stdio: 'ignore',
		base: './',
		port: randomPort,
		keepalive: true
	});
});

// Browser-Sync Tasks
gulp.task('browser-sync',['connect'], function() {
   browserSync({
      proxy: `127.0.0.1:${randomPort}`,
      port: randomPort,
      open: true,
      notify: true
   });
});

// Watch Tasks
gulp.task ('watch', function(){
   gulp.watch('assets/css/scss/**/*.scss', ['scss']);
   gulp.watch('assets/js/main.js', ['custom-js']);
   gulp.watch('**/*.php', ['templates']).on('change', function(e) {
    return gulp.src(e.path)
        .pipe(browserSync.reload({stream: true}));
	});
});

// Default
gulp.task('default', ['watch', 'browser-sync', 'scss', 'custom-js', 'vendor-js']);

// Wordpress Installed
gulp.task('wp', ['watch', 'scss', 'custom-js', 'vendor-js']);
