// Initialize modules
const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const imagemin = require("gulp-imagemin");
// const concat = require("gulp-concat");
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

// copy html task
function htmlTask() {
  return src(files.html).pipe(strip()).pipe(dest("dist"));
}

// scss task
function scssTask() {
  return src(files.scss, { sourcemaps: true })
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({ extname: ".min.css" }))
    .pipe(dest("dist/assets/css", { sourcemaps: "." }));
}

// image minify task
function imageminTask() {
  return src(files.img).pipe(imagemin()).pipe(dest("dist/assets/img"));
}

// js task
function jsTask() {
  return (
    src(files.js, { sourcemaps: true })
      //.pipe(concat("main.js"))
      .pipe(terser())
      .pipe(rename({ extname: ".min.js" }))
      .pipe(dest("dist/assets/js", { sourcemaps: "." }))
  );
}

// browser-sync task
function browsersyncTask(cb) {
  browsersync.init({
    server: {
      baseDir: "dist",
    },
  });
  cb();
}

// browser-sync reload
function browsersyncReload(cb) {
  browsersync.reload();
  cb();
}

// watch task
function watchTask() {
  watch(
    [files.html, files.scss, files.img, files.js],
    series(parallel(htmlTask, scssTask, jsTask), browsersyncReload)
  );
}

// default gulp task
exports.default = series(
  parallel(htmlTask, scssTask, imageminTask, jsTask),
  browsersyncTask,
  watchTask
);
