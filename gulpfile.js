// Import all the CommonJS tools we need
const { src, dest, series, parallel } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');

// Clean the 'dist' directory before a build
async function clean() {
  const { deleteAsync } = await import('del');
  return deleteAsync(['dist/']);
}

// Copy all necessary assets that don't need processing
function copyAssets() {
  // We copy the entire 'lib' directory and 'assets' directory
  // { base: '.' } preserves the directory structure (e.g., 'lib/ace/...')
  return src(['lib/**/*', 'assets/**/*'], { base: '.' })
    .pipe(dest('dist'));
}
  
// The main build task
function build() {
  return src('index.html')
    .pipe(sourcemaps.init())
    .pipe(useref())
    .pipe(gulpif('*.js', terser({ ecma: 2020  })))
    // .pipe(gulpif('*.css', cleanCSS({ level: 0 })))
    .pipe(gulpif('*.html', htmlmin({ collapseWhitespace: true, removeComments: true })))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist'));
}

// When gulp, run 'clean' first, then run 'build' and 'copyAssets' in parallel
exports.default = series(clean, parallel(build, copyAssets));
