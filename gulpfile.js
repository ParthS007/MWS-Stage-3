const gulp = require('gulp');
const htmlclean = require('gulp-htmlclean');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const jsmin = require('gulp-jsmin');

const compress = require('compression');
const connect = require('gulp-connect');


const bases = {
	src: 'src/',
	dist: 'dist/'
};

const paths = {
	static: {
		images: 'img/*.jpg',
		icons: 'img/icons/*.png',
		manifest: 'manifest.json'
	},
	js_all: '**/*.js',
	js: {
		static: ['js/dbhelper.js', 'js/load_sw.js'],
		main: 'js/main.js',
		restaurant: 'js/restaurant_info.js',
		lazySizes: 'js/lazysizes.min.js',
		sw: 'sw.js',
		idb: 'js/idb.js'
	},
	css: 'css/*.css',
	html: '*.html'
}

gulp.task('html', function () {
	return gulp.src(paths.html, { cwd: bases.src })
		.pipe(htmlclean())
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest(bases.dist))
		.pipe(connect.reload());
});

gulp.task('css', function () {
	return gulp.src(paths.css, { cwd: bases.src })
		.pipe(cleanCSS())
	    .pipe(gulp.dest(bases.dist + 'css/'))
	    .pipe(connect.reload());
});

function jsTask(src, name, out_dir){
	return gulp.src(src, { cwd: bases.src })
		.pipe(concat(name))
		.pipe(gulp.dest(bases.dist + out_dir))
		.pipe(jsmin())
		.pipe(gulp.dest(bases.dist + out_dir))
		.pipe(connect.reload());
}

gulp.task('js_main', function () {
	return jsTask([...paths.js.static, paths.js.main], 'main.js', 'js/');
});

gulp.task('js_restaurant', function () {
	return jsTask([...paths.js.static, paths.js.idb, paths.js.restaurant], 'restaurant.js', 'js/');
});

gulp.task('js_lazySizes', function () {
	return jsTask(paths.js.lazySizes, 'lazysizes.js', 'js/');
});

gulp.task('sw', function () {
	return jsTask([paths.js.idb, paths.js.sw], 'sw.js', '');
});

gulp.task('js', ['js_main', 'js_restaurant', 'js_lazySizes', 'sw']);

function staticTask(src, out_dir) {
	return gulp.src(paths.static[src], { cwd: bases.src })
		.pipe(gulp.dest(bases.dist + out_dir));
}

// images are already very optimized
gulp.task('images', function() {
	return staticTask('images', 'img/');
});

gulp.task('icons', function () {
	return staticTask('icons', 'img/icons/');
});

gulp.task('manifest', function () {
	return staticTask('manifest', '');
});

gulp.task('static', ['images', 'icons', 'manifest']);

gulp.task('build', ['html', 'css', 'js', 'static']);

gulp.task('serve', ['build'], (() => {
	connect.server({
		root: [bases.dist],
		livereload: false,
		middleware: function(connect, opt) {
			return [
				compress()
			]
		},
		port: 8000
	});
}));

gulp.task('watch', ['serve'], function () {
	gulp.watch(paths.html, { cwd: bases.src }, ['html']);
	gulp.watch(paths.css, { cwd: bases.src }, ['css']);
	gulp.watch(paths.js_all, { cwd: bases.src }, ['js']);
});

gulp.task('default', ['watch']);
