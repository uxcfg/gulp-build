const { src, dest } = require('gulp');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cssbeautify = require('gulp-cssbeautify');
const removeComments = require('gulp-strip-css-comments');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const cssnano = require('gulp-cssnano');
const rigger = require('gulp-rigger');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const del = require('del');
const browsersync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const postcssImport = require('postcss-import');
const fileInclude = require('gulp-file-include');

/* Paths */
var path = {
	build: {
		html: 'dist/',
		js: 'dist/js/',
		css: 'dist/css/',
		images: 'dist/img/',
	},
	src: {
		html: 'src/*.html',
		js: 'src/js/*.js',
		css: 'src/sass/style.scss',
		images: 'src/img/**/*.{jpg,png,svg,gif,ico}',
	},
	watch: {
		html: 'src/**/*.html',
		js: 'src/js/**/*.js',
		css: 'src/sass/**/*.scss',
		images: 'src/img/**/*.{jpg,png,svg,gif,ico}',
	},
	clean: './dist',
};

function reload(done) {
	browsersync.reload();
	done();
}

function browserSync(done) {
	browsersync.init({
		server: {
			baseDir: 'dist/',
		},
		port: 3000,
	});

	done();
}

function html() {
	return src(path.src.html, { base: 'src/' })
		.pipe(plumber())
		.pipe(fileInclude({
			prefix: '@@',
			basepath: '@file'
		}))
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function css() {
	return src(path.src.css, { base: 'src/sass/' })
		.pipe(plumber())
		.pipe(sass())
		.pipe(postcss([postcssImport()]))
		.pipe(autoprefixer(['last 8 versions'], { cascade: true }))
		.pipe(cssbeautify())
		.pipe(dest(path.build.css))
		.pipe(
			cssnano({
				zindex: false,
				discardComments: {
					removeAll: true,
				},
			})
		)
		.pipe(removeComments())
		.pipe(
			rename({
				suffix: '.min',
				extname: '.css',
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js, { base: './src/js/' })
		.pipe(plumber())
		.pipe(rigger())
		.pipe(gulp.dest(path.build.js))
		.pipe(uglify())
		.pipe(
			rename({
				suffix: '.min',
				extname: '.js',
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream());
}

function images() {
	return src(path.src.images).pipe(imagemin()).pipe(dest(path.build.images));
}

function clean() {
	return del(path.clean);
}

function watchFiles() {
	gulp.watch([path.watch.html], gulp.series(html, reload));
	gulp.watch([path.watch.css], gulp.series(css, reload));
	gulp.watch([path.watch.js], gulp.series(js, reload));
	gulp.watch([path.watch.images], gulp.series(images, reload));
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images));
const watch = gulp.parallel(build, watchFiles, browserSync);

/* Exports Tasks */
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
