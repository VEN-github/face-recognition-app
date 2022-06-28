// Initialize modules
const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const imagemin = require("gulp-imagemin");
const terser = require("gulp-terser");
const rename = require("gulp-rename");
const strip = require("gulp-strip-comments");
const browsersync = require("browser-sync").create();

// file paths
const files = {
  html: "src/html/**/*.html",
  scss: "src/scss/**/*.scss",
  img: "src/img/*",
  js: "src/js/**/*.js",
};

const { html, scss, img, js } = files; // destructuring file paths

// copy html task
const htmlTask = () => {
  return src(html).pipe(strip()).pipe(dest("dist"));
};

// scss task
const scssTask = () => {
  return src(scss, { sourcemaps: true })
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({ extname: ".min.css" }))
    .pipe(dest("dist/assets/css", { sourcemaps: "." }));
};

// image minify task
const imageminTask = () => {
  return src(img).pipe(imagemin()).pipe(dest("dist/assets/img"));
};

// js task
const jsTask = () => {
  return src(files.js, { sourcemaps: true })
    .pipe(terser())
    .pipe(rename({ extname: ".min.js" }))
    .pipe(dest("dist/assets/js", { sourcemaps: "." }));
};

// browser-sync task
const browsersyncTask = (cb) => {
  browsersync.init({
    server: {
      baseDir: "dist",
    },
  });
  cb();
};

// browser-sync reload
const browsersyncReload = (cb) => {
  browsersync.reload();
  cb();
};

// watch task
const watchTask = () => {
  watch(
    [html, scss, img, js],
    series(parallel(htmlTask, scssTask, jsTask), browsersyncReload)
  );
};

// default gulp task
exports.default = series(
  parallel(htmlTask, scssTask, imageminTask, jsTask),
  browsersyncTask,
  watchTask
);
