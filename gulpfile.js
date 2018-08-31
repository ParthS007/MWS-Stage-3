var gulp = require('gulp');
var webp = require('gulp-webp');
var browserify = require('browserify');
var babelify = require('babelify');
var sourcemaps = require('gulp-sourcemaps');
var cleanCSS = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var gzip = require('gulp-gzip');
var gzipStatic = require('connect-gzip-static');

var connect = require('gulp-connect');

var jsSrcMainList = ['js/dbhelper.js', 'js/main.js'];
var jsSrcRestaurantList = ['js/dbhelper.js', 'js/restaurant_info.js'];

// webP image conversion task
gulp.task('webp', function () {
    gulp.src('img/*.jpg')
        .pipe(webp({
            method: 6
        }))
        .pipe(gulp.dest('img/webp'));
});

// style task
gulp.task('styles', function () {
    gulp.src('css/styles.css')
        .pipe(cleanCSS({
            compatibility: 'ie8'
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('./css'));
});

// script tasks
gulp.task('scripts', ['index', 'restaurant'], function () {});

gulp.task('index', function () {
    jsSrcMainList.map(function (jsFile) {
        return browserify({
                entries: [jsFile]
            })
            .transform(babelify.configure({
                presets: ['env']
            }))
            .bundle()
            .pipe(source('index.min.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({
                loadMaps: true
            }))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./js'));
    });
});

gulp.task('restaurant', function () {
    jsSrcRestaurantList.map(function (jsFile) {
        return browserify({
                entries: [jsFile]
            })
            .transform(babelify.configure({
                presets: ['env']
            }))
            .bundle()
            .pipe(source('restaurant.min.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./js'));
    });
});

// gZip tasks
gulp.task('gzip', ['gzip-html', 'gzip-css', 'gzip-js'], function () {});

gulp.task('gzip-html', function () {
    gulp.src('**/*.html')
        .pipe(gzip())
        .pipe(gulp.dest('./'));
});

gulp.task('gzip-css', function () {
    gulp.src('css/**/*.min.css')
        .pipe(gzip())
        .pipe(gulp.dest('css'));
});

gulp.task('gzip-js', function () {
    gulp.src('js/**/*.min.js')
        .pipe(gzip())
        .pipe(gulp.dest('js'));
});

// Build tasks
gulp.task('build', ['webp', 'styles', 'scripts', 'gzip'], function () {});

// Serve task
gulp.task('serve', function () {
    connect.server({
        root: "index.html",
        port: 9000,
        middleware: function () {
            return [
                gzipStatic(__dirname, {
                    maxAge: 31536000000
                })
            ]
        }
    });
});
