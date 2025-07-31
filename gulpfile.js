// Import all the CommonJS tools we need
const { src, dest, series, parallel } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const footer = require('gulp-footer');
const through = require('through2');
const sourcemaps = require('gulp-sourcemaps');
const lightningcss = require('lightningcss');
const browserslist = require('browserslist');

// Clean the 'dist' directory before a build
async function clean() {
  const { deleteAsync } = await import('del');
  return deleteAsync(['dist/']);
}

// Copy all necessary assets that don't need processing
function copyAssets() {
  return src(['lib/**/*', 'assets/**/*'], { base: '.' })
    .pipe(dest('dist'));
}

// Custom CSS transform function
function reorderAndMinifyCss() {
  return through.obj(function(file, enc, cb) {
    if (file.isNull() || !file.contents) {
      return cb(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new Error('Streaming not supported!'));
      return cb();
    }

    try {
      const css = file.contents.toString();
      // Regex to find all @import rules.
      const importRegex = /@import\s+url\(([^)]+)\);|@import\s+['"]([^'"]+)['"];/g;
      
      const imports = [];
      // Use .replace() to extract imports and remove them from the body at the same time.
      const body = css.replace(importRegex, (match) => {
        imports.push(match);
        return ''; // Return empty string to remove it from the body
      });

      // Re-assemble the CSS with all @import rules at the top.
      const reorderedCss = imports.join('\n') + '\n\n' + body;

      // Now, minify the reordered (and valid) CSS string.
      let { code, map } = lightningcss.transform({
        filename: file.path,
        code: Buffer.from(reorderedCss),
        minify: true,
        sourceMap: true,
        targets: lightningcss.browserslistToTargets(browserslist())
      });

      file.contents = code;
      if (map) {
        file.sourceMap = JSON.parse(map.toString());
      }
      cb(null, file);

    } catch (err) {
      this.emit('error', new Error(err.message));
      cb();
    }
  });
}
  
// The main build task, which remains almost the same!
function build() {
  return src('index.html')
    .pipe(sourcemaps.init())
    .pipe(useref()) // This will process both JS and CSS build blocks
    .pipe(gulpif('*.js', footer(';')))
    .pipe(gulpif('*.js', terser({ ecma: 2020 })))
    .pipe(gulpif('*.css', reorderAndMinifyCss())) // Use our new custom function
    .pipe(gulpif('*.html', htmlmin({ collapseWhitespace: true, removeComments: true })))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist'));
}

// When gulp, run 'clean' first, then run 'build' and 'copyAssets' in parallel
exports.default = series(clean, parallel(build, copyAssets));