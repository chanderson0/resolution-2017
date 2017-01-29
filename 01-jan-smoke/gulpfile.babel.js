// @flow weak

import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import browserify from 'browserify';
import watchify from 'watchify';
import babelify from 'babelify';

function compile(debug: boolean, watch: boolean) {
  const bundler = watchify(browserify('./src/index.js', { debug }));
  bundler.transform([babelify]);

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(gulpif(debug, sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(debug, sourcemaps.write('./')))
      // TODO: minify
      .pipe(gulp.dest('./public'))
      .pipe(gulpif(watch, livereload()));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  } else {
    bundler.on('end', function() {
      console.log('Done!');
    });
  }

  return rebundle();
}

gulp.task('build', function() { return compile(true, false); });
gulp.task('watch', function() {
  livereload.listen();
  return compile(true, true);
});
gulp.task('package', function() { return compile(false, false); });

gulp.task('default', ['watch']);
