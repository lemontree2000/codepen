const { src, dest, parallel, watch, series } = require("gulp");
const less = require("gulp-less");
const gulpIf = require("gulp-if");
const del = require("delete");
const ghPage = require("gh-pages");
const gls = require("gulp-live-server");
const LessFunctionPlugin = require("less-plugin-functions");
const lessFn = new LessFunctionPlugin();
/**
 * 处理js文件
 */
function javascriptTask() {
  return src("./src/js/*.js").pipe(dest("./dist/js/"));
}
/**
 * 处理less文件
 */
function lessTask() {
  return src("./src/style/*.less")
    .pipe(less({
      plugins: [lessFn]
    }))
    .pipe(dest("./dist/style/"));
}

function isIndexCondition(file) {
  return file.basename === "index.html";
}

/**
 * 处理html文件
 */
function htmlTask() {
  return src("./src/page/*.html")
    .pipe(src("./src/index.html"))
    .pipe(gulpIf(isIndexCondition, dest("./dist/"), dest("./dist/page/")));
}

/**
 * 处理图片文件
 */
function imageTask() {
  return src("./src/image/**").pipe(dest("./dist/image/"));
}

/**
 * 清空dist目录
 */
function clean(cb) {
  del("./dist", err => {
    cb(err);
  });
}

function devTask() {
  const server = gls.static("dist", 8888);
  server.start();

  watch(
    "./src/**",
    { ignoreInitial: false },
    parallel(javascriptTask, lessTask, htmlTask, imageTask)
  );
}

function publishPage(cb) {
  ghPage.publish("./dist", err => {
    cb(err);
  });
}

exports.build = series(clean, javascriptTask, lessTask, htmlTask, imageTask);

exports.dev = devTask;

exports.publish = publishPage;
