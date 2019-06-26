var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');


/**
 * different version task
 * minimist
 **/
var opts={
  string: 'env',
  default: { env: 'develop'}
}
var options = minimist(process.argv.slice(2),opts);
console.log(options)


gulp.task('copyHTML',function(){
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
})
 
/**
 * clean file
 * gulp-clean
 **/
gulp.task('clean', function () {
  return gulp.src(['./.tmp','./dist'], {read: false})
      .pipe($.clean());
});


/**
 * jade task
 * gulp-jade, gulp-plumber, brower-sync
 **/
gulp.task('jade', function() {
  // var YOUR_LOCALS = {};
  gulp.src('./source/**/*.jade')
  .pipe($.plumber())
  .pipe($.jade({
    pretty: true,
    // locals: YOUR_LOCALS
  }))
  .pipe(gulp.dest('./dist/'))
  .pipe(browserSync.stream());
});
 
/**
 * sass task
 * gulp-sass, gulp-plumber, gulp-postcss, autoprefixer, gulp-soucemaps, brower-sync
 **/
gulp.task('sass', function () {
  var plugins = [
    autoprefixer({browsers: ['last 3 versions','ie 6-8']}),
  ];
  return gulp.src('./source/sass/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === "production", $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream());
});
 
/**
 * babel task
 * gulp-babel, gulp-soucemaps, brower-sync, gulp-concat
 **/
gulp.task('babel', () =>
  gulp.src('./source/js/**/*.js')
      .pipe($.sourcemaps.init())
      .pipe($.babel({
          presets: ['@babel/env']
      }))
      .pipe($.concat('all.js'))
      .pipe($.if(options.env === "production", $.uglify({
        compress: {
          drop_console: true
        }
      })))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest('./dist/js'))
      .pipe(browserSync.stream())
);

/**
 * bower task
 * main-bower-files
 **/
gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
      .pipe(gulp.dest('./.tmp/vendors'))
});

/**
 * after bower task
 * gulp-concat, gulp-uglify
 **/
gulp.task('vendors',function(){
  return gulp.src('./.tmp/vendors/**/*.js')
          .pipe($.concat('vendors.js'))
          .pipe($.if(options.env === "production", $.uglify()))
          .pipe(gulp.dest('./dist/js'))
})

/**
 * compress images task
 * gulp-imagemin, gulp-if
 **/
gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if(options.env === "production", $.imagemin()))
        .pipe(gulp.dest('dist/images'))
);

/**
 * web server task
 * browser-sync
 **/
gulp.task('browser-sync', function() {
  browserSync.init({
      server: {
          baseDir: "./dist",
          reloadDebounce: 5000
      }
  });
});

gulp.task('deploy', function() {
  return gulp.src('./dist/**/*')
    .pipe($.ghPages());
});


/**
 * watch task
 **/
gulp.task('watch', function () {
  gulp.watch('./sass/**/*.scss', gulp.series('sass'));
  gulp.watch('./source/**/*.jade', gulp.series('jade'));
  gulp.watch('./source/js/**/*.js', gulp.series('babel'));
});

/**
 * production release task
 **/
gulp.task('build', gulp.series('clean', gulp.parallel('jade', 'sass','babel',gulp.series('bower','vendors'))))

/**
 * develop (default) task
 **/
gulp.task('default', gulp.parallel('jade', 'sass','babel',gulp.series('bower','vendors'),'image-min','browser-sync' ,'watch'))

