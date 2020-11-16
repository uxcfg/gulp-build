const { src, dest } = require("gulp");
const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const cssbeautify = require("gulp-cssbeautify");
const removeComments = require("gulp-strip-css-comments");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const cleanCss = require("gulp-clean-css");
const rigger = require("gulp-rigger");
const uglify = require("gulp-uglify");
const plumber = require("gulp-plumber");
const imagemin = require("gulp-imagemin");
const del = require("del");
const browsersync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const postcssImport = require("postcss-import");
const fileInclude = require("gulp-file-include");
const spriteSvg = require("gulp-svg-sprite");
const notify = require("gulp-notify");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");

/* Paths */
var path = {
	build: {
		html: "dist/",
		js: "dist/js/",
		css: "dist/css/",
		images: "dist/img/",
	},
	src: {
		html: "src/*.html",
		js: "src/js/main.js",
		css: "src/sass/style.scss",
		images: "src/img/**/*.{jpg,png,gif,ico}",
	},
	watch: {
		html: "src/**/*.html",
		js: "src/js/**/*.js",
		css: "src/sass/**/*.scss",
		images: "src/img/**/*.{jpg,png,gif,ico}",
		svgImg: "src/img/**/*.svg",
	},
	clean: "./dist",
};

function svgSprite() {
	return src("src/img/**/*.svg")
		.pipe(
			spriteSvg({
				mode: {
					stack: {
						sprite: "../sprite.svg",
					},
				},
			})
		)
		.pipe(dest(path.build.images));
}

function reload(done) {
	browsersync.reload();
	done();
}

function browserSync(done) {
	browsersync.init({
		server: {
			baseDir: "dist/",
		},
		port: 3000,
	});

	done();
}

function html() {
	return src(path.src.html, { base: "src/" })
		.pipe(plumber())
		.pipe(
			fileInclude({
				prefix: "@",
				basepath: "@file",
			})
		)
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function css() {
	return src(path.src.css, { base: "src/sass/" })
		.pipe(plumber())
		.pipe(sass().on("error", notify.onError()))
		.pipe(postcss([postcssImport()]))
		.pipe(autoprefixer(["last 8 versions"], { cascade: true }))
		.pipe(cssbeautify())
		.pipe(dest(path.build.css))
		.pipe(cleanCss({ level: 2 }))
		.pipe(removeComments())
		.pipe(
			rename({
				suffix: ".min",
				extname: ".css",
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js, { base: "./src/js/" })
		.pipe(plumber())
		.pipe(
			webpackStream({
				mode: "development",
				output: {
					filename: "main.js",
				},
				module: {
					rules: [
						{
							test: /\.m?js$/,
							exclude: /(node_modules|bower_components)/,
							use: {
								loader: "babel-loader",
								options: {
									presets: ["@babel/preset-env"],
								},
							},
						},
					],
				},
			})
		)
		.on("error", function (err) {
			console.error("WEBPACK ERROR", err);
			this.emit("end"); // Don't stop the rest of the task
		})
		.pipe(rigger())
		.pipe(gulp.dest(path.build.js))
		.pipe(uglify().on("error", notify.onError()))
		.pipe(
			rename({
				suffix: ".min",
				extname: ".js",
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
	gulp.watch([path.watch.svgImg], gulp.series(svgSprite, reload));
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, svgSprite));
const watch = gulp.parallel(build, watchFiles, browserSync);

/* Exports Tasks */
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.svgSprite = svgSprite;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
