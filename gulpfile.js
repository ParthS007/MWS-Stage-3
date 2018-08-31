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

var jsSrcMainList = ['js/dbhelper.js', 'js/main.js'];
var jsSrcRestaurantList = ['js/dbhelper.js', 'js/restaurant_info.js'];

gulp.task('webp', () =>
    gulp.src('img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('img/webp'))
);

gulp.task('scripts', ['index', 'restaurant'], function () { });

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
            .pipe(sourcemaps.init({ loadMaps: true }))
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

gulp.task('styles', function () {
    gulp.src('css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('./css'));
});
